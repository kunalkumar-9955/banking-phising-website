"""
PhishGuard AI - Scan Routes
URL scanning and phishing detection endpoints.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from app.models import ScanRequest, ScanResult, ScanHistoryItem, FeedbackCreate
from app.auth import get_current_user
from app.database import get_database
from app.ml.feature_extractor import FeatureExtractor
from app.ml.classifier import classifier
from app.security import limiter

router = APIRouter(prefix="/api/scan", tags=["Scanning"])
extractor = FeatureExtractor()


@router.post("/url")
@limiter.limit("15/minute")
async def scan_url(data: ScanRequest, current_user: dict = Depends(get_current_user)):
    """Scan a URL for phishing indicators."""
    db = get_database()
    url = data.url.strip()

    # Validate URL
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    # Check blocked domains
    from urllib.parse import urlparse
    parsed = urlparse(url)
    domain = parsed.netloc
    blocked = await db.blocked_domains.find_one({"domain": domain})
    if blocked:
        # Return immediate phishing result
        scan_doc = {
            "user_id": str(current_user["_id"]),
            "url": url,
            "domain": domain,
            "status": "phishing",
            "confidence": 99.9,
            "threat_level": "critical",
            "risk_score": 100.0,
            "features": [{
                "name": "Blocked Domain",
                "value": "This domain is in our blocklist",
                "risk_level": "danger",
                "description": f"Domain {domain} has been identified and blocked as a known phishing domain."
            }],
            "domain_info": {"domain": domain},
            "ssl_info": {},
            "association_rules": [],
            "created_at": datetime.now(timezone.utc),
        }
        result = await db.scans.insert_one(scan_doc)
        scan_doc["id"] = str(result.inserted_id)
        scan_doc["_id"] = str(result.inserted_id)
        return scan_doc

    try:
        # Extract features
        extraction = extractor.extract_all_features(url)
        features = extraction["features"]
        details = extraction["details"]
        ssl_info = extraction.get("ssl_info", {})
        domain_info = extraction.get("domain_info", {})

        # Convert to binary features
        binary_features = extractor.features_to_binary(features)

        # Run classifier
        prediction = classifier.predict(binary_features)

        # Build scan document
        scan_doc = {
            "user_id": str(current_user["_id"]),
            "url": url,
            "domain": domain,
            "status": prediction["prediction"],
            "confidence": prediction["confidence"],
            "threat_level": prediction["threat_level"],
            "risk_score": prediction["risk_score"],
            "features": details,
            "domain_info": domain_info,
            "ssl_info": ssl_info,
            "class_probabilities": prediction["class_probabilities"],
            "association_rules": prediction["matching_rules"][:5],
            "binary_features": binary_features,
            "created_at": datetime.now(timezone.utc),
        }

        # Save to database
        result = await db.scans.insert_one(scan_doc)
        scan_doc["id"] = str(result.inserted_id)
        scan_doc["_id"] = str(result.inserted_id)

        # Log admin activity
        await db.admin_logs.insert_one({
            "action": "url_scanned",
            "user_id": str(current_user["_id"]),
            "url": url,
            "result": prediction["prediction"],
            "confidence": prediction["confidence"],
            "created_at": datetime.now(timezone.utc),
        })

        return scan_doc

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@router.get("/history")
async def get_scan_history(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get user's scan history."""
    db = get_database()
    skip = (page - 1) * limit

    cursor = db.scans.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).skip(skip).limit(limit)

    scans = []
    async for scan in cursor:
        scans.append({
            "id": str(scan["_id"]),
            "url": scan["url"],
            "status": scan["status"],
            "confidence": scan["confidence"],
            "risk_score": scan.get("risk_score", 0.0),
            "threat_level": scan["threat_level"],
            "created_at": scan["created_at"].isoformat(),
        })

    total = await db.scans.count_documents({"user_id": str(current_user["_id"])})

    return {
        "scans": scans,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/result/{scan_id}")
async def get_scan_result(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed scan result."""
    db = get_database()

    try:
        scan = await db.scans.find_one({"_id": ObjectId(scan_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scan ID")

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan["user_id"] != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    scan["id"] = str(scan["_id"])
    scan["_id"] = str(scan["_id"])
    if isinstance(scan.get("created_at"), datetime):
        scan["created_at"] = scan["created_at"].isoformat()

    return scan


@router.post("/feedback")
async def submit_feedback(data: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    """Submit feedback on scan accuracy."""
    db = get_database()

    feedback_doc = {
        "scan_id": data.scan_id,
        "user_id": str(current_user["_id"]),
        "is_correct": data.is_correct,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc),
    }

    await db.feedback.insert_one(feedback_doc)
    return {"message": "Feedback submitted successfully"}


@router.delete("/history/{scan_id}")
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a scan from history."""
    db = get_database()

    result = await db.scans.delete_one({
        "_id": ObjectId(scan_id),
        "user_id": str(current_user["_id"])
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {"message": "Scan deleted"}
