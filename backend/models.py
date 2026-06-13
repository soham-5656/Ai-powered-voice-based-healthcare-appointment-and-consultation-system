from pydantic import BaseModel
from typing import Optional


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    name:            str
    email:           str
    password:        str
    role:            str              # "patient" or "doctor"
    age:             Optional[int]   = None
    phone:           Optional[str]   = None
    medical_history: Optional[str]   = None   # patients only
    specialization:  Optional[str]   = None   # doctors only


class UserLogin(BaseModel):
    email:    str
    password: str


# ─── Appointments ─────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_id:       str
    doctor_id:        str
    appointment_date: str             # "YYYY-MM-DD"
    appointment_time: str             # "HH:MM"
    summary:          Optional[str]  = None
    risk_level:       Optional[str]  = "low"


# ─── Prescriptions ────────────────────────────────────────────────────────────

class PrescriptionCreate(BaseModel):
    patient_pid:      Optional[str] = None
    doctor_did:       Optional[str] = None
    appointment_id:   Optional[str] = None
    diagnosis:        str
    medicines:        str
    notes:            Optional[str] = None
    follow_up_date:   Optional[str] = None
    patient_name:     Optional[str] = None
    patient_age:      Optional[str] = None
    patient_email:    Optional[str] = None
    doctor_name:      Optional[str] = None
    doctor_signature: Optional[str] = None