
import logging

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.schemas.user import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])

        if user_id <= 0:
            raise ValueError("Invalid user ID")

    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    logger.info("Current user profile requested", extra={
        "extra_data": {"user_id": current_user.id}
    })

    return current_user
