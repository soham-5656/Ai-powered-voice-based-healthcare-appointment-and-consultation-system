// frontend/src/components/VoiceAssistant.jsx
// Full conversational voice triage connected to Flask AI server (port 5000)
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle, Loader2, RotateCcw, Send } from 'lucide-react';

const AI_URL = 'http://127.0.0.1:5000';

const RISK_STYLE = {
  HIGH:   { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    icon: AlertTriangle },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  LOW:    { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  icon: CheckCircle },
};

const Waveform = () => (
  <div className="flex items-end gap-1 h-8">
    {[1,2,3,4,5,6,7].map(i => (
      <div key={i} className="waveform-bar bg-white" style={{ animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

const VoiceAssistant = ({ patientName, onTriageComplete }) => {
  const [messages,    setMessages]    = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [textInput,   setTextInput]   = useState('');
  const [sessionId]                   = useState(() => `user_${Date.now()}`);
  const [triageResult, setTriageResult] = useState(null);
  const [started,     setStarted]     = useState(false);
  const recognitionRef = useRef(null);
  const chatRef        = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-IN'; utt.rate = 0.95; utt.pitch = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const addMessage = (role, text, extra = {}) => {
    setMessages(prev => [...prev, { role, text, ...extra, id: Date.now() + Math.random() }]);
  };

  const sendToAI = async (message) => {
    setIsLoading(true);
    addMessage('user', message);
    try {
      const res  = await fetch(`${AI_URL}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: sessionId, message }),
      });
      const data = await res.json();
      const reply     = data.response || "Sorry, I couldn't process that.";
      const riskLevel = data.risk_level;
      const emotion   = data.emotion;

      addMessage('ai', reply, { risk: riskLevel, emotion });
      speak(reply);

      // Triage complete — response contains "PATIENT TRIAGE SUMMARY"
      if (reply.includes('PATIENT TRIAGE SUMMARY') || riskLevel) {
        setTriageResult({ summary: reply, risk_level: (riskLevel || 'LOW').toLowerCase(), emotion });
        if (onTriageComplete) onTriageComplete({ summary: reply, risk_level: (riskLevel || 'LOW').toLowerCase() });
      }
    } catch {
      const err = 'AI server unavailable. Please ensure the voice AI server is running on port 5000.';
      addMessage('ai', err);
      speak(err);
    } finally { setIsLoading(false); }
  };

  const startSession = async () => {
    setStarted(true);
    setMessages([]);
    setTriageResult(null);
    await sendToAI('start');
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Use Chrome or Edge.'); return; }
    const r = new SR();
    r.lang = 'en-IN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTextInput(text);
      setIsListening(false);
      sendToAI(text);
    };
    r.onerror  = () => setIsListening(false);
    r.onend    = () => setIsListening(false);
    r.start();
    recognitionRef.current = r;
    setIsListening(true);
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput.trim();
    setTextInput('');
    sendToAI(msg);
  };

  const resetSession = () => {
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setMessages([]); setStarted(false); setTriageResult(null); setIsListening(false); setIsSpeaking(false);
  };

  if (!started) {
    return (
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2.5rem] p-10 text-white text-center shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
            <Mic size={38} />
          </div>
          <h3 className="text-2xl font-bold mb-3">AI Voice Health Assistant</h3>
          <p className="text-blue-100 mb-2 max-w-md mx-auto">
            Describe your symptoms naturally — by voice or typing. Our AI will ask follow-up questions and generate a doctor-ready triage report.
          </p>
          <p className="text-blue-200 text-sm mb-8">Powered by Groq LLaMA 3 · Speaks Hindi & English</p>
          <button onClick={startSession}
            className="bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all inline-flex items-center gap-3">
            <Mic size={22} /> Start Voice Triage
          </button>
          <p className="mt-4 text-blue-300 text-xs">Your responses generate an AI summary sent to your doctor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSpeaking ? 'animate-pulse-ring' : ''} bg-white/20`}>
            {isSpeaking ? <Volume2 size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
          </div>
          <div>
            <p className="text-white font-bold">AI Health Assistant</p>
            <p className="text-blue-200 text-xs">{isSpeaking ? 'Speaking…' : isListening ? 'Listening…' : isLoading ? 'Thinking…' : 'Ready'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSpeaking && <Waveform />}
          <button onClick={resetSession} className="p-2 hover:bg-white/15 rounded-xl text-white/70 hover:text-white transition">
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="h-72 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <Mic size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Session started. Listen to the AI and respond.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-sm px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
            }`}>
              {msg.text}
              {msg.risk && (
                <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                  msg.risk === 'HIGH' ? 'bg-red-100 text-red-700' :
                  msg.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>{msg.risk} RISK</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">AI is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Triage result */}
      {triageResult && (
        <div className={`mx-6 mb-4 p-5 rounded-2xl border-2 ${RISK_STYLE[triageResult.risk_level?.toUpperCase()] ? RISK_STYLE[triageResult.risk_level.toUpperCase()].bg : 'bg-blue-50'} ${RISK_STYLE[triageResult.risk_level?.toUpperCase()]?.border || 'border-blue-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-slate-800 text-sm">✅ Triage Complete</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${RISK_STYLE[triageResult.risk_level?.toUpperCase()]?.badge || 'bg-blue-100 text-blue-700'}`}>
              {(triageResult.risk_level || 'low').toUpperCase()} RISK
            </span>
          </div>
          <p className="text-xs text-slate-600">Your report has been generated. Use "Book with Summary" to include it in your appointment.</p>
        </div>
      )}

      {/* Input */}
      {!triageResult && (
        <div className="px-6 pb-6 pt-3 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendText} className="flex gap-3">
            <button type="button" onClick={toggleVoice} disabled={isLoading}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isListening ? 'animate-pulse-ring-red bg-red-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}>
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input value={textInput} onChange={e => setTextInput(e.target.value)}
              placeholder={isListening ? "🎤 Listening… (or type here)" : "Type your response or press mic…"}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 ring-blue-500 transition" />
            <button type="submit" disabled={!textInput.trim() || isLoading}
              className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-40">
              <Send size={18} />
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">Press 🎤 to speak, or type and press Send</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;