from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from models import domain as models  # Ensure models are loaded before create_all
from api import auth, routes, ml_routes, advanced_routes, analytics_routes, face_routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router,          prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(routes.router,        prefix=settings.API_V1_STR, tags=["Domain Services"])
app.include_router(ml_routes.router,     prefix=settings.API_V1_STR, tags=["Machine Learning"])
app.include_router(advanced_routes.router, prefix=settings.API_V1_STR, tags=["Advanced Features"])
app.include_router(analytics_routes.router, prefix=settings.API_V1_STR, tags=["Analytics Dashboards"])
app.include_router(face_routes.router,   prefix=settings.API_V1_STR, tags=["Face Recognition"])

from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

# Unified Single-Platform Serving: Check for built frontend in frontend/dist or backend/dist
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if not FRONTEND_DIST.exists():
    FRONTEND_DIST = Path(__file__).resolve().parent / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    expo_dir = FRONTEND_DIST / "_expo"
    if expo_dir.exists():
        app.mount("/_expo", StaticFiles(directory=str(expo_dir)), name="expo-static")

    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets-static")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        # Do not intercept API endpoints or Swagger docs
        if full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": "Welcome to the AIML-Based Smart Cognitive Assistance API",
            "docs": "/docs"
        }
