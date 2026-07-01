"""
Groq Service — generates a warm, plain-language explanation of the prediction
for the patient, using SHAP contributions as context.
"""

from groq import Groq

from app.config import settings
from app.utils.logger import logger
from app.models.prediction import HeartInput


class GroqService:
    def __init__(self):
        self.client: Groq | None = None

    def load(self):
        """Initialize the Groq client. Call once on app startup."""
        if settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            logger.info("✅ Groq client ready.")
        else:
            logger.warning("⚠️  GROQ_API_KEY not set.")

    def is_ready(self) -> bool:
        return self.client is not None

    def build_explanation(
        self,
        data: HeartInput,
        prediction: int,
        prob: float,
        contributions: dict,
        risk_level: str,
    ) -> str:
        if self.client is None:
            return ""

        top_risk = [k for k, v in contributions.items() if v > 0][:4]
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
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.5,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq error: {e}")
            return ""


# Single shared instance — import this everywhere
groq_service = GroqService()