from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from models import domain as models  # Ensure models are loaded before create_all
from api import auth, routes, ml_routes, advanced_routes, analytics_routes

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
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(routes.router, prefix=settings.API_V1_STR, tags=["Domain Services"])
app.include_router(ml_routes.router, prefix=settings.API_V1_STR, tags=["Machine Learning"])
app.include_router(advanced_routes.router, prefix=settings.API_V1_STR, tags=["Advanced Features"])
app.include_router(analytics_routes.router, prefix=settings.API_V1_STR, tags=["Analytics Dashboards"])

@app.get("/")
def root():
    return {
        "message": "Welcome to the AIML-Based Smart Cognitive Assistance API",
        "docs": "/docs"
    }
