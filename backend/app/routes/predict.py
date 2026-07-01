"""
Prediction routes — runs the model, computes SHAP, generates the Groq explanation.
Public endpoint — no login required to get a prediction, only to save one.
"""

from fastapi import APIRouter, HTTPException

from app.models.prediction import HeartInput, PredictionResult
from app.services.ml_service import ml_service
from app.services.groq_service import groq_service
from app.core.constants import VALID_CHEST_PAIN, VALID_ECG, VALID_ST_SLOPE
from app.utils.logger import logger

router = APIRouter(tags=["Prediction"])


@router.post("/predict", response_model=PredictionResult)
def predict(data: HeartInput):
    if not ml_service.is_ready():
        raise HTTPException(503, "Model not loaded.")
    if data.ChestPainType not in VALID_CHEST_PAIN:
        raise HTTPException(400, f"ChestPainType must be one of {VALID_CHEST_PAIN}")
    if data.RestingECG not in VALID_ECG:
        raise HTTPException(400, f"RestingECG must be one of {VALID_ECG}")
    if data.ST_Slope not in VALID_ST_SLOPE:
        raise HTTPException(400, f"ST_Slope must be one of {VALID_ST_SLOPE}")

    try:
        df_enc = ml_service.preprocess(data)
        result = ml_service.predict(df_enc)
        contributions = ml_service.compute_shap(df_enc)

        explanation = groq_service.build_explanation(
            data=data,
            prediction=result["prediction"],
            prob=result["probability_disease"],
            contributions=contributions,
            risk_level=result["risk_level"],
        )

        logger.info(
            f"Prediction: {result['prediction']} | "
            f"P(disease)={result['probability_disease']:.3f} | "
            f"Risk: {result['risk_level']}"
        )

        return PredictionResult(
            prediction=result["prediction"],
            prediction_label=result["prediction_label"],
            probability_disease=result["probability_disease"],
            probability_no_disease=result["probability_no_disease"],
            risk_level=result["risk_level"],
            shap_contributions=contributions,
            explanation=explanation,
            input_summary=data.model_dump(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")