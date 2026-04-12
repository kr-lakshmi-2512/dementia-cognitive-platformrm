import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session
from models.domain import Reminder, Alert, User

# Global singleton model for rapid loading
_model = None

def _get_trained_model():
    global _model
    if _model is not None:
        return _model
        
    print("Initiating synthetic ML training for Dementia Care patterns...")
    
    # Synthetic Dataset: [Missed Meds, Panic Buttons, Incomplete Tasks]
    # Labeled 0 (Low Risk), 1 (Medium Risk), 2 (High Risk)
    X = np.array([
        [0, 0, 0], [1, 0, 1], [0, 1, 0], # Low
        [3, 1, 2], [2, 2, 3], [4, 0, 2], # Medium
        [7, 3, 5], [6, 4, 8], [9, 5, 10] # High
    ])
    y = np.array([0, 0, 0, 1, 1, 1, 2, 2, 2])
    
    _model = RandomForestClassifier(n_estimators=100, random_state=42)
    _model.fit(X, y)
    
    return _model

def predict_patient_risk(db: Session, patient_id: int):
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}
        
    from collections import Counter
    # Extract Patient Telemetry History
    missed_reminders = db.query(Reminder).filter(
        Reminder.user_id == patient_id, 
        Reminder.is_completed == False
    ).all()
    missed_meds = len(missed_reminders)
    
    panic_events = db.query(Alert).filter(
        Alert.user_id == patient_id, 
        Alert.description.like("%Panic%")
    ).all()
    panic_alerts = len(panic_events)
    
    total_incomplete = missed_meds
    
    # Calculate Temporal Failure Window (Sundowning Syndrome)
    incident_hours = [r.time.hour for r in missed_reminders] + [a.timestamp.hour for a in panic_events]
    
    if len(incident_hours) > 0:
        common_hour = Counter(incident_hours).most_common(1)[0][0]
        sundown_window = f"{common_hour:02d}:00 - {(common_hour+2)%24:02d}:00"
    else:
        # Fallback to standard Dementia Sundowning Window projection (Late Afternoon/Evening)
        sundown_window = "17:00 - 19:00 (Simulated Baseline)"
    
    # AI Inference
    clf = _get_trained_model()
    features = np.array([[missed_meds, panic_alerts, total_incomplete]])
    
    prediction = clf.predict(features)[0]
    probabilities = clf.predict_proba(features)[0]
    
    max_prob = float(max(probabilities)) * 100
    
    status_map = {0: "Stable", 1: "Monitoring Recommended", 2: "High Cognitive Decline Risk"}
    
    insights = []
    if missed_meds > 3:
        insights.append(f"AI Detected {missed_meds} missed medications recently.")
    if panic_alerts > 0:
        insights.append(f"High risk correlation: {panic_alerts} SOS alerts triggered.")
    if prediction == 0 and len(insights) == 0:
        insights.append("Patient behavioral baseline is exceptionally stable.")
        
    return {
        "score": int(max_prob) if prediction == 2 else (int(max_prob // 2) if prediction == 1 else int(100 - max_prob)),
        "status": status_map[prediction],
        "insights": insights,
        "sundowning_window": sundown_window,
        "raw_metrics": {"missed": missed_meds, "panics": panic_alerts}
    }
