from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Patient") # Roles: Patient, Caregiver, Doctor
    
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    patients_as_caregiver = relationship("User", foreign_keys=[caregiver_id], backref="caregiver", remote_side=[id])
    patients_as_doctor = relationship("User", foreign_keys=[doctor_id], backref="doctor", remote_side=[id])
    
    reminders = relationship("Reminder", back_populates="user", foreign_keys="Reminder.user_id")
    alerts = relationship("Alert", back_populates="user")
    locations = relationship("Location", back_populates="user")
    notes = relationship("Note", back_populates="user")
    contacts = relationship("Contact", back_populates="user")
    photos = relationship("Photo", back_populates="user")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # The patient
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True) # The caregiver/doctor
    title = Column(String, index=True)
    description = Column(String)
    time = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="reminders")
    assigner = relationship("User", foreign_keys=[assigned_by])

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    alert_type = Column(String) # e.g., "Panic", "Missed Medication", "Geofence Breach"
    description = Column(String)
    timestamp = Column(DateTime, default=func.now())
    is_resolved = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="alerts")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=func.now())
    is_safe_zone = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="locations")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="notes")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    phone = Column(String)
    relation = Column(String, default="Family")
    user = relationship("User", back_populates="contacts")

class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)
    image_url = Column(String)
    timestamp = Column(DateTime, default=func.now())
    user = relationship("User", back_populates="photos")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=func.now())
    
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class BehaviorLog(Base):
    __tablename__ = "behavior_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    log_type = Column(String) # "Missed Medication", "Activity"
    details = Column(String)
    timestamp = Column(DateTime, default=func.now())
    
    user = relationship("User")

# Alias for backward compatibility
LocationLog = Location
