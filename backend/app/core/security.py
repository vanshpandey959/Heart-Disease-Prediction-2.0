"""
Security — JWT creation/verification and the get_current_user dependency.

- create_access_token()  -> called after successful register/login
- get_current_user()     -> FastAPI dependency, injected into protected routes
                             (e.g. POST /history/save). Reads the
                             "Authorization: Bearer <token>" header automatically,
                             decodes it, and fetches the matching user from MongoDB.
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import settings
from app.services.auth_service import get_user_by_id
from app.models.user import UserOut

# Points Swagger/OpenAPI docs to the login endpoint for the "Authorize" button.
# tokenUrl doesn't have to match exactly how the route is wired below — it's
# just used for API documentation purposes.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(user_id: str) -> str:
    """Create a signed JWT containing the user's id (sub) and an expiry."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """Decode a JWT and return the user_id (sub). Raises HTTPException if invalid/expired."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    """FastAPI dependency — use as `current_user: UserOut = Depends(get_current_user)`
    in any route that should require a logged-in user."""
    user_id = decode_access_token(token)

    user_doc = await get_user_by_id(user_id)
    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserOut.model_validate(user_doc)