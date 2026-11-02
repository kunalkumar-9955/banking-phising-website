from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "phishguard"

    # JWT
    SECRET_KEY: str = "phishguard-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # API Keys
    VIRUSTOTAL_API_KEY: Optional[str] = None

    # Firebase (for verifying Firebase ID tokens without Admin SDK)
    FIREBASE_WEB_API_KEY: str = ""
    FIREBASE_PROJECT_ID: str = "phishguradai"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
