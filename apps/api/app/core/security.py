from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt, jwk
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import httpx
import logging

logger = logging.getLogger("agentforge.security")
bearer_scheme = HTTPBearer(auto_error=False)

# In-memory cache for JWKS keys to avoid pulling them on every single API request
jwks_cache = None
jwks_timestamp = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

async def fetch_jwks(url: str):
    """Fetch public keys from Neon Auth JWKS endpoint and cache them for 1 hour."""
    global jwks_cache, jwks_timestamp
    now = datetime.now(timezone.utc)
    if jwks_cache and jwks_timestamp and (now - jwks_timestamp).total_seconds() < 3600:
        return jwks_cache

    try:
        jwks_url = url
        # If the URL is just the auth domain base path, append the standard jwks path
        if not jwks_url.endswith("jwks.json"):
            jwks_url = jwks_url.rstrip("/") + "/.well-known/jwks.json"
            
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(jwks_url)
            if r.status_code == 200:
                jwks_cache = r.json()
                jwks_timestamp = now
                logger.info(f"Successfully fetched and cached Neon JWKS from {jwks_url}")
                return jwks_cache
            else:
                logger.error(f"Neon JWKS endpoint returned status code: {r.status_code} for URL: {jwks_url}")
    except Exception as e:
        logger.error(f"Failed to retrieve JWKS keys from Neon Auth endpoint {url}: {e}", exc_info=True)
    return None

async def verify_token_async(token: str) -> dict:
    """Verifies HS256 local tokens and RS256/HS256 Neon Auth tokens (using JWKS)."""
    try:
        # App-issued login/register tokens (always try first)
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        pass

    neon_secret = (settings.NEON_JWT_SECRET or "").strip()
    if not neon_secret or neon_secret.startswith("your_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again with email and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_header = jwt.get_unverified_header(token)
    token_alg = token_header.get("alg", "")

    # Case B: symmetric Neon secret (non-URL)
    if not neon_secret.startswith("http://") and not neon_secret.startswith("https://"):
        try:
            return jwt.decode(
                token,
                neon_secret,
                algorithms=["HS256", "RS256"],
                options={"verify_aud": False},
            )
        except JWTError:
            pass

    # Case A: JWKS URL (Neon Auth)
    if neon_secret.startswith("http://") or neon_secret.startswith("https://"):
        kid = token_header.get("kid")
        if not kid:
            logger.warning(
                "Rejected token without 'kid' in header (likely stale browser session). "
                "Use email/password login for a local app token."
            )
        else:
            try:
                jwks = await fetch_jwks(neon_secret)
                if not jwks:
                    raise JWTError("Unable to retrieve public key set from Neon Auth")

                matching_key = next(
                    (key for key in jwks.get("keys", []) if key.get("kid") == kid),
                    None,
                )
                if not matching_key:
                    raise JWTError(f"No public key matching key ID '{kid}' found in JWKS")

                public_key = jwk.construct(matching_key)
                return jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256", "HS256"],
                    options={"verify_aud": False},
                )
            except Exception as e:
                logger.error(f"Neon Auth JWKS verification failed: {e}")

    # Development only: unverified claims when Neon is not configured
    if settings.APP_ENV == "development" and neon_secret in ["your_neon_jwt_secret_here", ""]:
        try:
            logger.warning("Development: accepting unverified JWT claims")
            return jwt.get_unverified_claims(token)
        except Exception:
            pass

    detail = "Session expired or invalid. Please sign in again with email and password."
    if token_alg == "HS256":
        detail = "Session expired or invalid. Sign out, then sign in with email and password."
    elif not token_header.get("kid"):
        detail = (
            "Stored session token is incompatible with this app. "
            "Sign in again using email and password on the login page."
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
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
    return await verify_token_async(credentials.credentials)
