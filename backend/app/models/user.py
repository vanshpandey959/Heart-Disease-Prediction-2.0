"""
User schemas.
- UserCreate / UserLogin  -> what the API accepts as input
- UserInDB                -> what's actually stored in MongoDB (includes hashed password)
- UserOut                 -> what's safely returned to the client (never includes password)
"""

from pydantic import BaseModel, EmailStr, Field, GetCoreSchemaHandler
from pydantic_core import core_schema
from datetime import datetime, timezone
from bson import ObjectId
from typing import Any

from app.core.constants import VALID_GENDER


class PyObjectId(ObjectId):
    """Allows MongoDB's ObjectId to be used as a Pydantic field type,
    serializing to/from a plain string for JSON."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.no_info_plain_validator_function(
            cls._validate,
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def _validate(cls, value: Any) -> "PyObjectId":
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        raise ValueError("Invalid ObjectId")


# ── Request schemas ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str         = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str      = Field(..., min_length=6, max_length=128)
    gender: str        = Field(..., description=f"One of {VALID_GENDER}")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── DB schema (internal — includes hashed password) ──────────────────────────

class UserInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    gender: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Response schema (safe — never includes password) ─────────────────────────

class UserOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    email: EmailStr
    gender: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut