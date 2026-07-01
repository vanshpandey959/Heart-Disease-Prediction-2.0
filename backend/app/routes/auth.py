"""
Auth routes — register, login, get current logged-in user.
"""

from fastapi import APIRouter, HTTPException, status, Depends

from app.models.user import UserCreate, UserLogin, UserOut, TokenResponse
from app.services.auth_service import get_user_by_email, create_user, verify_password
from app.core.security import create_access_token, get_current_user
from app.core.constants import VALID_GENDER
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["Auth"])

# NOTE: response_model_by_alias=False here for the same reason as history.py
# and wellness.py — TokenResponse embeds `user: UserOut`, and UserOut aliases
# id -> "_id" for Mongo storage. Without this flag, the JSON sent to the
# frontend on register/login would contain "user": {"_id": ...} instead of
# {"id": ...}, so any code reading `user.id` (e.g. a Navbar, profile page,
# or ownership check) would silently get `undefined`.


@router.post(
    "/register",
    response_model=TokenResponse,
    response_model_by_alias=False,
    status_code=status.HTTP_201_CREATED,
)
async def register(data: UserCreate):
    if data.gender not in VALID_GENDER:
        raise HTTPException(400, f"gender must be one of {VALID_GENDER}")

    existing = await get_user_by_email(data.email)
    if existing is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered.")

    user_doc = await create_user(data)
    token = create_access_token(user_id=str(user_doc["_id"]))

    return TokenResponse(access_token=token, user=UserOut.model_validate(user_doc))


@router.post("/login", response_model=TokenResponse, response_model_by_alias=False)
async def login(data: UserLogin):
    user_doc = await get_user_by_email(data.email)

    # Same error for "no such user" and "wrong password" — don't leak which one
    # it was, so attackers can't use this endpoint to enumerate valid emails.
    invalid_credentials = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")

    if user_doc is None:
        raise invalid_credentials
    if not verify_password(data.password, user_doc["hashed_password"]):
        raise invalid_credentials

    token = create_access_token(user_id=str(user_doc["_id"]))
    logger.info(f"User logged in: {data.email}")

    return TokenResponse(access_token=token, user=UserOut.model_validate(user_doc))


@router.get("/me", response_model=UserOut, response_model_by_alias=False)
async def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user