"""
App-wide configuration.
Loads values from environment variables (.env file) using pydantic-settings.
Import `settings` anywhere you need a config value instead of calling os.getenv() directly.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "HeartPredict API"
    APP_VERSION: str = "2.0.0"

    # ── MongoDB ──────────────────────────────────────────────────────────
    MONGO_URI: str
    MONGO_DB_NAME: str = "heartpredict"

    # ── JWT ──────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # ── Groq ─────────────────────────────────────────────────────────────
    GROQ_API_KEY: str = ""

    # ── CORS / Frontend ──────────────────────────────────────────────────
    FRONTEND_URL: str = ""

    # ── Paths ────────────────────────────────────────────────────────────
    ARTIFACTS_DIR: Path = Path(__file__).parent.parent / "artifacts"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Single shared instance — import this everywhere
settings = Settings()