# AI-Powered Voice-Based Healthcare Appointment and Consultation System

## Overview

An AI-powered healthcare platform that enables users to book doctor appointments, access healthcare services, and interact with a voice-based medical assistant. The system combines a modern web interface with AI-driven voice interaction to improve accessibility and user experience.

## Features

### Patient Features

* User registration and login
* Book doctor appointments
* Manage appointments
* Voice-based healthcare assistance
* Symptom-based health guidance
* Easy-to-use dashboard

### Doctor Features

* Doctor dashboard
* Appointment management
* Patient information access
* Consultation management

### Admin Features

* Admin dashboard
* User management
* Doctor management
* System monitoring

### AI Voice Assistant

* Voice interaction
* Symptom analysis
* Healthcare guidance
* AI-powered responses using Groq API

## Technology Stack

### Frontend

* React.js
* JavaScript
* CSS

### Backend

* Python
* Flask

### AI Module

* Groq API
* Machine Learning datasets
* Voice processing

## Project Structure

```text
Ai-powered-voice-based-healthcare-appointment-and-consultation-system/
│
├── backend/
├── frontend/
├── voice-health-assistant/
├── README.md
└── requirements files
```

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/soham-5656/Ai-powered-voice-based-healthcare-appointment-and-consultation-system.git
cd Ai-powered-voice-based-healthcare-appointment-and-consultation-system
```

### 2. Backend Setup

```bash
pip install -r backend/requirements.txt
```

### 3. Voice Assistant Setup

```bash
pip install -r voice-health-assistant/requirements.txt
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file and add:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Windows PowerShell

```powershell
$env:GROQ_API_KEY="your_groq_api_key_here"
```

## Running the Project

### Start Backend

```bash
python backend/main.py
```

### Start Voice Assistant

```bash
python voice-health-assistant/voice-health-assistant/app.py
```

### Start Frontend

```bash
cd frontend
npm start
```

## Future Enhancements

* Video consultations
* Prescription management
* Medical report uploads
* Real-time chat support
* Mobile application
* Health analytics dashboard

## Authors

Soham Dawale

## License

This project is developed for educational, research, and hackathon purposes.

