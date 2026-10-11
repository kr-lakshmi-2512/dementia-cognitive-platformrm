"""
Face Recognition API Routes
POST /api/v1/face/register   - enroll a face for a member
POST /api/v1/face/recognize  - identify who is in a photo  
DELETE /api/v1/face/{member_id} - remove face data for a member
GET  /api/v1/face/enrolled   - list all enrolled members
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/face", tags=["Face Recognition"])


def _get_service():
    from services.face_recognition_service import (
        register_face, recognize_face, delete_face, get_enrolled_members
    )
    return register_face, recognize_face, delete_face, get_enrolled_members


@router.post("/register")
async def register_face_endpoint(
    member_id: str   = Form(...),
    member_name: str = Form(...),
    file: UploadFile = File(...)
):
    """Enroll a face image for a specific member."""
    try:
        reg, _, _, _ = _get_service()
        image_bytes = await file.read()
        result = reg(member_id, member_name, image_bytes)
        return JSONResponse(content=result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})


@router.post("/recognize")
async def recognize_face_endpoint(
    file: UploadFile = File(...)
):
    """Identify who is in the uploaded image."""
    try:
        _, rec, _, _ = _get_service()
        image_bytes = await file.read()
        result = rec(image_bytes)
        return JSONResponse(content=result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=200, content={"status": "error", "message": f"Recognition error: {str(e)}"})


@router.delete("/{member_id}")
async def delete_face_endpoint(member_id: str):
    """Remove all face data for a member."""
    try:
        _, _, dlt, _ = _get_service()
        result = dlt(member_id)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})


@router.get("/enrolled")
async def get_enrolled_endpoint():
    """Get list of all members with enrolled faces."""
    try:
        _, _, _, enrolled = _get_service()
        return JSONResponse(content={"enrolled": enrolled()})
    except Exception as e:
        return JSONResponse(status_code=200, content={"enrolled": []})
