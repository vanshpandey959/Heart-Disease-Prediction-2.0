"""
HeartPredict V1 — FastAPI Backend
Includes: Prediction, SHAP explainability, Groq plain-text explanation
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
import logging
import os
import shap
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("heartpredict")

ARTIFACTS = Path(__file__).parent / "artifacts"

def load_artifact(name: str):
    path = ARTIFACTS / name
    if not path.exists():
        raise FileNotFoundError(f"Artifact not found: {path}")
    with open(path, "rb") as f:
        return pickle.load(f)

model = None
scaler = None
feature_columns = None
explainer = None
groq_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, scaler, feature_columns, explainer, groq_client

    try:
        model           = load_artifact("model.pkl")
        scaler          = load_artifact("scaler.pkl")
        feature_columns = load_artifact("columns.pkl")
        logger.info(f"✅ Model loaded. Features ({len(feature_columns)}): {feature_columns}")
    except FileNotFoundError as e:
        logger.warning(f"⚠️  {e}")

    try:
        background = load_artifact("backgroundKmeans.pkl")
        explainer  = shap.KernelExplainer(model.predict_proba, background)
        logger.info("✅ SHAP explainer ready.")
    except FileNotFoundError:
        logger.warning("⚠️  backgroundKmeans.pkl not found. SHAP disabled.")
    except Exception as e:
        logger.warning(f"⚠️  SHAP init failed: {e}")

    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        groq_client = Groq(api_key=api_key)
        logger.info("✅ Groq client ready.")
    else:
        logger.warning("⚠️  GROQ_API_KEY not set.")

    yield

app = FastAPI(title="HeartPredict API", version="1.0.0", lifespan=lifespan)

# ── CORS — allow localhost dev + Vercel production ────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", ""),   # set this to your Vercel URL in Render env vars
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schema ────────────────────────────────────────────────────────────────────

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

# ── Constants ─────────────────────────────────────────────────────────────────

VALID_CHEST_PAIN = {"ATA", "NAP", "ASY", "TA"}
VALID_ECG        = {"Normal", "ST", "LVH"}
VALID_ST_SLOPE   = {"Up", "Flat", "Down"}

FEATURE_LABELS = {
    "Age":               "Age",
    "RestingBP":         "Resting Blood Pressure",
    "Cholesterol":       "Cholesterol",
    "FastingBS":         "Fasting Blood Sugar",
    "MaxHR":             "Max Heart Rate",
    "Oldpeak":           "Oldpeak (ST Depression)",
    "Sex_M":             "Sex: Male",
    "ChestPainType_ATA": "Chest Pain: Atypical Angina",
    "ChestPainType_NAP": "Chest Pain: Non-Anginal",
    "ChestPainType_TA":  "Chest Pain: Typical Angina",
    "RestingECG_Normal": "ECG: Normal",
    "RestingECG_ST":     "ECG: ST Abnormality",
    "ExerciseAngina_Y":  "Exercise-Induced Angina",
    "ST_Slope_Flat":     "ST Slope: Flat",
    "ST_Slope_Up":       "ST Slope: Upward",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def preprocess(data: HeartInput) -> pd.DataFrame:
    raw = {
        "Age": data.Age, "RestingBP": data.RestingBP,
        "Cholesterol": data.Cholesterol, "FastingBS": data.FastingBS,
        "MaxHR": data.MaxHR, "Oldpeak": data.Oldpeak,
        "Sex": data.Sex, "ChestPainType": data.ChestPainType,
        "RestingECG": data.RestingECG, "ExerciseAngina": data.ExerciseAngina,
        "ST_Slope": data.ST_Slope,
    }
    df = pd.DataFrame([raw])
    cat_cols = ["Sex", "ChestPainType", "RestingECG", "ExerciseAngina", "ST_Slope"]
    df_enc = pd.get_dummies(df, columns=cat_cols, drop_first=True, dtype=int)
    if feature_columns is not None:
        df_enc = df_enc.reindex(columns=feature_columns, fill_value=0)
    return df_enc


def compute_shap(df_enc: pd.DataFrame) -> dict:
    if explainer is None:
        return {}
    arr = scaler.transform(df_enc) if scaler is not None else df_enc.values
    shap_vals = explainer.shap_values(arr)

    if isinstance(shap_vals, list):
        vals = np.array(shap_vals[1]).flatten()
    else:
        vals = np.array(shap_vals).flatten()

    contributions = {
        FEATURE_LABELS.get(col, col): round(float(v), 4)
        for col, v in zip(feature_columns, vals)
    }
    return dict(sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True))


def build_groq_explanation(data: HeartInput, prediction: int, prob: float,
                            contributions: dict, risk_level: str) -> str:
    if groq_client is None:
        return ""

    top_risk    = [k for k, v in contributions.items() if v > 0][:4]
    top_protect = [k for k, v in contributions.items() if v < 0][:2]

    prompt = f"""You are a cardiologist assistant explaining an AI heart disease risk assessment to a patient.

Patient Profile:
- Age: {data.Age}, Sex: {"Male" if data.Sex == "M" else "Female"}
- Resting BP: {data.RestingBP} mmHg, Cholesterol: {data.Cholesterol} mg/dL
- Max Heart Rate: {data.MaxHR} bpm, Oldpeak: {data.Oldpeak} mm
- Chest Pain: {data.ChestPainType}, ECG: {data.RestingECG}
- Exercise Angina: {"Yes" if data.ExerciseAngina == "Y" else "No"}, ST Slope: {data.ST_Slope}
- Fasting Blood Sugar > 120: {"Yes" if data.FastingBS else "No"}

AI Model Result:
- Prediction: {"Heart Disease Detected" if prediction == 1 else "No Heart Disease"}
- Confidence: {round(prob * 100)}%
- Risk Level: {risk_level}
- Top contributing risk factors: {", ".join(top_risk) if top_risk else "None"}
- Protective factors: {", ".join(top_protect) if top_protect else "None significant"}

Write a clear, empathetic explanation in 4-5 sentences for a non-medical person. Cover:
1. What the result means
2. Which 2-3 factors influenced it most and why
3. One actionable next step

Do not use medical jargon. Do not say "AI model". Be warm but honest."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq error: {e}")
        return ""

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "HeartPredict API", "version": "1.0.0",
        "model": model is not None, "shap": explainer is not None,
        "groq": groq_client is not None,
    }

@app.get("/health")
def health():
    return {
        "model_loaded":  model is not None,
        "scaler_loaded": scaler is not None,
        "shap_ready":    explainer is not None,
        "groq_ready":    groq_client is not None,
        "n_features":    len(feature_columns) if feature_columns else None,
    }

@app.post("/predict")
def predict(data: HeartInput):
    if model is None:
        raise HTTPException(503, "Model not loaded.")
    if data.ChestPainType not in VALID_CHEST_PAIN:
        raise HTTPException(400, f"ChestPainType must be one of {VALID_CHEST_PAIN}")
    if data.RestingECG not in VALID_ECG:
        raise HTTPException(400, f"RestingECG must be one of {VALID_ECG}")
    if data.ST_Slope not in VALID_ST_SLOPE:
        raise HTTPException(400, f"ST_Slope must be one of {VALID_ST_SLOPE}")

    try:
        df_enc          = preprocess(data)
        arr             = scaler.transform(df_enc) if scaler else df_enc.values.astype(float)
        prediction      = int(model.predict(arr)[0])
        probabilities   = model.predict_proba(arr)[0]
        prob_disease    = float(probabilities[1])
        prob_no_disease = float(probabilities[0])
        risk_level      = "High" if prob_disease >= 0.7 else "Moderate" if prob_disease >= 0.4 else "Low"

        contributions = compute_shap(df_enc)
        explanation   = build_groq_explanation(data, prediction, prob_disease, contributions, risk_level)

        logger.info(f"Prediction: {prediction} | P(disease)={prob_disease:.3f} | Risk: {risk_level}")

        return {
            "prediction":             prediction,
            "prediction_label":       "Heart Disease Detected" if prediction == 1 else "No Heart Disease",
            "probability_disease":    prob_disease,
            "probability_no_disease": prob_no_disease,
            "risk_level":             risk_level,
            "shap_contributions":     contributions,
            "explanation":            explanation,
            "input_summary":          data.model_dump(),
        }

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(500, f"Prediction failed: {str(e)}")