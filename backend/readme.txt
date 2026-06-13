# VitalSync — Setup & Run Guide

## Project Structure
```
vitalsync/
├── backend/
│   ├── main.py          ← FastAPI server (port 8000)
│   ├── app.py           ← Flask AI/Triage server (port 5000)
│   ├── database.py      ← SQLAlchemy DB models
│   └── models.py        ← Pydantic request models
└── frontend/
    └── src/
        └── pages/
            ├── PatientDashboard.jsx
            ├── DoctorDashboard.jsx   (your original, unchanged)
            ├── AdminDashboard.jsx    (your original, unchanged)
            ├── Auth.jsx              (your original, unchanged)
            └── Home.jsx              (your original, unchanged)
```

---

## Step 1 — Backend Setup (FastAPI)

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-multipart

# Delete old DB if exists (schema changed!)
rm -f healthcare.db

# Start server
uvicorn main:app --reload --port 8000
```

FastAPI will be running at: http://localhost:8000
Test it: http://localhost:8000/doctors

---

## Step 2 — AI Server Setup (Flask)

Open a NEW terminal:

```bash
cd backend

# Install dependencies
pip install flask flask-cors groq textblob

# Start server
python app.py
```

Flask AI server runs at: http://localhost:5000

---

## Step 3 — Frontend Setup (React)

Open another NEW terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@vitalsync.com    | Admin@2026  |
| Patient | Sign up on /signup     | Your choice |
| Doctor  | Sign up on /signup     | Your choice |

---

## What was fixed

1. **database.py** — `Appointment.id` changed from Integer to String (UUID)
2. **models.py** — Added `summary`, `risk_level` to `AppointmentCreate`; made all `PrescriptionCreate` fields optional
3. **main.py** — Added missing `GET /appointments` route (both dashboards need this)
4. **main.py** — Fixed `POST /appointments` to use `appointment_date` + `appointment_time` separately
5. **PatientDashboard.jsx** — Fixed booking payload to send `appointment_date` and `appointment_time` instead of combined ISO string

---

## API Endpoints

| Method | URL                              | Description                   |
|--------|----------------------------------|-------------------------------|
| GET    | /doctors                         | List all doctors              |
| GET    | /appointments                    | All appointments (all users)  |
| GET    | /appointments/slots?doctor_id=&date= | Booked slots for a doctor |
| POST   | /appointments                    | Book a new appointment        |
| GET    | /doctor/{id}/appointments        | Doctor-specific appointments  |
| POST   | /ai/analyze                      | AI symptom analysis           |
| POST   | /send-prescription               | Save prescription to DB       |
| WS     | /ws                              | WebSocket for live updates    |