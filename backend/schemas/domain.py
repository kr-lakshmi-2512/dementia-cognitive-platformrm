from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "Patient"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    caregiver_id: Optional[int] = None
    doctor_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# --- Reminder Schemas ---
class ReminderBase(BaseModel):
    title: str
    description: Optional[str] = None
    time: datetime
    is_completed: bool = False

class ReminderCreate(ReminderBase):
    pass

class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    assigned_by: Optional[int] = None

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertBase(BaseModel):
    alert_type: str
    description: str

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    user_id: int
    timestamp: datetime
    is_resolved: bool

    class Config:
        from_attributes = True
        
# --- Location Schemas ---
class LocationBase(BaseModel):
    latitude: float
    longitude: float

class LocationCreate(LocationBase):
    pass
    
class LocationResponse(LocationBase):
    id: int
    user_id: int
    timestamp: datetime
    is_safe_zone: bool
    
    class Config:
        from_attributes = True

# --- Note Schemas ---
class NoteBase(BaseModel):
    title: str
    content: str

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Contact Schemas ---
class ContactBase(BaseModel):
    name: str
    phone: str
    relation: str = "Family"

class ContactCreate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- Photo Schemas ---
class PhotoBase(BaseModel):
    title: str
    description: str
    image_url: str

class PhotoCreate(PhotoBase):
    pass

class PhotoResponse(PhotoBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class FaceScanRequest(BaseModel):
    image_base64: str

class FaceScanResponse(BaseModel):
    match_found: bool
    confidence: float
    identified_name: Optional[str] = None
    message: str

# --- Message Schemas ---
class MessageBase(BaseModel):
    content: str
    receiver_id: int

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Behavior Log Schemas ---
class BehaviorLogBase(BaseModel):
    log_type: str
    details: str

class BehaviorLogCreate(BehaviorLogBase):
    pass
    
class BehaviorLogResponse(BehaviorLogBase):
    id: int
    user_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True
