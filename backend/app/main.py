from dotenv import load_dotenv

load_dotenv()  # must run before the app imports so LangSmith sees .env

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.cloudinary_config import init_cloudinary
from app.core.config import get_settings
from app.core.database import engine
from app.core.logging import setup_logging
from app.routers import auth, users, chat, conversations
from app.routers.documents import router as documents_router

setup_logging()

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Doc Intellect AI API")
    init_cloudinary()
    yield
    logger.info("Shutting down Doc Intellect AI API")


app = FastAPI(
    title=settings.app_name,
    description="AI-powered document assistant with RAG",
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
@app.get("/", tags=["Health"])
def home():
    return {
        "message": "Welcome to Doc Intellect AI API",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:
        logger.exception("Health check failed")

        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
            },
        )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents_router)
app.include_router(chat.router)
app.include_router(conversations.router)

# ... home() and health_check() unchanged