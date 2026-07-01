"""
MongoDB connection setup using Motor (async MongoDB driver).
Provides a single shared `db` instance, plus convenience collection getters.
Call `connect_to_mongo()` on startup and `close_mongo_connection()` on shutdown.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
from app.utils.logger import logger

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo():
    """Initialize the MongoDB client. Call once on app startup."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    # Fail fast if MongoDB is unreachable
    await client.admin.command("ping")
    logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB_NAME}")

    await _ensure_indexes()


async def close_mongo_connection():
    """Close the MongoDB client. Call once on app shutdown."""
    global client
    if client is not None:
        client.close()
        logger.info("🛑 MongoDB connection closed.")


async def _ensure_indexes():
    """Create indexes that enforce data integrity / speed up queries."""
    await db.users.create_index("email", unique=True)
    await db.predictions.create_index("user_id")
    await db.wellness_plans.create_index("user_id")
    await db.wellness_plans.create_index([("user_id", 1), ("report_id", 1)])
    await db.daily_tracking.create_index(
        [("user_id", 1), ("plan_id", 1), ("date", 1)], unique=True
    )
    logger.info(
        "✅ MongoDB indexes ensured: "
        "users.email (unique), predictions.user_id, "
        "wellness_plans.user_id, wellness_plans.(user_id+report_id), "
        "daily_tracking.(user_id+plan_id+date) (unique)"
    )


# ── Collection getters ────────────────────────────────────────────────────────
# Use these in services instead of reaching into `db` directly — keeps a
# single point of change if collection names ever change.

def get_users_collection():
    return db.users

def get_predictions_collection():
    return db.predictions

def get_wellness_plans_collection():
    return db.wellness_plans

def get_daily_tracking_collection():
    return db.daily_tracking