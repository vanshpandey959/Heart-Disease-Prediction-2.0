"""
Prediction schemas.
- HeartInput        -> input validation for /predict (moved from original main.py)
- PredictionResult  -> the shape of the response returned by /predict
- SavedPrediction   -> what gets stored in MongoDB when user hits "Save"
- PredictionOut     -> what's returned when listing a user's history
"""

from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Any

from app.models.user import PyObjectId


# ── Input validation (same as original main.py) ──────────────────────────────

class HeartInput(BaseModel):
    Age: int            = Field(..., ge=20, le=100)
    Sex: str            = Field(..., pattern="^[MF]$")
    ChestPainType: str  = Field(...)
    RestingBP: float    = Field(..., ge=0, le=250)
    Cholesterol: float  = Field(..., ge=0, le=700)
    FastingBS: int      = Field(..., ge=0, le=1)
    RestingECG: str     = Field(...)
    MaxHR: float        = Field(..., ge=50, le=250)
    ExerciseAngina: str = Field(..., pattern="^[YN]$")
    Oldpeak: float      = Field(..., ge=-5, le=10)
    ST_Slope: str       = Field(...)


# ── /predict response shape ──────────────────────────────────────────────────

class PredictionResult(BaseModel):
    prediction: int
    prediction_label: str
    probability_disease: float
    probability_no_disease: float
    risk_level: str
    shap_contributions: dict[str, float]
    explanation: str
    input_summary: dict[str, Any]


# ── Request to save a prediction (sent by frontend when user clicks SAVE) ────

class SavePredictionRequest(BaseModel):
    input_summary: dict[str, Any]
    prediction: int
    prediction_label: str
    probability_disease: float
    probability_no_disease: float
    risk_level: str
    shap_contributions: dict[str, float]
    explanation: str


# ── DB schema (internal — what's actually stored) ────────────────────────────

class SavedPrediction(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    user_id: PyObjectId
    input_summary: dict[str, Any]
    prediction: int
    prediction_label: str
    probability_disease: float
    probability_no_disease: float
    risk_level: str
    shap_contributions: dict[str, float]
    explanation: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Response schema (returned in /history) ───────────────────────────────────

class PredictionOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    input_summary: dict[str, Any]
    prediction: int
    prediction_label: str
    probability_disease: float
    probability_no_disease: float
    risk_level: str
    shap_contributions: dict[str, float]
    explanation: str
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }