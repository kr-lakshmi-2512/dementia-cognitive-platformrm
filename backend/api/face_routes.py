"""
Face Recognition API Routes
POST /api/v1/face/register   - enroll a face for a member with details
POST /api/v1/face/recognize  - identify who is in a photo
DELETE /api/v1/face/{member_id} - remove face data for a member
DELETE /api/v1/face/all       - remove all face data
GET  /api/v1/face/members    - list all enrolled members with full metadata
GET  /api/v1/face/enrolled   - backward-compatible enrolled list
GET  /api/v1/face/{member_id}/photo - serve member photo
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

FACE_DB_DIR = Path(__file__).parent.parent / "face_db"
router = APIRouter(prefix="/face", tags=["Face Recognition"])


@router.post("/register")
async def register_face_endpoint(
    member_id: str   = Form(...),
    member_name: str = Form(...),
    relation: str    = Form("Family Member"),
    desc: str        = Form(None),
    color: str       = Form("#7c3aed"),
    icon: str        = Form("person"),
    file: UploadFile = File(...)
):
    """Enroll a face image for a specific member."""
    try:
        from services.face_recognition_service import register_face
        image_bytes = await file.read()
        result = register_face(
            member_id=member_id,
            member_name=member_name,
            image_bytes=image_bytes,
            relation=relation,
            desc=desc,
            color=color,
            icon=icon
        )
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
        from services.face_recognition_service import recognize_face
        image_bytes = await file.read()
        result = recognize_face(image_bytes)
        return JSONResponse(content=result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=200, content={"status": "error", "message": f"Recognition error: {str(e)}"})


@router.get("/members")
@router.get("/enrolled")
async def get_enrolled_endpoint():
    """Get list of all members with enrolled faces and photos."""
    try:
        from services.face_recognition_service import get_enrolled_members
        members = get_enrolled_members()
        return JSONResponse(content={"status": "success", "enrolled": members, "members": members})
    except Exception as e:
        return JSONResponse(status_code=200, content={"status": "error", "enrolled": [], "members": []})


@router.get("/{member_id}/photo")
async def get_face_photo_endpoint(member_id: str):
    """Serve registered photo for a member."""
    photo_file = FACE_DB_DIR / member_id / "photo.jpg"
    if not photo_file.exists():
        photo_file = FACE_DB_DIR / member_id / "face_00.jpg"
    if photo_file.exists():
        return FileResponse(str(photo_file), media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Photo not found")


@router.delete("/all")
async def clear_all_faces_endpoint():
    """Remove all members and face data."""
    try:
        from services.face_recognition_service import clear_all_faces
        result = clear_all_faces()
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})


@router.delete("/{member_id}")
async def delete_face_endpoint(member_id: str):
    """Remove all face data for a member."""
    try:
        from services.face_recognition_service import delete_face
        result = delete_face(member_id)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})

