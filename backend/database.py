from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

DATABASE_URL = "sqlite:///./healthcare.db"

engine       = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


class Patient(Base):
    __tablename__ = "patients"
    pid             = Column(String,  primary_key=True, index=True)
    name            = Column(String)
    email           = Column(String,  unique=True, index=True)
    password        = Column(String)       # sha256 hashed
    phone           = Column(String,  nullable=True)
    age             = Column(Integer, nullable=True)
    medical_history = Column(String,  nullable=True)
    role            = Column(String,  default="patient")


class Doctor(Base):
    __tablename__ = "doctors"
    did            = Column(String, primary_key=True, index=True)
    name           = Column(String)
    email          = Column(String, unique=True, index=True)
    password       = Column(String)        # sha256 hashed
    specialization = Column(String, nullable=True)
    role           = Column(String, default="doctor")


class Appointment(Base):
    __tablename__ = "appointments"
    id               = Column(String,   primary_key=True, index=True)
    patient_id       = Column(String)
    doctor_id        = Column(String)
    appointment_date = Column(String)    # "YYYY-MM-DD"
    appointment_time = Column(String)    # "HH:MM"
    status           = Column(String,   default="booked")
    risk_score       = Column(Float,    nullable=True)
    summary          = Column(String,   nullable=True)
    risk_level       = Column(String,   default="low")
    created_at       = Column(DateTime, default=datetime.utcnow)


class Prescription(Base):
    __tablename__ = "prescriptions"
    id             = Column(Integer, primary_key=True, index=True)
    patient_pid    = Column(String,  nullable=True)
    doctor_did     = Column(String,  nullable=True)
    appointment_id = Column(String,  nullable=True)
    diagnosis      = Column(String)
    medicines      = Column(String)
    notes          = Column(String,  nullable=True)
    follow_up_date = Column(String,  nullable=True)
    sent_at        = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Base.metadata.create_all(bind=engine)