from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models import domain as models
from api.auth import get_current_user

router = APIRouter()

@router.get("/analytics/medication-adherence")
def get_medication_adherence(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns analytics for medication adherence"""
    total = db.query(models.Reminder).filter(models.Reminder.user_id == current_user.id).count()
    completed = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id,
        models.Reminder.is_completed == True
    ).count()
    
    adherence_rate = (completed / total * 100) if total > 0 else 0
    return {"adherence_rate": adherence_rate, "total": total, "completed": completed}
