from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import os

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# GROQ CLIENT  (replace key if needed)
# ─────────────────────────────────────────────
try:
    from groq import Groq
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    GROQ_AVAILABLE = True
except Exception:
    GROQ_AVAILABLE = False

# ─────────────────────────────────────────────
# CONVERSATION MEMORY  (in-memory, per user_id)
# ─────────────────────────────────────────────
conversation_state = {}

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def detect_severity(symptoms: str) -> str:
    s = symptoms.lower()
    if any(w in s for w in ["chest pain", "breathing difficulty", "fainting", "unconscious"]):
        return "HIGH"
    if any(w in s for w in ["fever", "vomiting", "persistent cough", "blood"]):
        return "MEDIUM"
    return "LOW"


def detect_emotion(text: str) -> str:
    try:
        from textblob import TextBlob
        polarity = TextBlob(text).sentiment.polarity
    except Exception:
        polarity = 0.0

    if polarity < -0.5:
        return "PANIC"
    if polarity < -0.2:
        return "ANXIOUS"
    if polarity < 0.3:
        return "CALM"
    return "RELAXED"


def recommend_doctor(symptoms: str) -> str:
    s = symptoms.lower()
    if "chest" in s:
        return "Cardiologist"
    if "cough" in s or "breathing" in s:
        return "Pulmonologist"
    if "stomach" in s or "vomiting" in s:
        return "Gastroenterologist"
    if "skin" in s or "rash" in s:
        return "Dermatologist"
    if "head" in s:
        return "Neurologist"
    return "General Physician"


def generate_triage_report(data: dict):
    symptoms    = data["symptoms"]
    duration    = data["duration"]
    progression = data["progression"]
    associated  = data["associated"]

    severity = detect_severity(symptoms)
    emotion  = detect_emotion(symptoms)
    doctor   = recommend_doctor(symptoms)

    if GROQ_AVAILABLE:
        prompt = f"""You are a medical triage assistant.
Generate a SHORT doctor-friendly summary (max 7 lines).
Do NOT repeat the patient's exact words — interpret them medically.

Patient Data:
Symptoms: {symptoms}
Duration: {duration}
Progression: {progression}
Associated symptoms: {associated}

Format your response EXACTLY like this:
PATIENT TRIAGE SUMMARY
Primary Symptoms: <interpreted>
Duration: {duration}
Progression: {progression}
Key Observations: <clinical note>
Possible Conditions: <2-3 differential diagnoses>
Recommended Doctor: {doctor}
Risk Level: {severity}
Patient Emotional State: {emotion}"""

        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}]
            )
            report = response.choices[0].message.content
        except Exception as e:
            report = (
                f"PATIENT TRIAGE SUMMARY\n"
                f"Primary Symptoms: {symptoms}\n"
                f"Duration: {duration}\n"
                f"Progression: {progression}\n"
                f"Associated: {associated}\n"
                f"Recommended Doctor: {doctor}\n"
                f"Risk Level: {severity}\n"
                f"Emotional State: {emotion}"
            )
    else:
        report = (
            f"PATIENT TRIAGE SUMMARY\n"
            f"Primary Symptoms: {symptoms}\n"
            f"Duration: {duration}\n"
            f"Progression: {progression}\n"
            f"Associated: {associated}\n"
            f"Recommended Doctor: {doctor}\n"
            f"Risk Level: {severity}\n"
            f"Emotional State: {emotion}"
        )

    return report, severity, emotion


