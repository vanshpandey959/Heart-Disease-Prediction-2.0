"""
Static constants — validation sets and human-readable feature labels.
Pulled from the original main.py so they live in one shared place.
"""

VALID_CHEST_PAIN = {"ATA", "NAP", "ASY", "TA"}
VALID_ECG        = {"Normal", "ST", "LVH"}
VALID_ST_SLOPE   = {"Up", "Flat", "Down"}
VALID_GENDER     = {"M", "F", "Other"}

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