
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import engine
from app.core.logging import setup_logging
from app.routers import auth, users

setup_logging()

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Doc Intellect AI API")
    yield
    logger.info("Shutting down Doc Intellect AI API")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered document assistant with RAG",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/", tags=["System"])
def home():
    logger.info("Home endpoint requested")
    return {
        "message": "Welcome to Doc Intellect AI API",
        "status": "running",
    }


@app.get("/health", tags=["System"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "service": settings.app_name,
            "environment": settings.app_env,
            "database": "connected",
        }
    except Exception:
        logger.exception("Health check failed")
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )
