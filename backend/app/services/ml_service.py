"""
ML Service — owns the trained model, scaler, feature columns, and SHAP explainer.

Wrapped in a class (instead of bare module-level globals) so the loaded
state is explicit and testable. A single shared instance `ml_service` is
created below — import that, don't instantiate MLService yourself.
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path

import shap

from app.config import settings
from app.utils.logger import logger
from app.core.constants import FEATURE_LABELS
from app.models.prediction import HeartInput


class MLService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_columns: list[str] | None = None
        self.explainer = None

    # ── Lifecycle ─────────────────────────────────────────────────────────

    def load(self):
        """Load model, scaler, feature columns, and SHAP background.
        Call once on app startup (from the lifespan handler)."""
        try:
            self.model = self._load_artifact("model.pkl")
            self.scaler = self._load_artifact("scaler.pkl")
            self.feature_columns = self._load_artifact("columns.pkl")
            logger.info(
                f"✅ Model loaded. Features ({len(self.feature_columns)}): {self.feature_columns}"
            )
        except FileNotFoundError as e:
            logger.warning(f"⚠️  {e}")

        try:
            background = self._load_artifact("backgroundKmeans.pkl")
            self.explainer = shap.KernelExplainer(self.model.predict_proba, background)
            logger.info("✅ SHAP explainer ready.")
        except FileNotFoundError:
            logger.warning("⚠️  backgroundKmeans.pkl not found. SHAP disabled.")
        except Exception as e:
            logger.warning(f"⚠️  SHAP init failed: {e}")

    def is_ready(self) -> bool:
        return self.model is not None

    def is_shap_ready(self) -> bool:
        return self.explainer is not None

    @staticmethod
    def _load_artifact(name: str):
        path = settings.ARTIFACTS_DIR / name
        if not path.exists():
            raise FileNotFoundError(f"Artifact not found: {path}")
        with open(path, "rb") as f:
            return pickle.load(f)

    # ── Preprocessing ─────────────────────────────────────────────────────

    def preprocess(self, data: HeartInput) -> pd.DataFrame:
        """One-hot encode + reindex input to match the training feature columns."""
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

        if self.feature_columns is not None:
            df_enc = df_enc.reindex(columns=self.feature_columns, fill_value=0)
        return df_enc

    # ── Prediction ────────────────────────────────────────────────────────

    def predict(self, df_enc: pd.DataFrame) -> dict:
        """Run the model on preprocessed input. Returns prediction + probabilities."""
        arr = self.scaler.transform(df_enc) if self.scaler is not None else df_enc.values.astype(float)

        prediction = int(self.model.predict(arr)[0])
        probabilities = self.model.predict_proba(arr)[0]
        prob_disease = float(probabilities[1])
        prob_no_disease = float(probabilities[0])
        risk_level = "High" if prob_disease >= 0.7 else "Moderate" if prob_disease >= 0.4 else "Low"

        return {
            "prediction": prediction,
            "prediction_label": "Heart Disease Detected" if prediction == 1 else "No Heart Disease",
            "probability_disease": prob_disease,
            "probability_no_disease": prob_no_disease,
            "risk_level": risk_level,
        }

    # ── SHAP ──────────────────────────────────────────────────────────────

    def compute_shap(self, df_enc: pd.DataFrame) -> dict:
        if self.explainer is None:
            return {}

        arr = self.scaler.transform(df_enc) if self.scaler is not None else df_enc.values
        shap_vals = self.explainer.shap_values(arr)

        if isinstance(shap_vals, list):
            vals = np.array(shap_vals[1]).flatten()
        else:
            vals = np.array(shap_vals).flatten()

        contributions = {
            FEATURE_LABELS.get(col, col): round(float(v), 4)
            for col, v in zip(self.feature_columns, vals)
        }
        return dict(sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True))


# Single shared instance — import this everywhere
ml_service = MLService()