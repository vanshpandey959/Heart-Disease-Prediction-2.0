"""
Wellness routes — plan generation, activation, and daily tracking.
All endpoints require a logged-in user.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.models.user import UserOut
from app.models.wellness import (
    GeneratePlanRequest, WellnessPlanOut, TrackingOut,
    RoutineTrackingUpdate, DietTrackingUpdate,
)
from app.core.security import get_current_user
from app.database import get_predictions_collection
from app.services import wellness_service
from app.utils.logger import logger

router = APIRouter(prefix="/wellness", tags=["Wellness"])

# NOTE: response_model_by_alias=False is set on every route below. Our DB models
# alias `id` -> `_id` for Mongo storage, and FastAPI's response_model_by_alias
# defaults to True, which means the JSON sent to the frontend would contain
# "_id" instead of "id". The React code (ReportsPage, PlanCard, ActiveTracking,
# etc.) reads `.id` everywhere, so without this flag those fields come back
# `undefined` client-side (this was the cause of "delete doesn't work").


@router.post(
    "/generate",
    response_model=WellnessPlanOut,
    response_model_by_alias=False,
    status_code=status.HTTP_201_CREATED,
)
async def generate_plan(
    data: GeneratePlanRequest,
    current_user: UserOut = Depends(get_current_user),
):
    # Fetch the linked saved report to pass heart data to Groq
    predictions = get_predictions_collection()
    if not ObjectId.is_valid(data.report_id):
        raise HTTPException(400, "Invalid report_id.")

    report = await predictions.find_one({
        "_id": ObjectId(data.report_id),
        "user_id": ObjectId(current_user.id),
    })
    if not report:
        raise HTTPException(404, "Report not found or does not belong to you.")

    try:
        routine, diet, reasoning = wellness_service.generate_wellness_plan(
            questionnaire=data.questionnaire,
            report_data=report,
        )
    except ValueError as e:
        raise HTTPException(502, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    # Snapshot the report so the plan is self-contained (survives report deletion,
    # and lets the frontend render "Your Inputs / Why this plan" without a 2nd fetch).
    report_snapshot = {
        "prediction_label": report.get("prediction_label"),
        "risk_level": report.get("risk_level"),
        "probability_disease": report.get("probability_disease"),
        "top_factors": list(report.get("shap_contributions", {}).keys())[:4],
    }

    saved = await wellness_service.save_wellness_plan(
        user_id=ObjectId(current_user.id),
        report_id=data.report_id,
        questionnaire=data.questionnaire,
        routine=routine,
        diet=diet,
        reasoning=reasoning,
        report_snapshot=report_snapshot,
    )
    logger.info(f"Wellness plan generated for user {current_user.email}, report {data.report_id}")
    return WellnessPlanOut.model_validate(saved)


@router.get("/plans", response_model=list[WellnessPlanOut], response_model_by_alias=False)
async def get_all_plans(current_user: UserOut = Depends(get_current_user)):
    # BUG FIX: current_user is a UserOut model, not a dict — must use .id, not ["_id"]
    plans = await wellness_service.get_all_plans_for_user(ObjectId(current_user.id))
    return [WellnessPlanOut.model_validate(p) for p in plans]


@router.get("/plans/{report_id}", response_model=list[WellnessPlanOut], response_model_by_alias=False)
async def get_plans(
    report_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    plans = await wellness_service.get_plans_for_report(
        user_id=ObjectId(current_user.id),
        report_id=report_id,
    )
    return [WellnessPlanOut.model_validate(p) for p in plans]


# NEW: delete a plan. Placed above /activate/{plan_id} on purpose (order doesn't
# matter for different methods on the same path, but keeping delete near the
# other /plans routes for readability). Scoped to (id AND user_id), same
# pattern as history's delete, so a user can't delete someone else's plan.
@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(400, "Invalid plan id.")

    deleted = await wellness_service.delete_plan(
        user_id=ObjectId(current_user.id),
        plan_id=plan_id,
    )
    if not deleted:
        raise HTTPException(404, "Plan not found.")


@router.post("/activate/{plan_id}", response_model=WellnessPlanOut, response_model_by_alias=False)
async def activate_plan(
    plan_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    plan = await wellness_service.activate_plan(
        user_id=ObjectId(current_user.id),
        plan_id=plan_id,
    )
    if not plan:
        raise HTTPException(404, "Plan not found.")
    return WellnessPlanOut.model_validate(plan)


@router.get("/active", response_model=WellnessPlanOut | None, response_model_by_alias=False)
async def get_active_plan(current_user: UserOut = Depends(get_current_user)):
    plan = await wellness_service.get_active_plan(ObjectId(current_user.id))
    if not plan:
        return None
    return WellnessPlanOut.model_validate(plan)


@router.get("/tracking/today", response_model=TrackingOut | None, response_model_by_alias=False)
async def get_today_tracking(current_user: UserOut = Depends(get_current_user)):
    plan = await wellness_service.get_active_plan(ObjectId(current_user.id))
    if not plan:
        return None
    tracking = await wellness_service.get_or_create_tracking(
        user_id=ObjectId(current_user.id),
        plan_id=str(plan["_id"]),
    )
    return TrackingOut.model_validate(tracking)


@router.post("/tracking/routine", response_model=TrackingOut, response_model_by_alias=False)
async def update_routine(
    data: RoutineTrackingUpdate,
    current_user: UserOut = Depends(get_current_user),
):
    tracking = await wellness_service.update_routine_tracking(
        user_id=ObjectId(current_user.id),
        plan_id=data.plan_id,
        task_key=data.task_key,
        done=data.done,
    )
    return TrackingOut.model_validate(tracking)


@router.post("/tracking/diet", response_model=TrackingOut, response_model_by_alias=False)
async def update_diet(
    data: DietTrackingUpdate,
    current_user: UserOut = Depends(get_current_user),
):
    valid_meals = {"breakfast", "lunch", "snacks", "dinner"}
    if data.meal not in valid_meals:
        raise HTTPException(400, f"meal must be one of {valid_meals}")
    tracking = await wellness_service.update_diet_tracking(
        user_id=ObjectId(current_user.id),
        plan_id=data.plan_id,
        meal=data.meal,
        done=data.done,
    )
    return TrackingOut.model_validate(tracking)