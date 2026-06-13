// frontend/src/pages/DoctorDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import {
  Clock, AlertTriangle, CheckCircle, Activity,
  Users, Calendar, Bell, MessageSquare, Loader2,
  RefreshCw, X, Send, Plus, Trash2, Type,
  ChevronRight, ArrowLeft, Bot, Sparkles, ChevronDown
} from 'lucide-react';

const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) { setCount(0); return; }
    const totalDuration = 800;
    const incrementTime = Math.max(20, totalDuration / end);
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalDuration / incrementTime));
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

const DoctorDashboard = () => {
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [refreshing, setRefreshing]     = useState(false);

  const [showConsult, setShowConsult]   = useState(false);
  const [selectedApt, setSelectedApt]   = useState(null);
  const [step, setStep]                 = useState(1);

  // AI Panel
  const [showAIPanel, setShowAIPanel]   = useState(false);
  const [aiMessages, setAiMessages]     = useState([{ role: 'ai', content: 'Hello Doctor! I am your clinical AI assistant. How can I help you with your patients today?' }]);
  const [aiInput, setAiInput]           = useState('');
  const [isAiLoading, setIsAiLoading]   = useState(false);
  const aiChatRef                       = useRef(null);

  // Patient Quick View
  const [hoveredPatient, setHoveredPatient] = useState(null);
  const hoverTimeout                        = useRef(null);

  // Whiteboard
  const canvasRef                       = useRef(null);
  const [texts, setTexts]               = useState([]);
  const [textInput, setTextInput]       = useState('');
  const [textColor, setTextColor]       = useState('#1e293b');
  const [fontSize, setFontSize]         = useState(18);
  const [addingText, setAddingText]     = useState(false);
  const [pendingPos, setPendingPos]     = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [dragging, setDragging]         = useState(null);
  const [dragOffset, setDragOffset]     = useState({ x: 0, y: 0 });

  // Prescription
  const [sending, setSending]           = useState(false);
  const [sendSuccess, setSendSuccess]   = useState(false);
  const [rxForm, setRxForm]             = useState({
    patient_email: '', patient_age: '', diagnosis: '',
    notes: '', follow_up_date: '',
    doctor_signature: localStorage.getItem('userName') || '',
    medicines: [{ name: '', dosage: '', duration: '' }]
  });

  const doctorName = localStorage.getItem('userName') || 'Doctor';

  // ── Fetch appointments ──
  const fetchAppointments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res  = await fetch('http://127.0.0.1:8000/appointments');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const riskOrder = { high: 0, medium: 1, low: 2 };
      setAppointments([...data].sort((a, b) =>
        (riskOrder[a.risk_level] ?? 1) - (riskOrder[b.risk_level] ?? 1)
      ));
      setError(null);
      if (isRefresh) toast('success', 'Refreshed', 'Appointments list updated.');
    } catch { 
      setError('Could not load appointments. Is the backend running?'); 
      if (isRefresh) toast('error', 'Refresh Failed', 'Could not load appointments.');
    }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);

  useEffect(() => {
    if (aiChatRef.current) aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
  }, [aiMessages]);

  // ── AI Assistant Logic ──
  const handleAskAI = async (promptText) => {
    const text = typeof promptText === 'string' ? promptText : aiInput;
    if (!text.trim()) return;
    
    if (typeof promptText !== 'string') setAiInput('');
    
    setAiMessages(prev => [...prev, { role: 'doctor', content: text }]);
    setIsAiLoading(true);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/ai/doctor-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      toast('error', 'AI Assistant Error', 'Failed to connect to AI server.');
      setAiMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am currently unavailable. Please check the backend connection.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Draw canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    texts.forEach((t, i) => {
      ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px Inter, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.content, t.x, t.y);

      if (selectedText === i) {
        const w = ctx.measureText(t.content).width;
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(t.x - 4, t.y - t.size, w + 8, t.size + 8);
        ctx.setLineDash([]);
      }
    });
  }, [texts, selectedText]);

  const handleCanvasClick = (e) => {
    if (!addingText) {
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      const rect   = canvas.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;

      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px Inter, sans-serif`;
        const w  = ctx.measureText(t.content).width;
        if (mx >= t.x - 4 && mx <= t.x + w + 4 && my >= t.y - t.size && my <= t.y + 8) {
          setSelectedText(i); return;
        }
      }
      setSelectedText(null);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    setPendingPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTextInput('');
  };

  const placeText = () => {
    if (!textInput.trim() || !pendingPos) return;
    setTexts(prev => [...prev, {
      content: textInput.trim(),
      x: pendingPos.x, y: pendingPos.y,
      color: textColor, size: fontSize, bold: false
    }]);
    setTextInput('');
    setPendingPos(null);
    setAddingText(false);
  };

  const handleMouseDown = (e) => {
    if (addingText) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;

    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px Inter, sans-serif`;
      const w  = ctx.measureText(t.content).width;
      if (mx >= t.x - 4 && mx <= t.x + w + 4 && my >= t.y - t.size && my <= t.y + 8) {
        setDragging(i);
        setDragOffset({ x: mx - t.x, y: my - t.y });
        setSelectedText(i);
        return;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (dragging === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    setTexts(prev => prev.map((t, i) =>
      i === dragging ? { ...t, x: mx - dragOffset.x, y: my - dragOffset.y } : t
    ));
  };

  const handleMouseUp   = () => setDragging(null);
  const deleteSelected  = () => {
    if (selectedText === null) return;
    setTexts(prev => prev.filter((_, i) => i !== selectedText));
    setSelectedText(null);
  };
  const clearCanvas     = () => { setTexts([]); setSelectedText(null); };

  // ── Open consultation ──
  const openConsult = (apt) => {
    setSelectedApt(apt);
    setStep(1);
    setTexts([]);
    setSelectedText(null);
    setAddingText(false);
    setPendingPos(null);
    
    // Auto-fill patient details
    setRxForm({
      patient_email: apt.patient_email || '', 
      patient_age: apt.patient_age || '',
      diagnosis: apt.summary || '', notes: '',
      follow_up_date: '',
      doctor_signature: doctorName,
      medicines: [{ name: '', dosage: '', duration: '' }]
    });
    setSendSuccess(false);
    setShowConsult(true);
  };

  const addMedicine    = () => setRxForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dosage: '', duration: '' }] }));
  const removeMedicine = (i) => setRxForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
  const updateMedicine = (i, field, val) =>
    setRxForm(f => ({ ...f, medicines: f.medicines.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));

  const askAIPrescriptionSuggest = () => {
    if (!selectedApt?.summary) {
      toast('warning', 'No Triage Data', 'Patient has no triage summary for AI to analyze.');
      return;
    }
    
    const suggestedDiagnosis = `As per AI Triage: ${selectedApt.summary.split('\n')[0]}`;
    setRxForm(f => ({ ...f, diagnosis: suggestedDiagnosis, notes: 'Follow up if symptoms persist or worsen.' }));
    toast('info', 'AI Suggestion Applied', 'Diagnosis and notes have been auto-filled.');
  };

  // ── Send prescription — email + save to DB ──
  const sendPrescription = async () => {
    setSending(true); 
    const medicinesText = rxForm.medicines
      .filter(m => m.name.trim())
      .map((m, i) => `${i + 1}. ${m.name} — ${m.dosage} — ${m.duration}`)
      .join('\n');

    try {
      const res = await fetch('http://127.0.0.1:8000/send-prescription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name:      selectedApt.patient_id,
          patient_age:       rxForm.patient_age,
          patient_email:     rxForm.patient_email,
          diagnosis:         rxForm.diagnosis,
          medicines:         medicinesText,
          notes:             rxForm.notes,
          follow_up_date:    rxForm.follow_up_date,
          doctor_name:       doctorName,
          doctor_signature:  rxForm.doctor_signature,
          appointment_id:    selectedApt.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send');
      setSendSuccess(true);
      toast('success', 'Prescription Sent!', `Delivered securely to ${rxForm.patient_email}`);
      setTimeout(() => { setShowConsult(false); setSendSuccess(false); }, 2500);
    } catch (err) { 
      toast('error', 'Failed to Send Prescription', err.message);
    }
    finally { setSending(false); }
  };

  const riskBadge = (l) =>
    l === 'high'   ? 'bg-red-100 text-red-700 border border-red-200' :
    l === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                     'bg-green-100 text-green-700 border border-green-200';

  const riskRow = (l) =>
    l === 'high'   ? 'bg-red-50/60 hover:bg-red-50' :
    l === 'medium' ? 'bg-yellow-50/40 hover:bg-yellow-50' :
                     'hover:bg-slate-50/50';

  const fmt = (d, type) => {
    try {
      return type === 'time'
        ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const handleRowHover = (e, apt) => {
    const x = e.clientX;
    const y = e.clientY;
    hoverTimeout.current = setTimeout(() => {
      setHoveredPatient({ apt, x, y });
    }, 400);
  };

  const handleRowLeave = () => {
    clearTimeout(hoverTimeout.current);
    setHoveredPatient(null);
  };

  const highRisk = appointments.filter(a => a.risk_level === 'high').length;
  const medRisk  = appointments.filter(a => a.risk_level === 'medium').length;
  const lowRisk  = appointments.filter(a => a.risk_level === 'low').length;
  const total    = appointments.length;
  const inputCls = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm";
  const COLORS   = ['#1e293b','#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899'];

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900 relative overflow-hidden">
      <Sidebar role="doctor" />

      <div className="ml-64 flex-1 flex flex-col h-screen">
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm z-10 sticky top-0">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="animate-fade-right">
              <h2 className="text-3xl font-bold text-slate-800">Welcome, Dr. {doctorName} 👋</h2>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                {total} patient{total !== 1 ? 's' : ''} scheduled today
                {highRisk > 0 && <span className="text-red-600 font-semibold flex items-center gap-1 animate-pulse"><AlertTriangle size={14}/> {highRisk} high risk</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchAppointments(true)}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 transition shadow-sm">
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button className={`relative p-3 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 transition shadow-sm ${highRisk > 0 ? 'animate-pulse-glow' : ''}`}>
                <Bell size={20} />
                {highRisk > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white" />}
              </button>
              <button onClick={() => setShowAIPanel(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all">
                <Bot size={18} className="animate-bounce-slow" /> Ask AI
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Patients', value: total,    Icon: Users,         bg: 'from-blue-100 to-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
                { label: 'High Risk',      value: highRisk, Icon: AlertTriangle, bg: 'from-red-100 to-red-50',     text: 'text-red-600',    border: 'border-red-200' },
                { label: 'Medium Risk',    value: medRisk,  Icon: Activity,      bg: 'from-yellow-100 to-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
                { label: 'Low Risk',       value: lowRisk,  Icon: CheckCircle,   bg: 'from-green-100 to-green-50',  text: 'text-green-600',  border: 'border-green-200' },
              ].map(({ label, value, Icon, bg, text, border }, i) => (
                <div key={label} className={`glass-card rounded-[2rem] p-6 border ${border} flex items-center gap-4 animate-fade-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${bg} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <Icon className={text} size={28} />
                  </div>
                  <div>
                    <p className={`text-3xl font-black ${text}`}><AnimatedCounter value={value} /></p>
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden animate-fade-up delay-300">
              <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-600" size={22} />
                  <h3 className="font-bold text-xl">Today's Appointments</h3>
                </div>
                {highRisk > 0 && (
                  <div className="flex items-center gap-2 bg-red-50/80 backdrop-blur text-red-700 px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 shadow-sm animate-pulse-glow">
                    <AlertTriangle size={16} />
                    {highRisk} high-risk patient{highRisk > 1 ? 's' : ''} need attention
                  </div>
                )}
              </div>
              <div className="p-6 bg-white/30 backdrop-blur-sm min-h-[300px]">
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="animate-spin text-blue-600" size={36} />
                    <span className="ml-3 text-slate-500 font-semibold">Loading appointments…</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <p className="text-red-500 font-bold bg-red-50 inline-block px-4 py-2 rounded-xl border border-red-100">{error}</p>
                    <button onClick={() => fetchAppointments()} className="block mx-auto mt-4 text-blue-600 font-bold hover:underline">Try again</button>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-bold">No appointments today</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200">
                          <th className="pb-4 pl-4 font-bold">Patient</th>
                          <th className="pb-4 font-bold">Time</th>
                          <th className="pb-4 font-bold">Date</th>
                          <th className="pb-4 font-bold">AI Summary</th>
                          <th className="pb-4 font-bold">Risk</th>
                          <th className="pb-4 font-bold text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {appointments.map((apt, i) => (
                          <tr key={apt.id} 
                              className={`transition-all duration-300 ${riskRow(apt.risk_level)} animate-row-in`}
                              style={{ animationDelay: `${i * 0.05}s` }}
                              onMouseEnter={(e) => handleRowHover(e, apt)}
                              onMouseLeave={handleRowLeave}
                          >
                            <td className="py-5 pl-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${
                                  apt.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                                  apt.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{apt.patient_id?.charAt(0).toUpperCase()}</div>
                                <div>
                                  <p className="font-bold text-slate-800">{apt.patient_id}</p>
                                  <p className="text-xs font-semibold text-slate-400 capitalize">{apt.status}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 text-blue-600 font-black text-sm">{fmt(apt.date, 'time')}</td>
                            <td className="py-5 text-slate-500 font-semibold text-sm">{fmt(apt.date, 'date')}</td>
                            <td className="py-5 max-w-xs">
                              <p className={`text-sm leading-relaxed ${apt.risk_level === 'high' ? 'text-red-700 font-bold' : 'text-slate-600 font-medium'}`}>
                                {apt.summary ? apt.summary.split('\n')[0] : '—'}
                              </p>
                            </td>
                            <td className="py-5">
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize shadow-sm ${riskBadge(apt.risk_level)}`}>
                                {apt.risk_level}
                              </span>
                            </td>
                            <td className="py-5 text-right pr-4">
                              <button onClick={() => openConsult(apt)}
                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 hover:shadow-lg transition-all active:scale-95">
                                Start Consult
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── PATIENT QUICK-VIEW POPOVER ── */}
      {hoveredPatient && (
        <div className="fixed z-40 animate-popover bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-5 w-80 pointer-events-none"
          style={{ left: Math.min(hoveredPatient.x + 15, window.innerWidth - 340), top: Math.min(hoveredPatient.y + 15, window.innerHeight - 200) }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-black text-slate-800 text-lg">{hoveredPatient.apt.patient_id}</h4>
            <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${riskBadge(hoveredPatient.apt.risk_level)}`}>
              {hoveredPatient.apt.risk_level} risk
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-3 space-y-1">
            <p>📧 {hoveredPatient.apt.patient_email || 'No email provided'}</p>
            <p>🎂 {hoveredPatient.apt.patient_age ? `${hoveredPatient.apt.patient_age} years old` : 'Age N/A'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Triage Summary</p>
            <p className="text-xs text-slate-700 font-medium line-clamp-4 leading-relaxed">
              {hoveredPatient.apt.summary || 'No summary available.'}
            </p>
          </div>
        </div>
      )}

      {/* ── AI ASSISTANT SLIDING PANEL ── */}
      {showAIPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm animate-backdrop" onClick={() => setShowAIPanel(false)} />
          <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col relative z-10 animate-slide-in-right border-l border-slate-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Clinical AI Assistant</h3>
                  <p className="text-blue-100 text-xs">Powered by VitalSync</p>
                </div>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="text-white/70 hover:text-white transition p-2 hover:bg-white/10 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50" ref={aiChatRef}>
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'doctor' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm font-medium'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <span className="text-sm font-semibold text-slate-500">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {["Summarize patient", "Suggest treatment", "Drug interactions", "Differential diagnosis"].map(prompt => (
                  <button key={prompt} onClick={() => handleAskAI(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition">
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleAskAI(); }} className="flex gap-2">
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask a clinical question..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 ring-blue-500 outline-none" />
                <button type="submit" disabled={isAiLoading || !aiInput.trim()}
                  className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CONSULTATION MODAL ══════════════ */}
      {showConsult && selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-backdrop">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-slide-in-right">

            <div className="px-8 pt-7 pb-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {step === 1 ? '🖊️ Consultation Whiteboard' : '💊 Write Prescription'}
                </h2>
                <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-2">
                  Patient: <span className="font-bold text-blue-600">{selectedApt.patient_id}</span>
                  <span className="text-slate-300">•</span>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-lg shadow-sm ${riskBadge(selectedApt.risk_level)}`}>
                    {selectedApt.risk_level} risk
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-green-500 text-white'}`}>
                    {step === 1 ? '1' : '✓'}
                  </div>
                  <span className={`text-xs font-bold ${step === 1 ? 'text-slate-800' : 'text-slate-500'}`}>Whiteboard</span>
                  <ChevronRight size={14} className="text-slate-300" />
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${step === 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>2</div>
                  <span className={`text-xs font-bold ${step === 2 ? 'text-slate-800' : 'text-slate-500'}`}>Prescription</span>
                </div>
                <button onClick={() => setShowConsult(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600">
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* ── STEP 1: WHITEBOARD ── */}
            {step === 1 && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4 bg-white shrink-0 flex-wrap">
                  <button
                    onClick={() => { setAddingText(!addingText); setPendingPos(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                      addingText ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <Type size={16} />
                    {addingText ? 'Click on canvas to place' : 'Add Text'}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">Size</span>
                    <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                      className="border border-slate-200 font-semibold rounded-lg px-2 py-1.5 text-sm bg-slate-50 outline-none focus:ring-2 ring-blue-400">
                      {[12, 14, 16, 18, 20, 24, 28, 32, 40].map(s => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">Color</span>
                    <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setTextColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${textColor === c ? 'border-white ring-2 ring-blue-500 scale-110' : 'border-transparent hover:scale-110'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1" />

                  {selectedText !== null && (
                    <button onClick={deleteSelected}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition">
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                  <button onClick={clearCanvas}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:border-red-300 hover:text-red-500 transition">
                    Clear All
                  </button>
                </div>

                <div className="flex-1 overflow-hidden relative bg-slate-100 p-4 flex justify-center items-center">
                  {pendingPos && (
                    <div className="absolute z-20 bg-white shadow-2xl border border-blue-300 rounded-2xl p-3 flex gap-2 items-center animate-fade-in"
                      style={{ left: pendingPos.x, top: pendingPos.y - 60 }}>
                      <input autoFocus value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') placeText(); if (e.key === 'Escape') { setPendingPos(null); setAddingText(false); } }}
                        placeholder="Type text..."
                        className="border border-slate-200 rounded-xl px-3 py-2 font-medium text-sm outline-none focus:ring-2 ring-blue-500 w-48" />
                      <button onClick={placeText}
                        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md">Place</button>
                      <button onClick={() => { setPendingPos(null); setAddingText(false); }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><X size={16} /></button>
                    </div>
                  )}

                  <canvas ref={canvasRef} width={850} height={440}
                    onClick={handleCanvasClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className={`rounded-2xl border border-slate-200 shadow-sm bg-white ${
                      addingText ? 'cursor-text' : dragging !== null ? 'cursor-grabbing' : 'cursor-default'
                    }`}
                  />

                  {texts.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center text-slate-400 bg-white/60 px-8 py-6 rounded-3xl backdrop-blur-sm border border-white">
                        <Type size={40} className="mx-auto mb-3 opacity-40 text-blue-500" />
                        <p className="text-lg font-bold text-slate-600">Canvas is empty</p>
                        <p className="text-sm mt-1 font-medium">Click "Add Text" to start taking notes</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <p className="text-sm font-semibold text-slate-400">
                    {texts.length} item{texts.length !== 1 ? 's' : ''} on canvas
                  </p>
                  <button onClick={() => setStep(2)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all">
                    Next: Write Prescription <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: PRESCRIPTION ── */}
            {step === 2 && (
              <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/30">
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="font-black text-lg mb-5 flex items-center gap-2 text-slate-800"><Users size={18} className="text-blue-500"/> Patient Details</h3>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Patient Email *</label>
                          <input type="email" placeholder="patient@email.com"
                            value={rxForm.patient_email}
                            onChange={e => setRxForm(f => ({ ...f, patient_email: e.target.value }))}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Patient Age *</label>
                          <input type="number" placeholder="e.g. 34"
                            value={rxForm.patient_age}
                            onChange={e => setRxForm(f => ({ ...f, patient_age: e.target.value }))}
                            className={inputCls} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Activity size={100}/></div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-lg flex items-center gap-2 text-slate-800"><Activity size={18} className="text-blue-500"/> Clinical Diagnosis</h3>
                        <button onClick={askAIPrescriptionSuggest} 
                          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">
                          <Sparkles size={14} /> Auto-fill from Triage
                        </button>
                      </div>
                      <textarea rows={2} placeholder="Primary diagnosis and symptoms..."
                        value={rxForm.diagnosis}
                        onChange={e => setRxForm(f => ({ ...f, diagnosis: e.target.value }))}
                        className={`${inputCls} resize-none font-medium text-slate-700`} />
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-black text-lg flex items-center gap-2 text-slate-800"><Activity size={18} className="text-blue-500"/> Medications</h3>
                        <button onClick={addMedicine} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                          <Plus size={14} strokeWidth={3} /> Add Medicine
                        </button>
                      </div>
                      <div className="space-y-3">
                        {rxForm.medicines.map((med, i) => (
                          <div key={i} className="flex gap-3 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100 animate-fade-in">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs shrink-0 ml-2">{i+1}</div>
                            <input placeholder="Medicine name (e.g., Paracetamol)" value={med.name}
                              onChange={e => updateMedicine(i, 'name', e.target.value)}
                              className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-semibold text-slate-700" />
                            <input placeholder="Dosage (e.g., 500mg)" value={med.dosage}
                              onChange={e => updateMedicine(i, 'dosage', e.target.value)}
                              className="w-32 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-medium" />
                            <input placeholder="Duration (e.g., 5 days)" value={med.duration}
                              onChange={e => updateMedicine(i, 'duration', e.target.value)}
                              className="w-32 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all text-sm font-medium" />
                            {rxForm.medicines.length > 1 && (
                              <button onClick={() => removeMedicine(i)}
                                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0 mr-1">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-800"><MessageSquare size={18} className="text-blue-500"/> Additional Details</h3>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Doctor's Notes & Advice</label>
                          <textarea rows={3} placeholder="Dietary advice, rest required, precautions..."
                            value={rxForm.notes}
                            onChange={e => setRxForm(f => ({ ...f, notes: e.target.value }))}
                            className={`${inputCls} resize-none font-medium`} />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Follow-up Date *</label>
                            <input type="date" value={rxForm.follow_up_date}
                              onChange={e => setRxForm(f => ({ ...f, follow_up_date: e.target.value }))}
                              className={`${inputCls} font-bold text-slate-700`} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Doctor Signature *</label>
                            <input type="text" placeholder="Your full name"
                              value={rxForm.doctor_signature}
                              onChange={e => setRxForm(f => ({ ...f, doctor_signature: e.target.value }))}
                              className={`${inputCls} font-bold italic text-slate-700`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
                  <button onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 font-bold transition">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    onClick={sendPrescription}
                    disabled={sending || !rxForm.patient_email || !rxForm.patient_age || !rxForm.diagnosis || !rxForm.follow_up_date || !rxForm.doctor_signature}
                    className={`flex items-center gap-3 px-10 py-3.5 rounded-2xl font-black text-lg transition-all ${
                      sending ? 'bg-blue-400 cursor-not-allowed text-white' :
                      !rxForm.patient_email || !rxForm.patient_age || !rxForm.diagnosis || !rxForm.follow_up_date ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-200 hover:scale-[1.02]'
                    }`}
                  >
                    {sending
                      ? <><Loader2 size={20} className="animate-spin" /> Sending...</>
                      : <><Send size={20} /> Issue E-Prescription</>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;