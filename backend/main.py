"""
PhishGuard AI - Main FastAPI Application
Detecting E-Banking Phishing Websites Using Associative Classification
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager
import urllib3

from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, scan, admin
from app.ml.classifier import classifier
from app.security import limiter

# Suppress SSL warnings for feature extraction
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    # Train ML model if not already trained
    if not classifier.is_trained:
        print("🧠 Training initial ML model...")
        classifier.train()
    print("🚀 PhishGuard AI Backend is running!")
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="PhishGuard AI",
    description="AI-Powered E-Banking Phishing Website Detection using Associative Classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def csrf_protect(request: Request, call_next):
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        origin = request.headers.get("origin") or request.headers.get("referer")
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://phishguardai.web.app",
            "https://phishguard.ai",
        ]
        if origin and not any(origin.startswith(o) for o in allowed_origins):
            return JSONResponse({"detail": "Invalid request origin"}, status_code=403)
    return await call_next(request)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {
        "name": "PhishGuard AI",
        "version": "1.0.0",
        "status": "running",
        "description": "AI-Powered E-Banking Phishing Website Detection",
        "model_status": "trained" if classifier.is_trained else "not_trained",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model_trained": classifier.is_trained,
        "model_stats": classifier.get_model_stats(),
    }
