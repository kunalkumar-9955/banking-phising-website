"""
PhishGuard AI - Admin Routes
Admin dashboard and management endpoints.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from app.models import BlockedDomainCreate, AdminStats
from app.auth import get_admin_user, get_current_user
from app.database import get_database
from app.ml.classifier import classifier

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard statistics."""
    db = get_database()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = await db.users.count_documents({})
    total_scans = await db.scans.count_documents({})

    phishing_today = await db.scans.count_documents({
        "status": "phishing",
        "created_at": {"$gte": today_start}
    })
    suspicious_today = await db.scans.count_documents({
        "status": "suspicious",
        "created_at": {"$gte": today_start}
    })
    legitimate_today = await db.scans.count_documents({
        "status": "legitimate",
        "created_at": {"$gte": today_start}
    })

    blocked_domains = await db.blocked_domains.count_documents({})

    # Recent scans
    recent_cursor = db.scans.find().sort("created_at", -1).limit(10)
    recent_scans = []
    async for scan in recent_cursor:
        recent_scans.append({
            "id": str(scan["_id"]),
            "url": scan["url"],
            "status": scan["status"],
            "confidence": scan["confidence"],
            "user_id": scan["user_id"],
            "created_at": scan["created_at"].isoformat() if isinstance(scan["created_at"], datetime) else scan["created_at"],
        })

    # Weekly trends
    weekly_data = []
    for i in range(7):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = await db.scans.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        phish_count = await db.scans.count_documents({
            "status": "phishing",
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        weekly_data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "total": count,
            "phishing": phish_count,
        })

    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "phishing_today": phishing_today,
        "suspicious_today": suspicious_today,
        "legitimate_today": legitimate_today,
        "blocked_domains": blocked_domains,
        "recent_scans": recent_scans,
        "weekly_trends": list(reversed(weekly_data)),
        "model_stats": classifier.get_model_stats(),
    }


@router.get("/users")
async def get_users(
    admin: dict = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all users (admin only)."""
    db = get_database()
    skip = (page - 1) * limit

    cursor = db.users.find(
        {}, {"password": 0, "otp": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)

    users = []
    async for user in cursor:
        scan_count = await db.scans.count_documents({"user_id": str(user["_id"])})
        users.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "is_verified": user.get("is_verified", False),
            "scan_count": scan_count,
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
        })

    total = await db.users.count_documents({})
    return {"users": users, "total": total, "page": page}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str = Query(..., regex="^(user|admin)$"),
    admin: dict = Depends(get_admin_user)
):
    """Update user role."""
    db = get_database()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User role updated to {role}"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user."""
    db = get_database()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Also delete user's scans
    await db.scans.delete_many({"user_id": user_id})
    return {"message": "User and associated scans deleted"}


@router.get("/blocked-domains")
async def get_blocked_domains(admin: dict = Depends(get_admin_user)):
    """Get all blocked domains."""
    db = get_database()
    cursor = db.blocked_domains.find().sort("created_at", -1)

    domains = []
    async for domain in cursor:
        domains.append({
            "id": str(domain["_id"]),
            "domain": domain["domain"],
            "reason": domain.get("reason", ""),
            "created_at": domain["created_at"].isoformat() if isinstance(domain.get("created_at"), datetime) else str(domain.get("created_at", "")),
        })

    return {"domains": domains}


@router.post("/blocked-domains")
async def add_blocked_domain(data: BlockedDomainCreate, admin: dict = Depends(get_admin_user)):
    """Add a domain to blocklist."""
    db = get_database()

    existing = await db.blocked_domains.find_one({"domain": data.domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already blocked")

    doc = {
        "domain": data.domain,
        "reason": data.reason,
        "added_by": str(admin["_id"]),
        "created_at": datetime.now(timezone.utc),
    }
    await db.blocked_domains.insert_one(doc)

    await db.admin_logs.insert_one({
        "action": "domain_blocked",
        "admin_id": str(admin["_id"]),
        "domain": data.domain,
        "created_at": datetime.now(timezone.utc),
    })

    return {"message": f"Domain {data.domain} blocked successfully"}


@router.delete("/blocked-domains/{domain_id}")
async def remove_blocked_domain(domain_id: str, admin: dict = Depends(get_admin_user)):
    """Remove a domain from blocklist."""
    db = get_database()
    result = await db.blocked_domains.delete_one({"_id": ObjectId(domain_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blocked domain not found")
    return {"message": "Domain removed from blocklist"}


@router.post("/retrain-model")
async def retrain_model(admin: dict = Depends(get_admin_user)):
    """Retrain the ML model."""
    try:
        stats = classifier.train()

        await db_log_action(admin, "model_retrained", str(stats))

        return {
            "message": "Model retrained successfully",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


@router.get("/logs")
async def get_admin_logs(
    admin: dict = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get admin activity logs."""
    db = get_database()
    skip = (page - 1) * limit

    cursor = db.admin_logs.find().sort("created_at", -1).skip(skip).limit(limit)

    logs = []
    async for log in cursor:
        logs.append({
            "id": str(log["_id"]),
            "action": log["action"],
            "details": {k: v for k, v in log.items() if k not in ["_id", "action", "created_at"]},
            "created_at": log["created_at"].isoformat() if isinstance(log.get("created_at"), datetime) else str(log.get("created_at", "")),
        })

    total = await db.admin_logs.count_documents({})
    return {"logs": logs, "total": total, "page": page}


@router.get("/all-scans")
async def get_all_scans(
    admin: dict = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None)
):
    """Get all scans (admin only)."""
    db = get_database()
    skip = (page - 1) * limit

    query = {}
    if status_filter:
        query["status"] = status_filter

    cursor = db.scans.find(query).sort("created_at", -1).skip(skip).limit(limit)

    scans = []
    async for scan in cursor:
        scans.append({
            "id": str(scan["_id"]),
            "url": scan["url"],
            "domain": scan.get("domain", ""),
            "status": scan["status"],
            "confidence": scan["confidence"],
            "threat_level": scan.get("threat_level", ""),
            "user_id": scan["user_id"],
            "created_at": scan["created_at"].isoformat() if isinstance(scan.get("created_at"), datetime) else str(scan.get("created_at", "")),
        })

    total = await db.scans.count_documents(query)
    return {"scans": scans, "total": total, "page": page}


async def db_log_action(admin: dict, action: str, details: str = ""):
    db = get_database()
    await db.admin_logs.insert_one({
        "action": action,
        "admin_id": str(admin["_id"]),
        "details": details,
        "created_at": datetime.now(timezone.utc),
    })
