from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import os

router = APIRouter()

# Paths to the saved ML artifacts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "ml_module", "dementia_risk_model.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "..", "ml_module", "label_encoder.joblib")

class PredictionInput(BaseModel):
    age: int
    memory_score: int
    activity_level: int
    missed_meds: int

class PredictionOutput(BaseModel):
    predicted_risk_level: str
    confidence: float

# Global variables for model and encoder
clf = None
le = None

@router.on_event("startup")
def load_ml_components():
    global clf, le
    # Check if files exist before trying to load
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        clf = joblib.load(MODEL_PATH)
        le = joblib.load(ENCODER_PATH)
        print("ML Models loaded successfully.")
    else:
        print(f"ML Model files not found at {MODEL_PATH}. Prediction endpoints will be disabled until model is trained.")

@router.post("/predict-risk", response_model=PredictionOutput)
def predict_risk(data: PredictionInput):
    if clf is None or le is None:
        raise HTTPException(
            status_code=503, 
            detail="ML Model is not loaded. Please train the model first."
        )
        
    # Format input for prediction
    input_features = [[data.age, data.memory_score, data.activity_level, data.missed_meds]]
    
    try:
        # Predict class index
        prediction_index = clf.predict(input_features)[0]
        # Predict probabilities
        probabilities = clf.predict_proba(input_features)[0]
        confidence = float(max(probabilities))
        
        # Decode the prediction
        predicted_label = le.inverse_transform([prediction_index])[0]
        
        return PredictionOutput(
            predicted_risk_level=predicted_label,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")
