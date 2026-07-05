from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserRead
from app.services.security import create_access_token, hash_password, verify_password
from app.services.seed import ensure_default_categories

router = APIRouter(prefix="/auth", tags=["auth"])


def token_for_user(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(str(user.id)), user=user)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        email=payload.email.lower(),
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_default_categories(db, user.id)
    return token_for_user(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return token_for_user(user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
