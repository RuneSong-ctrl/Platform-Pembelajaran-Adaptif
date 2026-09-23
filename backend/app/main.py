import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, check_and_migrate_db
from app.api.v1.router import api_router
from app.services.seed_service import seed_initial_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("eduadapt.api")

# Create Database tables & run schema migration check
Base.metadata.create_all(bind=engine)
check_and_migrate_db()

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
    allow_origins=settings.CORS_ORIGINS,  # production frontend URL must be listed in .env
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi import Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.auth import media_user, require_class_access
from app.core.database import get_db
from app.models.classroom import Classroom
from app.models.document import GroundedDocument
from app.models.user import User

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

os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

@app.get("/uploads/{path:path}", include_in_schema=False)
def serve_upload(path: str, db: Session = Depends(get_db), user: User = Depends(media_user)):
    """Uploaded/generated files are class material: only that class's teacher and students may open them."""
    root = Path(settings.UPLOADS_DIR).resolve()
    file = (root / path).resolve()
    if not file.is_relative_to(root) or not file.is_file():
        raise HTTPException(404, "File tidak ditemukan.")
    # Every stored file is named "<document id>_...", and ids themselves contain "_" (doc_ab12cd34).
    parts = file.name.split("_")
    doc = next((d for i in range(1, len(parts)) if (d := db.get(GroundedDocument, "_".join(parts[:i])))), None)
    if not doc:
        raise HTTPException(404, "File tidak ditemukan.")
    require_class_access(db.get(Classroom, doc.classroom_id), user)
    return FileResponse(file)

# Mount API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

