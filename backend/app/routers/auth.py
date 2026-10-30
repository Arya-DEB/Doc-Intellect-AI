
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth import (
    authenticate_user,
    get_user_by_email,
    register_user,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if len(data.full_name.strip()) < 2:
        raise HTTPException(
            status_code=422,
            detail="Full name must contain at least 2 characters",
        )

    if get_user_by_email(db, str(data.email)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    try:
        user = register_user(db, data)
    except IntegrityError:
        db.rollback()
        # Handles a duplicate email inserted concurrently.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    logger.info("User registered", extra={
        "extra_data": {"user_id": user.id}
    })

    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, str(data.email), data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or inactive account",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)

    logger.info("User logged in", extra={
        "extra_data": {"user_id": user.id}
    })

    return TokenResponse(access_token=token)
