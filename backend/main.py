from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uuid, hashlib, smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()
from database import get_db, Appointment, Prescription, Patient, Doctor
from models import AppointmentCreate, PrescriptionCreate, UserSignup, UserLogin

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

GMAIL_USER     = os.getenv("GMAIL_USER", "")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "")

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()
def verify_password(plain, hashed): return hash_password(plain) == hashed

HIGH_KW   = ["chest pain","heart attack","stroke","can't breathe","breathing difficulty",
             "fainting","unconscious","severe bleeding","paralysis","seizure"]
MEDIUM_KW = ["fever","vomiting","blood","persistent cough","dizziness","severe headache",
             "abdominal pain","swelling","infection","high bp","fracture"]

def ml_risk_score(text):
    t = text.lower()
    for kw in HIGH_KW:
        if kw in t: return "high"
    for kw in MEDIUM_KW:
        if kw in t: return "medium"
    return "low"

def recommend_doctor(text):
    t = text.lower()
    if any(w in t for w in ["chest","heart","cardiac","bp"]): return "Cardiologist"
    if any(w in t for w in ["cough","breathing","lung","asthma"]): return "Pulmonologist"
    if any(w in t for w in ["stomach","vomit","nausea","bowel"]): return "Gastroenterologist"
    if any(w in t for w in ["skin","rash","allergy","itch"]): return "Dermatologist"
    if any(w in t for w in ["head","migraine","seizure","memory"]): return "Neurologist"
    if any(w in t for w in ["child","baby","kid","pediatric"]): return "Pediatrician"
    if any(w in t for w in ["bone","joint","fracture","knee"]): return "Orthopedic"
    if any(w in t for w in ["ear","nose","throat","sinus"]): return "ENT Specialist"
    return "General Physician"

