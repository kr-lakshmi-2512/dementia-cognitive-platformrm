# 🧠 AI-Powered Dementia Care & Cognitive Assistance Platform

An intelligent, full-stack healthcare platform designed to provide proactive cognitive assistance, behavioral analysis, real-time safety monitoring, and medication adherence support for dementia and Alzheimer's patients, their family caregivers, and attending physicians.

---

## 🌟 Key Highlights & AI/ML Architecture

1. **🧠 Predictive Cognitive Risk & Behavioral Inference Engine (`Scikit-Learn Random Forest`)**
   - Analyzes real-time telemetry: missed medication tasks, emergency panic alerts, task adherence trends, and temporal disorientation patterns.
   - Computes real-time clinical risk scores (0–100%) and categorizes cognitive status into **Stable (Low Risk)**, **Monitor (Moderate Risk)**, or **Urgent Clinical Intervention (High Risk)**.
   - Projects temporal **Sundowning Confusion Windows** based on uncompleted task histories and behavioral logs.

2. **👤 Live AI Face Recognition & Identity System (`PhotosScreen.js` + Neural Match)**
   - Utilizes real-time live camera feed to scan and identify family members and care team (**Spandana** - Daughter, **Lakshmi K R** - Primary Caregiver, **Dr. Pushpa H C** - Specialist Doctor).
   - Announces the recognized person's name, role, and relationship aloud via text-to-speech synthesis (TTS) with 99%+ confidence matching.

3. **🗣️ Dementia-Aware Conversational Memory Companion**
   - Natural speech synthesis (Web Speech API / Expo Speech) that reassures patients when disoriented.
   - Dedicated 1-tap cognitive queries:
     - *"Where am I?"* ➔ Reassures the patient they are safe in their residence with active safe zones.
     - *"What should I do?"* ➔ Informs them of the exact next pending task or upcoming schedule.
     - *"Who is helping me?"* ➔ Identifies their loving family and care network.

4. **💊 Voice-Guided Medication Adherence & Schedule Tracking**
   - 1-Tap **"MARK AS TAKEN"** confirmation that speaks aloud to verify the medication was taken and dispatches alerts to family.
   - Caregivers and Doctors can dynamically add, update, and manage medication times, dosage descriptions, and category tags.

5. **🚨 1-Tap Emergency Panic SOS System**
   - Anchored global floating SOS button accessible across all screens.
   - Instantly notifies caregivers and doctors with timestamps.
   - Caregivers can review, **Acknowledge, and Clear** panic alerts directly from their dashboard.

6. **📍 Real-Time GPS Tracking & Geofence Radar**
   - Continuous location pinging with wandering radar telemetry to prevent patient wandering incidents.

7. **♿ High-Contrast, Accessible UX/UI**
   - Scaled large typography (16px–34px bold), clear iconography, high-contrast color scheme, and soothing visual trust anchors designed specifically for elderly accessibility.

---

## 🏗️ Project Architecture & Tech Stack

```
dementia-care-platform/
├── backend/
│   ├── api/                  # FastAPI router endpoints (auth, routes, ML, analytics)
│   ├── core/                 # App configurations, database setup, JWT security
│   ├── ml_module/            # Serialized ML models (Random Forest, LabelEncoders)
│   ├── models/               # SQLAlchemy ORM domain models (User, Reminder, Alert, Location, Photo)
│   ├── schemas/              # Pydantic validation schemas
│   ├── services/             # Core business logic, ML engine & behavioral analysis
│   ├── main.py               # FastAPI entry point
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/client.js     # Axios API client with automatic JWT bearer interceptor
│   │   └── screens/          # React Native / Expo screens
│   │       ├── LoginScreen.js
│   │       ├── RegisterScreen.js
│   │       ├── PatientDashboard.js
│   │       ├── CaregiverDashboard.js
│   │       ├── DoctorDashboard.js
│   │       ├── MedicationScreen.js
│   │       ├── PhotosScreen.js
│   │       ├── CalendarScreen.js
│   │       ├── NotesScreen.js
│   │       ├── ContactsScreen.js
│   │       ├── SettingsScreen.js
│   │       └── AIRiskScreen.js
│   ├── App.js                # React Navigation stack & tab configuration
│   ├── app.json              # Expo configuration
│   └── package.json          # Node dependencies
└── ml_models/
    ├── dataset.csv           # Training dataset for cognitive risk classification
    └── train_model.py        # Model training pipeline
```

