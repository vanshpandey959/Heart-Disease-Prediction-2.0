"""
Auth Service — password hashing/verification and user persistence.
JWT creation/verification lives separately in app/core/security.py
(security.py is about *verifying who's calling*, this file is about *user data*).
"""

from passlib.context import CryptContext
from bson import ObjectId

from app.database import get_users_collection
from app.models.user import UserCreate, UserInDB
from app.utils.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)


async def get_user_by_email(email: str) -> dict | None:
    users = get_users_collection()
    return await users.find_one({"email": email})


async def get_user_by_id(user_id: str) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None
    users = get_users_collection()
    return await users.find_one({"_id": ObjectId(user_id)})


async def create_user(user_data: UserCreate) -> dict:
    """Hash password and insert a new user. Caller is responsible for
    checking email uniqueness beforehand (or handling the DuplicateKeyError
    raised by the unique index if a race condition slips through)."""
    users = get_users_collection()

    user_doc = UserInDB(
        name=user_data.name,
        email=user_data.email,
        gender=user_data.gender,
        hashed_password=hash_password(user_data.password),
    )

    result = await users.insert_one(user_doc.model_dump(by_alias=True, exclude={"id"}))
    created = await users.find_one({"_id": result.inserted_id})

    logger.info(f"✅ New user created: {user_data.email}")
    return created