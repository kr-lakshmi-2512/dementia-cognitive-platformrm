from fastapi import APIRouter, File, UploadFile, Depends
from services.advanced_features import process_face_image, process_voice_command
from models import domain as models
from api.auth import get_current_user

router = APIRouter()

@router.post("/recognize-face")
async def recognize_face(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    contents = await file.read()
    result = process_face_image(contents)
    return result

@router.post("/voice-assistant")
async def voice_assistant(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    contents = await file.read()
    result = process_voice_command(contents)
    return result
