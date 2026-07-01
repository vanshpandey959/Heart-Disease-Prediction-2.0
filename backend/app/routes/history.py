"""
History routes — save a prediction result, list a user's saved predictions, delete one.
All endpoints here require a logged-in user (Depends(get_current_user)).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from app.models.user import UserOut
from app.models.prediction import SavePredictionRequest, PredictionOut
from app.core.security import get_current_user
from app.database import get_predictions_collection
from app.utils.logger import logger

router = APIRouter(prefix="/history", tags=["History"])


@router.post("/save", response_model=PredictionOut, status_code=status.HTTP_201_CREATED)
async def save_prediction(
    data: SavePredictionRequest,
    current_user: UserOut = Depends(get_current_user),
):
    predictions = get_predictions_collection()

    doc = data.model_dump()
    doc["user_id"] = ObjectId(current_user.id)
    # created_at is added automatically — don't trust a client-supplied timestamp
    doc["created_at"] = datetime.now(timezone.utc)

    result = await predictions.insert_one(doc)
    saved = await predictions.find_one({"_id": result.inserted_id})

    logger.info(f"Prediction saved for user {current_user.email}")
    return PredictionOut.model_validate(saved)


@router.get("/", response_model=list[PredictionOut])
async def get_history(current_user: UserOut = Depends(get_current_user)):
    predictions = get_predictions_collection()

    cursor = predictions.find({"user_id": ObjectId(current_user.id)}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)  # reasonable cap; revisit with pagination if needed later

    return [PredictionOut.model_validate(doc) for doc in docs]


@router.delete("/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prediction(
    prediction_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    if not ObjectId.is_valid(prediction_id):
        raise HTTPException(400, "Invalid prediction id.")

    predictions = get_predictions_collection()

    # Scope the delete to (id AND user_id) so a user can't delete someone else's
    # saved prediction by guessing/passing another user's prediction id.
    result = await predictions.delete_one({
        "_id": ObjectId(prediction_id),
        "user_id": ObjectId(current_user.id),
    })

    if result.deleted_count == 0:
        raise HTTPException(404, "Prediction not found.")