def send_prescription_email(to_email, patient_name, patient_age, doctor_name,
                             diagnosis, medicines, notes, follow_up_date):
    if not GMAIL_USER or not GMAIL_PASSWORD: return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Prescription — Dr. {doctor_name} | VitalSync"
        msg["From"] = GMAIL_USER; msg["To"] = to_email
        med_rows = "".join(
            f"<tr><td style='padding:10px 16px;border-bottom:1px solid #e2e8f0;font-weight:600'>{line}</td></tr>"
            for line in medicines.strip().split("\n") if line.strip()
        )
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;background:#f0f4ff;margin:0;padding:20px">
<div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
<div style="background:linear-gradient(135deg,#1d4ed8,#0891b2);padding:36px 40px;text-align:center">
<h1 style="color:#fff;margin:0 0 8px;font-size:26px">💊 VitalSync Prescription</h1>
<p style="color:rgba(255,255,255,.8);margin:0;font-size:13px">AI-Powered Healthcare Platform</p></div>
<div style="padding:36px 40px">
<table style="width:100%;background:#f0f9ff;border-radius:14px;padding:20px;margin-bottom:28px">
<tr><td style="padding:8px 16px"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Patient</div><div style="font-size:16px;font-weight:700;color:#1e293b">{patient_name}</div></td>
<td style="padding:8px 16px"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Age</div><div style="font-size:16px;font-weight:700;color:#1e293b">{patient_age} yrs</div></td>
<td style="padding:8px 16px"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Doctor</div><div style="font-size:16px;font-weight:700;color:#1e293b">Dr. {doctor_name}</div></td></tr></table>
<div style="margin-bottom:24px"><div style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-bottom:12px">🔍 Diagnosis</div>
<div style="background:#fff7ed;border-left:4px solid #f59e0b;padding:16px;border-radius:0 12px 12px 0;color:#92400e">{diagnosis}</div></div>
<div style="margin-bottom:24px"><div style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-bottom:12px">💊 Medicines</div>
<table style="width:100%;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">{med_rows}</table></div>
{"" if not notes else f'<div style="margin-bottom:24px"><div style="font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;border-bottom:2px solid #dbeafe;padding-bottom:8px;margin-bottom:12px">📝 Notes</div><div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:12px;color:#166534">{notes}</div></div>'}
{"" if not follow_up_date else f'<div style="background:#fdf4ff;border:1px solid #e9d5ff;padding:16px;border-radius:12px;color:#6b21a8;font-weight:600">📅 Follow-up: {follow_up_date}</div>'}
<div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0">
<p style="color:#64748b;font-size:13px;margin-bottom:4px">Digitally signed by</p>
<div style="font-size:22px;font-weight:800;color:#1d4ed8;font-style:italic">Dr. {doctor_name}</div>
<p style="color:#94a3b8;font-size:12px;margin-top:16px">Generated by VitalSync AI Healthcare Platform</p></div>
</div></div></body></html>"""
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(GMAIL_USER, GMAIL_PASSWORD)
            s.sendmail(GMAIL_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email error: {e}"); return False

@app.post("/auth/signup")
def signup(data: UserSignup, db: Session = Depends(get_db)):
    if db.query(Patient).filter(Patient.email == data.email).first() or \
       db.query(Doctor).filter(Doctor.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    hashed = hash_password(data.password)
    if data.role == "patient":
        u = Patient(pid=str(uuid.uuid4()), name=data.name, email=data.email,
                    phone=data.phone or "", age=data.age or 0,
                    medical_history=data.medical_history or "", role="patient", password=hashed)
        db.add(u); db.commit(); db.refresh(u)
        return {"id": u.pid, "name": u.name, "email": u.email, "role": u.role,
                "phone": u.phone, "age": u.age}
    elif data.role == "doctor":
        d = Doctor(did=str(uuid.uuid4()), name=data.name, email=data.email,
                   specialization=data.specialization or "General Physician",
                   role="doctor", password=hashed)
        db.add(d); db.commit(); db.refresh(d)
        return {"id": d.did, "name": d.name, "email": d.email,
                "role": d.role, "specialization": d.specialization}
    raise HTTPException(status_code=400, detail="Role must be patient or doctor")

@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    u = db.query(Patient).filter(Patient.email == data.email).first()
    if u and verify_password(data.password, u.password):
        return {"id": u.pid, "name": u.name, "email": u.email, "role": u.role,
                "phone": u.phone, "age": u.age, "medical_history": u.medical_history}
    d = db.query(Doctor).filter(Doctor.email == data.email).first()
    if d and verify_password(data.password, d.password):
        return {"id": d.did, "name": d.name, "email": d.email,
                "role": d.role, "specialization": d.specialization}
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/doctors")
def get_doctors(db: Session = Depends(get_db)):
    docs = db.query(Doctor).all()
    if docs:
        return [{"id": d.did, "name": d.name, "specialty": d.specialization,
                 "availability": "Available", "rating": 4.8} for d in docs]
    return [
        {"id": "doc1", "name": "Dr. Priya Sharma",  "specialty": "General Physician", "availability": "Today 10AM–2PM",    "rating": 4.8},
        {"id": "doc2", "name": "Dr. Rajesh Patel",  "specialty": "Cardiologist",      "availability": "Today 2PM–6PM",     "rating": 4.9},
        {"id": "doc3", "name": "Dr. Anjali Mehta",  "specialty": "Pediatrician",      "availability": "Tomorrow 11AM–4PM", "rating": 4.7},
        {"id": "doc4", "name": "Dr. Suresh Kumar",  "specialty": "Neurologist",       "availability": "Today 11AM–3PM",    "rating": 4.6},
        {"id": "doc5", "name": "Dr. Neha Gupta",    "specialty": "Dermatologist",     "availability": "Tomorrow 9AM–1PM",  "rating": 4.8},
    ]

@app.get("/appointments")
def get_all_appointments(db: Session = Depends(get_db)):
    apts = db.query(Appointment).all()
    result = []
    for a in apts:
        patient = db.query(Patient).filter(Patient.pid == a.patient_id).first()
        doctor  = db.query(Doctor).filter(Doctor.did == a.doctor_id).first()
        result.append({
            "id": a.id,
            "patient_id":       patient.name  if patient else a.patient_id,
            "patient_email":    patient.email if patient else "",
            "patient_age":      str(patient.age) if patient else "",
            "doctor_id":        doctor.name   if doctor  else a.doctor_id,
            "doctor_raw_id":    a.doctor_id,
            "date":             f"{a.appointment_date}T{a.appointment_time}:00",
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
            "status":           a.status,
            "risk_level":       a.risk_level or "low",
            "summary":          a.summary or "",
        })
    return result

@app.get("/appointments/slots")
def get_booked_slots(doctor_id: str, date: str, db: Session = Depends(get_db)):
    return [a.appointment_time for a in db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id, Appointment.appointment_date == date).all()]

@app.post("/appointments")
async def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    if db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.appointment_time == data.appointment_time).first():
        raise HTTPException(status_code=409, detail="Slot already booked")
    risk = ml_risk_score(data.summary or "") if data.summary else (data.risk_level or "low")
    apt  = Appointment(id=str(uuid.uuid4()), patient_id=data.patient_id,
                       doctor_id=data.doctor_id, appointment_date=data.appointment_date,
                       appointment_time=data.appointment_time, summary=data.summary,
                       risk_level=risk, status="booked")
    db.add(apt); db.commit(); db.refresh(apt)
    await manager.broadcast({"type": "slot_booked", "doctor_id": data.doctor_id,
                              "date": data.appointment_date, "time": data.appointment_time})
    return {"id": apt.id, "patient_id": apt.patient_id, "doctor_id": apt.doctor_id,
            "date": f"{apt.appointment_date}T{apt.appointment_time}:00",
            "appointment_date": apt.appointment_date, "appointment_time": apt.appointment_time,
            "status": apt.status, "risk_level": apt.risk_level, "summary": apt.summary}

@app.get("/doctor/{doctor_id}/appointments")
def doctor_appointments(doctor_id: str, db: Session = Depends(get_db)):
    apts = db.query(Appointment).filter(Appointment.doctor_id == doctor_id).all()
    result = []
    for a in apts:
        p = db.query(Patient).filter(Patient.pid == a.patient_id).first()
        result.append({"id": a.id, "patient_id": p.name if p else a.patient_id,
                        "doctor_id": a.doctor_id,
                        "date": f"{a.appointment_date}T{a.appointment_time}:00",
                        "status": a.status, "risk_level": a.risk_level or "low",
                        "summary": a.summary or ""})
    return result

@app.post("/ai/analyze")
async def analyze(data: dict):
    msg = data.get("message", "")
    return {"response": f"Symptoms: {msg}. See recommended doctor.",
            "risk_level": ml_risk_score(msg), "recommended_doctor": recommend_doctor(msg)}

@app.post("/triage")
async def triage(data: dict):
    symptoms = data.get("symptoms", "")
    return {"summary": f"Patient reports: {symptoms}",
            "risk_level": ml_risk_score(symptoms), "recommended_doctor": recommend_doctor(symptoms)}

@app.post("/ai/doctor-assist")
async def doctor_assist(data: dict):
    msg = data.get("message", "").lower()
    
    suggestions = []
    if any(w in msg for w in ["fever", "infection", "temperature", "chills"]):
        suggestions.append("Consider prescribing broad-spectrum antibiotics and antipyretics. Advise rest and hydration. Monitor temperature.")
    if any(w in msg for w in ["chest", "heart", "cardiac", "bp", "palpitations"]):
        suggestions.append("Urgent ECG and cardiac enzymes check recommended. Consider prescribing statins or beta-blockers if history suggests. Avoid NSAIDs.")
    if any(w in msg for w in ["cough", "breathing", "lung", "asthma", "wheezing"]):
        suggestions.append("Chest X-Ray suggested. Consider bronchodilators (e.g., Albuterol) or inhaled corticosteroids. Recommend avoiding allergens/pollutants.")
    if any(w in msg for w in ["pain", "ache", "sore"]):
        suggestions.append("Evaluate pain score (1-10). Non-opioid analgesics (Paracetamol/Ibuprofen) recommended as first line. Prescribe GI protectants if prolonged.")
    if any(w in msg for w in ["stomach", "vomit", "nausea", "bowel", "diarrhea"]):
        suggestions.append("Suggest oral rehydration therapy (ORS). Prescribe antiemetics (e.g., Ondansetron) if severe. Rule out acute appendicitis.")
    
    if not suggestions:
        if "summarize" in msg or "summary" in msg:
            suggestions.append("Patient presents with non-specific symptoms. Thorough physical examination required. Review recent vitals and past medical history.")
        elif "drug" in msg or "interaction" in msg:
            suggestions.append("No immediate adverse interactions flagged. Always cross-check patient allergies before prescribing new medication.")
        else:
            suggestions.append("Monitor patient condition closely. Treat symptoms supportively. Consider follow-up in 3-5 days. If symptoms worsen, advise immediate ER visit.")
        
    response = "🤖 **Clinical Assistant Suggestions**\n\n" + "\n".join(f"• {s}" for s in suggestions)
    
    return {
        "response": response,
        "risk_level": ml_risk_score(msg),
        "recommended_doctor": recommend_doctor(msg)
    }

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    apts = db.query(Appointment).all()
    return {"total_appointments": len(apts),
            "total_patients":     db.query(Patient).count(),
            "total_doctors":      db.query(Doctor).count(),
            "high_risk":   sum(1 for a in apts if a.risk_level == "high"),
            "medium_risk": sum(1 for a in apts if a.risk_level == "medium"),
            "low_risk":    sum(1 for a in apts if a.risk_level == "low")}

@app.post("/send-prescription")
def send_prescription(data: PrescriptionCreate, db: Session = Depends(get_db)):
    pr = Prescription(patient_pid=data.patient_pid or data.patient_name,
                      doctor_did=data.doctor_did or data.doctor_name,
                      appointment_id=data.appointment_id, diagnosis=data.diagnosis,
                      medicines=data.medicines, notes=data.notes,
                      follow_up_date=data.follow_up_date)
    db.add(pr); db.commit(); db.refresh(pr)
    email_sent = False
    if data.patient_email:
        email_sent = send_prescription_email(
            to_email=data.patient_email,
            patient_name=data.patient_name or data.patient_pid or "Patient",
            patient_age=data.patient_age or "N/A",
            doctor_name=data.doctor_name or data.doctor_did or "Doctor",
            diagnosis=data.diagnosis, medicines=data.medicines,
            notes=data.notes or "", follow_up_date=data.follow_up_date or "")
    return {"message": "Prescription saved", "email_sent": email_sent, "id": pr.id}

class ConnectionManager:
    def __init__(self): self.active_connections: List[WebSocket] = []
    async def connect(self, ws: WebSocket):
        await ws.accept(); self.active_connections.append(ws)
    def disconnect(self, ws: WebSocket):
        if ws in self.active_connections: self.active_connections.remove(ws)
    async def broadcast(self, msg: dict):
        for c in self.active_connections:
            try: await c.send_json(msg)
            except: pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True: await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)