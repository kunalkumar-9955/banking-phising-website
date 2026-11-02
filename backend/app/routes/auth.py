"""
PhishGuard AI - Authentication Routes
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
import httpx

from app.models import (
    UserCreate, UserLogin, GoogleAuthRequest, OTPVerify,
    ForgotPassword, ResetPassword, TokenResponse, UserResponse,
    ProfileUpdate
)
from app.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, generate_otp
)
from app.security import limiter
from app.database import get_database
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "user"),
        is_verified=user.get("is_verified", False),
        avatar=user.get("avatar"),
        created_at=user.get("created_at", datetime.now(timezone.utc))
    )


@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(user_data: UserCreate):
    db = get_database()

    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    otp = generate_otp()
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "role": "user",
        "is_verified": False,
        "avatar": None,
        "otp": otp,
        "otp_created_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Generate token
    token = create_access_token({"sub": user_data.email, "role": "user"})

    return TokenResponse(
        access_token=token,
        user=user_to_response(user_doc)
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": user["email"], "role": user.get("role", "user")})

    return TokenResponse(
        access_token=token,
        user=user_to_response(user)
    )


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
async def google_auth(data: GoogleAuthRequest):
    """Verify Firebase ID Token using Firebase REST API and create/find user."""
    db = get_database()

    try:
        # Use Firebase's accounts:lookup API — the correct way to verify Firebase ID tokens
        # without the Admin SDK. Uses the Web API Key (public, safe to use here).
        firebase_api_key = settings.FIREBASE_WEB_API_KEY
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={firebase_api_key}",
                json={"idToken": data.token},
                timeout=10.0
            )

        if resp.status_code != 200:
            error_detail = resp.json().get("error", {}).get("message", "Invalid token")
            raise HTTPException(status_code=401, detail=f"Firebase token invalid: {error_detail}")

        resp_data = resp.json()
        users_list = resp_data.get("users", [])
        if not users_list:
            raise HTTPException(status_code=401, detail="No user found for this token")

        firebase_user = users_list[0]
        email = firebase_user.get("email")
        name = firebase_user.get("displayName") or (email.split("@")[0] if email else "User")
        avatar = firebase_user.get("photoUrl")

        if not email:
            raise HTTPException(status_code=401, detail="Email not available in Firebase account")

        # Find or create user in MongoDB
        user = await db.users.find_one({"email": email})
        if not user:
            user_doc = {
                "name": name,
                "email": email,
                "password": get_password_hash("firebase-google-user"),
                "role": "user",
                "is_verified": True,
                "avatar": avatar,
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
            result = await db.users.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            user = user_doc
        else:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"avatar": avatar, "name": name, "updated_at": datetime.now(timezone.utc)}}
            )

        token = create_access_token({"sub": email, "role": user.get("role", "user")})
        return TokenResponse(access_token=token, user=user_to_response(user))

    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=401, detail=f"Could not reach Firebase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")


@router.post("/verify-otp")
async def verify_otp(data: OTPVerify):
    db = get_database()
    user = await db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "otp": None}}
    )

    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
@limiter.limit("10/minute")
async def forgot_password(data: ForgotPassword):
    db = get_database()
    user = await db.users.find_one({"email": data.email})

    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, an OTP has been sent"}

    otp = generate_otp()
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"otp": otp, "otp_created_at": datetime.now(timezone.utc)}}
    )

    # In production, send email with OTP
    return {"message": "OTP sent to your email", "otp": otp}  # Remove otp in production


@router.post("/reset-password")
@limiter.limit("10/minute")
async def reset_password(data: ResetPassword):
    db = get_database()
    user = await db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password": get_password_hash(data.new_password),
            "otp": None,
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    update_data = {"updated_at": datetime.now(timezone.utc)}

    if data.name:
        update_data["name"] = data.name
    if data.avatar:
        update_data["avatar"] = data.avatar

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )

    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    return user_to_response(updated_user)
