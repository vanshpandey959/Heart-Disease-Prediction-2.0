"""
Wellness schemas — questionnaire input, generated plans, daily tracking.
"""

from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Any
from app.models.user import PyObjectId


# ── Questionnaire ─────────────────────────────────────────────────────────────

class QuestionnaireInput(BaseModel):
    conditions: str           # "diabetes, hypertension" or "none"
    intolerances: str          # "lactose, gluten" or "none"
    diet_type: str             # "vegetarian" | "vegan" | "non-vegetarian"
    work_start: str            # "09:00"
    work_end: str              # "17:00"
    breakfast_time: str        # "08:00"
    lunch_time: str            # "13:00"
    snacks_time: str           # "16:00"
    dinner_time: str           # "20:00"


class GeneratePlanRequest(BaseModel):
    report_id: str
    questionnaire: QuestionnaireInput


# ── Routine / Diet rows (what Groq returns, stored in Mongo) ──────────────────

class RoutineRow(BaseModel):
    time: str          # "06:30"
    task: str          # "Morning walk - 30 minutes"
    category: str      # "Exercise" | "Medication" | "Rest" | "Hydration" etc.


class MealItem(BaseModel):
    item: str          # "Oats with banana"
    quantity: str      # "1 bowl"
    notes: str         # "Low sugar" / ""


class DietPlan(BaseModel):
    breakfast: list[MealItem]
    lunch: list[MealItem]
    snacks: list[MealItem]
    dinner: list[MealItem]


# ── DB schema ────────────────────────────────────────────────────────────────

class WellnessPlanInDB(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")
    user_id: PyObjectId
    report_id: str
    # Snapshot of the linked report at generation time (prediction_label, risk_level,
    # probability_disease, top_factors) so the plan is self-contained even if the
    # original report is later deleted, and the frontend doesn't need a second fetch.
    report_snapshot: dict[str, Any] = Field(default_factory=dict)
    questionnaire: dict[str, Any]
    # Short AI-generated rationale for why this routine/diet was chosen.
    reasoning: str = ""
    routine: list[dict[str, Any]]
    diet: dict[str, Any]
    is_active: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Response schemas ──────────────────────────────────────────────────────────

class WellnessPlanOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    user_id: PyObjectId
    report_id: str
    report_snapshot: dict[str, Any] = Field(default_factory=dict)
    questionnaire: dict[str, Any]
    reasoning: str = ""
    routine: list[dict[str, Any]]
    diet: dict[str, Any]
    is_active: bool
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }


# ── Daily tracking ────────────────────────────────────────────────────────────

class RoutineTrackingUpdate(BaseModel):
    plan_id: str
    task_key: str       # the task string used as key
    done: bool


class DietTrackingUpdate(BaseModel):
    plan_id: str
    meal: str           # "breakfast" | "lunch" | "snacks" | "dinner"
    done: bool


class TrackingOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    user_id: PyObjectId
    plan_id: str
    date: str           # "YYYY-MM-DD"
    routine_done: dict[str, bool]
    diet_done: dict[str, bool]

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }