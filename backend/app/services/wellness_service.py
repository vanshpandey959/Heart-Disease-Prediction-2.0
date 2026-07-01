"""
Wellness Service — Groq plan generation + MongoDB CRUD for wellness plans
and daily tracking.
"""

import json
from datetime import datetime, timezone
from bson import ObjectId

from app.config import settings
from app.utils.logger import logger
from app.database import get_wellness_plans_collection, get_daily_tracking_collection
from app.services.groq_service import groq_service
from app.models.wellness import QuestionnaireInput

# NOTE: we deliberately call get_wellness_plans_collection() / get_daily_tracking_collection()
# on every use instead of `from app.database import db` once at the top of this file.
# `database.py` initializes `db = None` at import time and only reassigns it inside
# connect_to_mongo() (via `global db`) when the app starts up. If this module had done
# `from app.database import db`, it would have captured that initial `None` permanently —
# Python copies the value at import time, so the later reassignment in database.py would
# never be visible here, causing `AttributeError: 'NoneType' object has no attribute
# 'wellness_plans'` on every call. The getter functions dodge this because they read
# `db` from inside database.py's own module scope, at call time, after startup.


# ── Groq generation ───────────────────────────────────────────────────────────

def generate_wellness_plan(
    questionnaire: QuestionnaireInput,
    report_data: dict,
) -> tuple[list[dict], dict, str]:
    """
    Call Groq with the heart report + questionnaire answers.
    Returns (routine_rows, diet_plan, reasoning) ready to store in Mongo.
    """
    if not groq_service.is_ready():
        raise RuntimeError("Groq client not available.")

    risk_level = report_data.get("risk_level", "Unknown")
    prediction_label = report_data.get("prediction_label", "Unknown")
    explanation = report_data.get("explanation", "")
    shap = report_data.get("shap_contributions", {})
    top_factors = list(shap.keys())[:4]

    prompt = f"""You are a certified cardiologist and nutritionist generating a
personalised daily routine and diet plan for a heart patient.

Heart Assessment:
- Result: {prediction_label}
- Risk Level: {risk_level}
- Top contributing factors: {", ".join(top_factors)}
- Doctor's note: {explanation}

Patient Profile:
- Other medical conditions: {questionnaire.conditions}
- Food intolerances/allergies: {questionnaire.intolerances}
- Diet type: {questionnaire.diet_type}
- Work hours: {questionnaire.work_start} to {questionnaire.work_end}
- Meal timings: Breakfast {questionnaire.breakfast_time}, Lunch {questionnaire.lunch_time},
  Snacks {questionnaire.snacks_time}, Dinner {questionnaire.dinner_time}

Generate a JSON response with EXACTLY this structure and nothing else
(no markdown, no backticks, no preamble):
{{
  "reasoning": "2-3 sentence explanation, written directly to the patient, of why this specific routine and diet were chosen given their risk level and top contributing factors",
  "routine": [
    {{"time": "HH:MM", "task": "task description", "category": "Exercise|Medication|Hydration|Rest|Mindfulness|Other"}},
    ... (8 to 12 rows ordered by time)
  ],
  "diet": {{
    "breakfast": [
      {{"item": "food item", "quantity": "portion size", "notes": "health note"}},
      ... (2-4 items)
    ],
    "lunch": [ ... (3-5 items) ],
    "snacks": [ ... (1-3 items) ],
    "dinner": [ ... (3-5 items) ]
  }}
}}

Rules:
- All routine tasks must be realistic for the patient's work schedule.
- Diet must respect intolerances and diet type strictly.
- For high-risk heart patients, prioritise low-sodium, low-saturated-fat foods.
- Routine must include medication reminders if the patient has chronic conditions.
- Return ONLY the JSON object, nothing else."""

    try:
        response = groq_service.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1600,
            temperature=0.4,
        )
        raw = response.choices[0].message.content.strip()
        # Strip accidental markdown fences
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
        return data["routine"], data["diet"], data.get("reasoning", "")
    except json.JSONDecodeError as e:
        logger.error(f"Groq returned invalid JSON: {e}")
        raise ValueError("Plan generation failed — invalid response from AI.")
    except Exception as e:
        logger.error(f"Wellness Groq error: {e}")
        raise


# ── Wellness plan CRUD ────────────────────────────────────────────────────────

async def get_all_plans_for_user(user_id: ObjectId) -> list[dict]:
    wellness_plans = get_wellness_plans_collection()
    cursor = wellness_plans.find({"user_id": user_id}).sort("created_at", -1)
    return await cursor.to_list(length=100)

async def save_wellness_plan(
    user_id: ObjectId,
    report_id: str,
    questionnaire: QuestionnaireInput,
    routine: list[dict],
    diet: dict,
    reasoning: str = "",
    report_snapshot: dict | None = None,
) -> dict:
    doc = {
        "user_id": user_id,
        "report_id": report_id,
        "report_snapshot": report_snapshot or {},
        "questionnaire": questionnaire.model_dump(),
        "reasoning": reasoning,
        "routine": routine,
        "diet": diet,
        "is_active": False,
        "created_at": datetime.now(timezone.utc),
    }
    wellness_plans = get_wellness_plans_collection()
    result = await wellness_plans.insert_one(doc)
    return await wellness_plans.find_one({"_id": result.inserted_id})


async def get_plans_for_report(user_id: ObjectId, report_id: str) -> list[dict]:
    wellness_plans = get_wellness_plans_collection()
    cursor = wellness_plans.find(
        {"user_id": user_id, "report_id": report_id}
    ).sort("created_at", -1)
    return await cursor.to_list(length=50)


async def delete_plan(user_id: ObjectId, plan_id: str) -> bool:
    """Delete a plan (scoped to its owner) and any tracking history tied to it."""
    if not ObjectId.is_valid(plan_id):
        return False

    wellness_plans = get_wellness_plans_collection()
    result = await wellness_plans.delete_one(
        {"_id": ObjectId(plan_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        return False

    # Clean up daily tracking docs so they don't linger as orphaned records
    # once the plan they belong to no longer exists.
    daily_tracking = get_daily_tracking_collection()
    await daily_tracking.delete_many({"user_id": user_id, "plan_id": plan_id})
    return True


async def activate_plan(user_id: ObjectId, plan_id: str) -> dict | None:
    if not ObjectId.is_valid(plan_id):
        return None
    wellness_plans = get_wellness_plans_collection()
    # Deactivate all plans for this user first
    await wellness_plans.update_many(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    # Activate the chosen one
    await wellness_plans.update_one(
        {"_id": ObjectId(plan_id), "user_id": user_id},
        {"$set": {"is_active": True}}
    )
    return await wellness_plans.find_one({"_id": ObjectId(plan_id)})


async def get_active_plan(user_id: ObjectId) -> dict | None:
    wellness_plans = get_wellness_plans_collection()
    return await wellness_plans.find_one(
        {"user_id": user_id, "is_active": True}
    )


# ── Daily tracking CRUD ───────────────────────────────────────────────────────

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def get_or_create_tracking(user_id: ObjectId, plan_id: str) -> dict:
    date = _today()
    daily_tracking = get_daily_tracking_collection()
    doc = await daily_tracking.find_one(
        {"user_id": user_id, "plan_id": plan_id, "date": date}
    )
    if doc:
        return doc
    # Create fresh tracking doc for today
    new_doc = {
        "user_id": user_id,
        "plan_id": plan_id,
        "date": date,
        "routine_done": {},
        "diet_done": {"breakfast": False, "lunch": False, "snacks": False, "dinner": False},
    }
    result = await daily_tracking.insert_one(new_doc)
    return await daily_tracking.find_one({"_id": result.inserted_id})


async def update_routine_tracking(
    user_id: ObjectId, plan_id: str, task_key: str, done: bool
) -> dict:
    date = _today()
    daily_tracking = get_daily_tracking_collection()
    await daily_tracking.update_one(
        {"user_id": user_id, "plan_id": plan_id, "date": date},
        {"$set": {f"routine_done.{task_key}": done}},
        upsert=True,
    )
    return await get_or_create_tracking(user_id, plan_id)


async def update_diet_tracking(
    user_id: ObjectId, plan_id: str, meal: str, done: bool
) -> dict:
    date = _today()
    daily_tracking = get_daily_tracking_collection()
    await daily_tracking.update_one(
        {"user_id": user_id, "plan_id": plan_id, "date": date},
        {"$set": {f"diet_done.{meal}": done}},
        upsert=True,
    )
    return await get_or_create_tracking(user_id, plan_id)