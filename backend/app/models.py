from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole = UserRole.USER
    is_verified: bool = False
    avatar: Optional[str] = None
    created_at: datetime


class GoogleAuthRequest(BaseModel):
    token: str


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ScanRequest(BaseModel):
    url: str = Field(..., min_length=5)


class FeatureDetail(BaseModel):
    name: str
    value: str
    risk_level: str  # safe, warning, danger
    description: str


class ScanResult(BaseModel):
    id: str
    url: str
    status: str  # legitimate, suspicious, phishing
    confidence: float
    threat_level: str  # low, medium, high, critical
    risk_score: float
    features: List[FeatureDetail]
    domain_info: dict
    ssl_info: dict
    association_rules: List[dict]
    created_at: datetime


class ScanHistoryItem(BaseModel):
    id: str
    url: str
    status: str
    confidence: float
    threat_level: str
    created_at: datetime


class ReportCreate(BaseModel):
    scan_id: str
    notes: Optional[str] = None


class FeedbackCreate(BaseModel):
    scan_id: str
    is_correct: bool
    comment: Optional[str] = None


class AdminStats(BaseModel):
    total_users: int
    total_scans: int
    phishing_today: int
    suspicious_today: int
    legitimate_today: int
    high_risk_domains: int
    recent_scans: List[dict]


class BlockedDomainCreate(BaseModel):
    domain: str
    reason: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