# ─────────────────────────────────────────────
# TRIAGE CONVERSATION ENGINE
# ─────────────────────────────────────────────
def triage(user_id: str, message: str):
    if not GROQ_AVAILABLE:
        # Fallback if Groq API key is invalid/missing
        if user_id not in conversation_state:
            conversation_state[user_id] = {"step": "symptoms", "symptoms": "", "duration": "", "progression": "", "associated": ""}
            return "Please describe the symptoms you are experiencing.", None, None
        
        state = conversation_state[user_id]
        if state["step"] == "symptoms":
            state["symptoms"] = message; state["step"] = "duration"
            return "When did these symptoms start?", None, None
        elif state["step"] == "duration":
            state["duration"] = message; state["step"] = "progression"
            return "Are the symptoms improving, worsening, or staying the same?", None, None
        elif state["step"] == "progression":
            state["progression"] = message; state["step"] = "associated"
            return "Are you experiencing additional symptoms such as fever, dizziness, or breathing difficulty?", None, None
        elif state["step"] == "associated":
            state["associated"] = message
            report, risk, emotion = generate_triage_report(state)
            conversation_state.pop(user_id, None)
            return report, risk, emotion

    # --- GROQ CONVERSATIONAL LOGIC ---
    if user_id not in conversation_state:
        # Initialize conversation history
        conversation_state[user_id] = {
            "messages": [
                {"role": "system", "content": (
                    "You are a friendly and empathetic AI medical triage assistant. "
                    "Your job is to ask follow-up questions to understand the patient's symptoms, duration, and severity. "
                    "Ask ONE question at a time. Do not overwhelm the patient. "
                    "When you have gathered enough info (usually after 3-4 exchanges), generate a final report. "
                    "To generate the final report, your final message MUST start EXACTLY with 'PATIENT TRIAGE SUMMARY'. "
                    "Format the summary as:\n"
                    "PATIENT TRIAGE SUMMARY\n"
                    "Primary Symptoms: ...\n"
                    "Duration: ...\n"
                    "Progression: ...\n"
                    "Key Observations: ...\n"
                    "Possible Conditions: ...\n"
                )}
            ],
            "turn_count": 0
        }
    
    state = conversation_state[user_id]
    
    # Check if user asks to restart or start
    if message.lower() in ["start", "restart", "hello"]:
        if state["turn_count"] == 0:
            msg = "Hello! I am your AI Health Assistant. Please describe the symptoms you are experiencing today."
            state["messages"].append({"role": "assistant", "content": msg})
            return msg, None, None

    state["messages"].append({"role": "user", "content": message})
    state["turn_count"] += 1

    try:
        # Ask Groq to reply
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=state["messages"]
        )
        reply = response.choices[0].message.content
        state["messages"].append({"role": "assistant", "content": reply})

        # Check if Groq decided to output the summary
        if "PATIENT TRIAGE SUMMARY" in reply.upper():
            # Extract info to get risk/emotion/doctor
            all_text = " ".join([m["content"] for m in state["messages"] if m["role"] == "user"])
            risk = detect_severity(all_text)
            emotion = detect_emotion(all_text)
            doctor = recommend_doctor(all_text)
            
            # Format nicely
            final_reply = reply.strip()
            if "Recommended Doctor" not in final_reply:
                final_reply += f"\nRecommended Doctor: {doctor}"
            if "Risk Level" not in final_reply:
                final_reply += f"\nRisk Level: {risk}"
            if "Emotional State" not in final_reply:
                final_reply += f"\nEmotional State: {emotion}"

            conversation_state.pop(user_id, None)
            return final_reply, risk, emotion
        
        return reply, None, None

    except Exception as e:
        print("Groq API Error:", e)
        return "I'm having trouble connecting to my AI brain right now. Please try again.", None, None


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({"status": "VitalSync AI Server running"})


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data    = request.get_json()
        user_id = data.get("user_id", "default")
        message = data.get("message", "")

        if not message:
            return jsonify({"error": "message is required"}), 400

        # Emergency shortcut
        if "call ambulance" in message.lower():
            return jsonify({
                "response":       "🚨 Ambulance request detected. Please call 112 immediately.",
                "risk_level":     "HIGH",
                "emotion":        "PANIC",
                "force_ambulance": True,
            })

        response, risk, emotion = triage(user_id, message)

        return jsonify({
            "response":        response,
            "risk_level":      risk,
            "emotion":         emotion,
            "force_ambulance": False,
        })

    except Exception as e:
        print("Server Error:", e)
        traceback.print_exc()
        return jsonify({"error": "internal server error"}), 500


# ─────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)