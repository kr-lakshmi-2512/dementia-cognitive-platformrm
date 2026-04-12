from sqlalchemy.orm import Session
from models import domain as models
from schemas import domain as schemas
from services.logic import create_alert

def analyze_user_behavior(db: Session, user_id: int):
    """
    Analyzes missed reminders and triggers alerts if abnormal thresholds are met.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"status": "User not found"}
        
    # Check missed reminders
    missed_reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == user_id,
        models.Reminder.is_completed == False
    ).count()
    
    analysis_results = []
    
    if missed_reminders >= 3:
        # Trigger an alert
        alert = schemas.AlertCreate(
            alert_type="Multiple Missed Medications",
            description=f"User {user.full_name} has missed {missed_reminders} reminders recently."
        )
        create_alert(db, alert, user_id)
        analysis_results.append(f"Alert generated for {missed_reminders} missed reminders.")
    
    # We can add more logic here (e.g., location anomalies)
    return {"status": "Analysis complete", "details": analysis_results}
