# ========================================================
# Multi-stage Dockerfile: Unified Frontend & Backend Build
# ========================================================

# Stage 1: Build the React Native (Expo Web) frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npx expo export -p web

# Stage 2: Python 3.11 Backend with FastAPI, Scikit-Learn & OpenCV
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV and libgomp
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code and models
COPY backend/ ./backend/
COPY ml_models/ ./ml_models/

# Copy compiled frontend from Stage 1 into backend/dist
COPY --from=frontend-builder /app/frontend/dist ./backend/dist

WORKDIR /app/backend

# Default port configuration for Render, Railway, Fly.io, or VPS
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
