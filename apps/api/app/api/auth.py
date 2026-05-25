from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from app.database.connection import get_db
from app.database.models import User
from app.schemas.auth import UserCreate, LoginRequest, TokenResponse, UserResponse
from app.core.security import create_access_token, get_current_user
import uuid

router = APIRouter()

class PasswordHasher:
    @staticmethod
    def hash(password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify(password: str, hashed_password: str) -> bool:
        try:
            if not hashed_password:
                return False
            return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False

pwd_context = PasswordHasher()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        display_name=payload.display_name,
        hashed_password=pwd_context.hash(payload.password),
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
async def me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Try looking up by ID or by email
    user_id_str = current_user.get("sub")
    email = current_user.get("email")
    
    user = None
    if user_id_str:
        try:
            user_uuid = uuid.UUID(user_id_str)
            result = await db.execute(select(User).where(User.id == user_uuid))
            user = result.scalar_one_or_none()
        except ValueError:
            pass
            
    if not user and email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found. Please sync your account.")
    return UserResponse.model_validate(user)

@router.post("/sync", response_model=UserResponse)
async def sync_neon_user(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync Neon Auth JWT user with local DB profile."""
    email = current_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="JWT payload must contain an email address")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        display_name = current_user.get("name") or current_user.get("display_name")
        if not display_name:
            display_name = email.split("@")[0]
            
        user = User(
            id=uuid.uuid4(),
            email=email,
            display_name=display_name,
            avatar_url=current_user.get("picture") or current_user.get("avatar_url"),
        )
        db.add(user)
        await db.flush()
    else:
        # Update display name or avatar if provided
        updated = False
        if current_user.get("name") and user.display_name != current_user.get("name"):
            user.display_name = current_user.get("name")
            updated = True
        if current_user.get("picture") and user.avatar_url != current_user.get("picture"):
            user.avatar_url = current_user.get("picture")
            updated = True
        if updated:
            db.add(user)
            await db.flush()
            
    return UserResponse.model_validate(user)
