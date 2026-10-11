# 🧠 AI-Powered Dementia Care & Cognitive Assistance Platform

An intelligent, full-stack healthcare platform designed to provide proactive cognitive assistance, behavioral analysis, real-time safety monitoring, medication adherence support, and AI-powered facial recognition for dementia and Alzheimer's patients, their family caregivers, and attending physicians.

---

## 🌐 Live Production Deployment

The unified full-stack application (Frontend + Backend + Computer Vision + Clinical ML) is deployed live on **Render Cloud**:

- **🚀 Live Application URL**: [https://dementia-care-platform-0u7y.onrender.com](https://dementia-care-platform-0u7y.onrender.com)
- **📡 API Health Check**: [https://dementia-care-platform-0u7y.onrender.com/api/v1/health](https://dementia-care-platform-0u7y.onrender.com/api/v1/health)
- **📖 Interactive Swagger API Docs**: [https://dementia-care-platform-0u7y.onrender.com/docs](https://dementia-care-platform-0u7y.onrender.com/docs)
- **🔗 GitHub Repository**: [https://github.com/kr-lakshmi-2512/dementia-cognitive-platformrm](https://github.com/kr-lakshmi-2512/dementia-cognitive-platformrm)

> 💡 **Cross-Device Ready**: You can open the live link directly in any mobile browser (Safari, Chrome on iPhone / Android) or desktop. The UI is fully responsive with cross-phone cloud synchronization.

---

## 🌟 Key Highlights & AI/ML Architecture

1. **👤 Multi-Phone Cloud Facial Recognition (`PhotosScreen.js` + OpenCV & ZNCC)**
   - Single-photo registration with 15 auto-augmented facial variations.
   - Powered by **Zero-mean Normalized Cross-Correlation (ZNCC)** and Local Binary Patterns Histograms (LBPH) to eliminate ambient lighting and skin-tone bias.
   - **Cross-Device Cloud Sync**: Once a family member is registered on any phone, their photo, relationship, and memory notes instantly sync to all other phones logged into the same account.
   - Real-time voice announcement: *"Recognized: This is [Name], your [Relation]."*

2. **🧠 Predictive Cognitive Risk & Behavioral Inference Engine (`Scikit-Learn Random Forest`)**
   - Analyzes real-time telemetry: missed medication tasks, emergency panic alerts, task adherence trends, and temporal disorientation patterns.
   - Computes clinical cognitive risk scores (0–100%) and categorizes cognitive status into **Stable (Low Risk)**, **Monitor (Moderate Risk)**, or **Urgent Clinical Intervention (High Risk)**.
   - Projects temporal **Sundowning Confusion Windows** based on behavioral logs and task histories.

3. **🗣️ Dementia-Aware Conversational Memory Companion**
   - Natural speech synthesis (Web Speech API) that reassures patients when disoriented.
   - Dedicated 1-tap cognitive reassurance queries:
     - *"Where am I?"* ➔ Reassures the patient they are safe in their residence with active safe zones.
     - *"What should I do?"* ➔ Informs them of the exact next pending task or upcoming schedule.
     - *"Who is helping me?"* ➔ Identifies their loving family and care network.

4. **💊 Voice-Guided Medication Adherence & Schedule Tracking**
   - 1-Tap **"MARK AS TAKEN"** confirmation that speaks aloud to verify the medication was taken and dispatches alerts to family.
   - Caregivers and Doctors can dynamically add, update, and manage medication times, dosage descriptions, and category tags.

5. **🚨 1-Tap Emergency SOS System**
   - Confined strictly to the **Patient Dashboard** with confirmation dialog to prevent accidental triggers.
   - Instantly notifies caregivers and doctors with live timestamps.
   - Caregivers can review, **Acknowledge, and Clear** panic alerts directly from their dashboard.

6. **📍 Real-Time GPS Tracking & Geofence Radar**
   - Continuous location pinging with wandering radar telemetry to prevent patient wandering incidents.

7. **♿ High-Contrast, Accessible UX/UI**
   - Scaled large typography (16px–34px bold), clear iconography, high-contrast color scheme, and soothing visual trust anchors designed specifically for elderly accessibility.

---

## 🏗️ Project Architecture & Tech Stack

```
dementia-care-platform/
├── Dockerfile                # Multi-stage container (Stage 1: Expo Web Build, Stage 2: FastAPI + OpenCV)
├── render.yaml               # Render Cloud infrastructure definition
├── backend/
│   ├── api/                  # FastAPI router endpoints (auth, face_routes, ml_routes, routes)
│   ├── core/                 # Database configuration (SQLite WAL Mode), JWT security
│   ├── face_db/              # Enrolled facial templates, member metadata & sample photos
│   ├── ml_module/            # Clinical machine learning risk models
│   ├── models/               # SQLAlchemy ORM domain models (User, Reminder, Alert, Photo, etc.)
│   ├── schemas/              # Pydantic validation schemas
│   ├── services/             # Face recognition (ZNCC+LBPH) & clinical ML inference
│   ├── main.py               # FastAPI entry point & unified Expo Web static server
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/client.js     # Axios API client with dynamic host resolution & JWT interceptor
│   │   └── screens/          # React Native / Expo screens
│   │       ├── LoginScreen.js
│   │       ├── RegisterScreen.js
│   │       ├── PatientDashboard.js
│   │       ├── CaregiverDashboard.js
│   │       ├── DoctorDashboard.js
│   │       ├── MedicationScreen.js
│   │       ├── PhotosScreen.js        # Family Memory Directory with live Camera & ZNCC Match
│   │       ├── CalendarScreen.js
│   │       ├── NotesScreen.js
│   │       ├── ContactsScreen.js
│   │       ├── SettingsScreen.js
│   │       └── AIRiskScreen.js
│   ├── App.js                # React Navigation stack & bottom tab configuration
│   ├── app.json              # Expo configuration
│   └── package.json          # Node dependencies
└── ml_models/
    ├── dataset.csv           # OASIS clinical dementia dataset
    └── train_model.py        # Model training pipeline
```

### Technology Breakdown:
- **Frontend App**: React Native (Expo SDK 54), `react-native-web` (v0.21), React Navigation 6, Expo Vector Icons, Expo Linear Gradient, Axios, WebRTC, Web Speech API.
- **Backend API**: Python 3.11, FastAPI, Uvicorn (ASGI), SQLAlchemy ORM, Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt).
- **Vision AI**: OpenCV (`cv2`), Haar Cascade Classifiers, Zero-mean Normalized Cross-Correlation (ZNCC), Local Binary Patterns Histograms (LBPH).
- **Machine Learning**: Scikit-Learn (Random Forest Classifier, StandardScaler), NumPy, Pandas, Joblib.
- **Database**: SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL`) and 30s busy timeout for high concurrent multi-user sync.
- **DevOps & Cloud**: Docker multi-stage containerization, Render Cloud, GitHub CI/CD webhooks.

---

## 👥 Role-Based Portals (RBAC)

| Role | Key Features |
|---|---|
| 👵 **Patient** | Morning Greeting, Trust Anchor, "I Need Help Remembering" Voice Assistant, 3 Cognitive Reassurance Buttons (*"Where am I?"*, *"What should I do?"*, *"Who is helping me?"*), Mood Check-in, Next Scheduled Medicine focus, Where Did I Put It (Object tracker), Family Memory Directory (Face Scan), 1-Tap SOS Emergency. |
| 🛡️ **Caregiver** | Linked Patients Telemetry, Live GPS Radar, Behavioral Care Journal, Recent Alerts (with 1-Tap Acknowledge & Clear), Medication Scheduling, Doctor Consultation Chat. |
| 🩺 **Doctor** | Clinical Cognitive Risk Evaluation (Random Forest ML), Sundowning Confusion Projections, Medication Adherence Percentages, Patient Diagnostics Panel, Direct Caregiver Consultation Chat. |

---

## 🚀 Local Installation & Running Guide

### Prerequisites
- **Python** 3.10 or 3.11 ([Download Python](https://www.python.org/downloads/))
- **Node.js** 18+ & **npm** ([Download Node.js](https://nodejs.org/))

---

### Step 1: Clone the Repository

```powershell
git clone https://github.com/kr-lakshmi-2512/dementia-cognitive-platformrm.git
cd dementia-cognitive-platformrm
```

---

### Step 2: Set Up & Run the Backend (FastAPI)

Open a terminal in the `backend/` directory:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
# (On Linux / macOS: source venv/bin/activate)

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

> 🟢 **Backend API running at:** `http://127.0.0.1:8000`  
> 📖 **Interactive Swagger Docs at:** `http://127.0.0.1:8000/docs`

---

### Step 3: Set Up & Run the Frontend (React Native / Expo Web)

Open a second terminal in the `frontend/` directory:

```powershell
cd frontend
npm install
npx expo start --web
```

> 🌐 **Frontend Application will open at:** `http://localhost:8081`

---

## 🔑 Pre-Configured Test Personas

You can register any new account via **Sign Up**, or log in with these pre-configured personas:

| Persona | Role | Details |
|---|---|---|
| **Rachana D N** | `Patient` | Primary patient under care. |
| **Spandana** | `Family` | Loving daughter and memory anchor. |
| **Lakshmi K R** | `Caregiver` | Primary caregiver managing daily medication and safety. |
| **Dr. Pushpa H C** | `Doctor` | Attending neurologist evaluating cognitive ML risk metrics. |

---

## 📡 Core API Endpoints

- `POST /api/v1/register` — Create a new Patient, Caregiver, or Doctor account.
- `POST /api/v1/login` — Authenticate and receive JWT Bearer token.
- `GET /api/v1/face/members` — Fetch registered family members with relations, notes, and photos.
- `GET /api/v1/face/{member_id}/photo` — Serve the registered face photo.
- `POST /api/v1/face/register` — Register a new member with photo and generate 15 augmented training samples.
- `POST /api/v1/face/recognize` — Identify who is in the photo via ZNCC + LBPH.
- `GET /api/v1/get-reminders` — Fetch daily medication and routine schedules.
- `POST /api/v1/add-reminder` — Add a new medication or routine task.
- `PUT /api/v1/complete-reminder/{id}` — Mark medication as taken (triggers voice verification).
- `POST /api/v1/panic-alert` — Dispatch 1-Tap SOS Emergency alert to caregivers.
- `GET /api/v1/alerts` — Fetch recent emergency and panic notifications.
- `DELETE /api/v1/alerts/{id}` — Acknowledge and resolve panic alert.
- `GET /api/v1/predict-risk/{patient_id}` — Run Scikit-Learn Random Forest cognitive risk evaluation.
- `POST /api/v1/location-update` — Telemetry GPS location ping.
- `POST /api/v1/messages` — Direct Doctor-Caregiver consultation messaging.

---

## 📄 License
This project is developed for educational, clinical research, and assistive healthcare innovation.
