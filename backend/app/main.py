import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.services.seed_service import seed_initial_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("eduadapt.api")

# Create Database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial data
    logger.info("Starting up EduAdapt API server...")
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield
    logger.info("Shutting down EduAdapt API server...")

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API Terpadu Platform E-Learning Adaptif K-12 Berbasis AI Brain & Blockchain Vault",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all for seamless frontend binding
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check Endpoint
@app.get("/", tags=["Health Check"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }

# Mount API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
