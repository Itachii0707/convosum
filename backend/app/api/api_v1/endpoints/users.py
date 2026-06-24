from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()


@router.post("/", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """Create a new user."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_superuser=user_in.is_superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserSchema)
def read_user_me(
    db: Session = Depends(deps.get_db),  # noqa: ARG001
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get the current authenticated user."""
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update current user profile."""
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name  # type: ignore[assignment]
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(  # type: ignore[assignment]
            user_in.password
        )
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
