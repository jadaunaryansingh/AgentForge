from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        # Try local JWT first
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        # Try Neon JWT using HS256/RS256. If NEON_JWT_SECRET is a secret key or JWKS
        try:
            # We use options to ignore signature validation if NEON_JWT_SECRET is not configured or in dev
            # but we should attempt decoding properly.
            payload = jwt.decode(
                token, 
                settings.NEON_JWT_SECRET, 
                algorithms=["HS256", "RS256"],
                options={"verify_aud": False}
            )
            return payload
        except JWTError as e:
            # Fallback/Development mode: if NEON_JWT_SECRET is placeholder/missing and we are in dev,
            # allow decoding without verification for local testing, otherwise raise
            if settings.APP_ENV == "development" and settings.NEON_JWT_SECRET in ["your_neon_jwt_secret_here", ""]:
                try:
                    payload = jwt.get_unverified_claims(token)
                    return payload
                except Exception:
                    pass
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_token(credentials.credentials)