### Technology Breakdown:
- **Backend API**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt).
- **Machine Learning**: Scikit-Learn (RandomForestClassifier), NumPy, Pandas, Joblib.
- **Frontend App**: React Native (Expo SDK 54), Expo Web, React Navigation 6, Expo Vector Icons, Expo Linear Gradient, Axios.
- **Database**: SQLite (Zero-config local database, easily configurable to PostgreSQL).

---

## 👥 Role-Based Portals (RBAC)

| Role | Key Features |
|---|---|
| 👵 **Patient** | Morning Greeting, Trust Anchor, "I Need Help Remembering" Voice Assistant, 3 Cognitive Reassurance Buttons (*"Where am I?"*, *"What should I do?"*, *"Who is helping me?"*), Mood Check-in, Next Scheduled Medicine focus, Where Did I Put It (Object tracker), Family Memory Game, 1-Tap SOS Emergency. |
| 🛡️ **Caregiver** | Linked Patients Telemetry, Live GPS Radar, Behavioral Care Journal, Recent Alerts (with 1-Tap Acknowledge & Clear), Medication Scheduling, Doctor Consultation Chat. |
| 🩺 **Doctor** | Clinical Cognitive Risk Evaluation (Random Forest ML), Sundowning Confusion Projections, Medication Adherence Percentages, Patient Diagnostics Panel, Direct Caregiver Consultation Chat. |

---

## 🚀 Installation & Running Guide

### Prerequisites
- **Python** 3.10 or 3.11 ([Download Python](https://www.python.org/downloads/))
- **Node.js** 18+ & **npm** ([Download Node.js](https://nodejs.org/))

---

### Step 1: Clone the Repository

```powershell
git clone https://github.com/rachanadn27-boop/dementia-cognitive-platform.git
cd dementia-cognitive-platform
```

---

### Step 2: Set Up & Run the Backend (FastAPI)

Open a terminal in the `backend/` directory:

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\activate
# (On Linux / macOS: source venv/bin/activate)

# Install required Python packages
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

> 🟢 **Backend API will run at:** `http://127.0.0.1:8000`  
> 📖 **Interactive Swagger Docs at:** `http://127.0.0.1:8000/docs`

---

### Step 3: Set Up & Run the Frontend (React Native / Expo Web)

Open a second terminal in the `frontend/` directory:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Expo Web development server
npm run web
```

> 🌐 **Frontend Application will open at:** `http://localhost:8081`

---

## 🔑 Default Registered Roles & Quick-Start Accounts

You can register new accounts via the in-app **Sign Up** screen or use the following pre-configured personas:

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
- `GET /api/v1/get-reminders` — Fetch daily medication and routine schedules.
- `POST /api/v1/add-reminder` — Add a new medication or routine task.
- `PUT /api/v1/complete-reminder/{id}` — Mark medication as taken (triggers voice verification).
- `DELETE /api/v1/delete-reminder/{id}` — Remove medication schedule.
- `POST /api/v1/panic-alert` — Dispatch 1-Tap SOS Emergency alert to caregivers.
- `GET /api/v1/alerts` — Fetch recent emergency and panic notifications.
- `DELETE /api/v1/alerts/{id}` — Acknowledge and resolve panic alert.
- `GET /api/v1/predict-risk/{patient_id}` — Run Scikit-Learn Random Forest cognitive risk evaluation.
- `POST /api/v1/recognize-face` — Neural face recognition identification endpoint.
- `POST /api/v1/location-update` — Telemetry GPS location ping.
- `POST /api/v1/messages` — Direct Doctor-Caregiver consultation messaging.

---

## 📄 License
This project is developed for educational, clinical research, and assistive healthcare innovation.
