from sqlalchemy.orm import Session
from models import domain as models
from schemas import domain as schemas
from core.security import get_password_hash

from sqlalchemy import func

def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    cleaned_email = email.strip().lower()
    return db.query(models.User).filter(func.lower(models.User.email) == cleaned_email).first()

def get_user_by_id(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    resp = schemas.UserResponse.model_validate(user)
    if user.caregiver_id:
        cg = db.query(models.User).filter(models.User.id == user.caregiver_id).first()
        if cg:
            resp.caregiver_name = cg.full_name
    if user.doctor_id:
        doc = db.query(models.User).filter(models.User.id == user.doctor_id).first()
        if doc:
            resp.doctor_name = doc.full_name
    return resp

def create_user(db: Session, user: schemas.UserCreate):
    cleaned_email = user.email.strip().lower()
    existing_user = get_user_by_email(db, cleaned_email)
    hashed_password = get_password_hash(user.password.strip())

    if existing_user:
        existing_user.full_name = user.full_name.strip()
        existing_user.hashed_password = hashed_password
        existing_user.role = user.role
        db.commit()
        db.refresh(existing_user)
        return existing_user

    db_user = models.User(
        email=cleaned_email,
        full_name=user.full_name.strip(),
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def _resolve_target_user(db: Session, current_user_id: int) -> int:
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if current_user and current_user.role in ["Caregiver", "Doctor"]:
        if current_user.role == "Caregiver":
            patient = db.query(models.User).filter(models.User.caregiver_id == current_user.id).first()
            if patient:
                return patient.id
        elif current_user.role == "Doctor":
            patient = db.query(models.User).filter(models.User.doctor_id == current_user.id).first()
            if patient:
                return patient.id
    return current_user_id

def create_reminder(db: Session, reminder: schemas.ReminderCreate, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    db_reminder = models.Reminder(**reminder.model_dump(), user_id=target_id)
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

def get_reminders(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role in ["Caregiver", "Doctor"]:
        return db.query(models.Reminder).all()
    return db.query(models.Reminder).filter(models.Reminder.user_id == user_id).all()

def update_reminder(db: Session, reminder_id: int, reminder_in: schemas.ReminderCreate):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if reminder:
        reminder.title = reminder_in.title
        reminder.time = reminder_in.time
        db.commit()
        db.refresh(reminder)
    return reminder

def delete_reminder(db: Session, reminder_id: int):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if reminder:
        db.delete(reminder)
        db.commit()
    return reminder

def complete_reminder(db: Session, reminder_id: int):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if reminder:
        reminder.is_completed = True
        db.commit()
        db.refresh(reminder)
    return reminder

def miss_reminder(db: Session, reminder_id: int):
    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if reminder:
        reminder.is_completed = True
        
        # Create an automatic alert for the missed medication
        alert = models.Alert(
            user_id=reminder.user_id,
            alert_type="Missed Medication",
            description=f"Patient missed / forgot task: {reminder.title}"
        )
        db.add(alert)
        db.commit()
        db.refresh(reminder)
    return reminder

def create_alert(db: Session, alert: schemas.AlertCreate, user_id: int):
    # Alerts typically originate from patients (e.g. SOS), keeping user_id direct
    db_alert = models.Alert(**alert.model_dump(), user_id=user_id)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_alerts(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role in ["Caregiver", "Doctor"]:
        return db.query(models.Alert).all()
    return db.query(models.Alert).filter(models.Alert.user_id == user_id).all()

def delete_alert(db: Session, alert_id: int):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
        return True
    return False

def create_location(db: Session, location: schemas.LocationCreate, user_id: int):
    db_location = models.Location(**location.model_dump(), user_id=user_id)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

def create_note(db: Session, note: schemas.NoteCreate, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    db_item = models.Note(**note.model_dump(), user_id=target_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_notes(db: Session, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    return db.query(models.Note).filter(models.Note.user_id == target_id).all()

def create_contact(db: Session, contact: schemas.ContactCreate, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    db_item = models.Contact(**contact.model_dump(), user_id=target_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_contacts(db: Session, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    return db.query(models.Contact).filter(models.Contact.user_id == target_id).all()

def create_photo(db: Session, photo: schemas.PhotoCreate, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    db_item = models.Photo(**photo.model_dump(), user_id=target_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_photos(db: Session, user_id: int):
    target_id = _resolve_target_user(db, user_id)
    return db.query(models.Photo).filter(models.Photo.user_id == target_id).all()

def delete_photo(db: Session, photo_id: int):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if photo:
        db.delete(photo)
        db.commit()
    return photo

# --- New Logic ---

def get_patients_for_user(db: Session, user: models.User):
    patients = []
    if user.role == "Caregiver":
        patients = db.query(models.User).filter(models.User.caregiver_id == user.id).all()
        if not patients:
            patients = db.query(models.User).filter(models.User.role == "Patient").all()
    elif user.role == "Doctor":
        patients = db.query(models.User).filter(models.User.doctor_id == user.id).all()
        if not patients:
            patients = db.query(models.User).filter(models.User.role == "Patient").all()
    else:
        patients = db.query(models.User).filter(models.User.role == "Patient").all()

    result = []
    for p in patients:
        resp = schemas.UserResponse.model_validate(p)
        if p.caregiver_id:
            cg = db.query(models.User).filter(models.User.id == p.caregiver_id).first()
            if cg:
                resp.caregiver_name = cg.full_name
        if p.doctor_id:
            doc = db.query(models.User).filter(models.User.id == p.doctor_id).first()
            if doc:
                resp.doctor_name = doc.full_name
        result.append(resp)
    return result

def get_all_doctors(db: Session):
    return db.query(models.User).filter(models.User.role == "Doctor").all()

def get_all_caregivers(db: Session):
    return db.query(models.User).filter(models.User.role == "Caregiver").all()

def link_patient_to_user(db: Session, patient_id: int, user: models.User):
    patient = db.query(models.User).filter(models.User.id == patient_id, models.User.role == "Patient").first()
    if patient:
        if user.role == "Caregiver":
            patient.caregiver_id = user.id
        elif user.role == "Doctor":
            patient.doctor_id = user.id
        db.commit()
    return patient

def link_patient_by_email(db: Session, email: str, user: models.User):
    cleaned_email = email.strip().lower()
    patient = db.query(models.User).filter(func.lower(models.User.email) == cleaned_email, models.User.role == "Patient").first()
    if patient:
        if user.role == "Caregiver":
            patient.caregiver_id = user.id
        elif user.role == "Doctor":
            patient.doctor_id = user.id
        db.commit()
        db.refresh(patient)
    return patient

def unlink_patient_from_user(db: Session, patient_id: int, user: models.User):
    patient = db.query(models.User).filter(models.User.id == patient_id, models.User.role == "Patient").first()
    if patient:
        if user.role == "Caregiver":
            patient.caregiver_id = None
        elif user.role == "Doctor":
            patient.doctor_id = None
        db.commit()
        db.refresh(patient)
    return patient

def create_message(db: Session, message: schemas.MessageCreate, sender_id: int):
    db_message = models.Message(**message.model_dump(), sender_id=sender_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(db: Session, user1_id: int, user2_id: int):
    return db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.timestamp.asc()).all()

def get_latest_location(db: Session, patient_id: int):
    return db.query(models.Location).filter(models.Location.user_id == patient_id).order_by(models.Location.timestamp.desc()).first()
