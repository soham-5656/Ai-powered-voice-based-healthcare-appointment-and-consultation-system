// frontend/src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import {
  Bell, Search, Loader2, X, Calendar, Clock, CheckCircle,
  ChevronRight, AlertCircle, History, Stethoscope, Mic,
  Star, Activity, ArrowRight, User
} from 'lucide-react';

const ALL_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
];
const todayStr = () => new Date().toISOString().split('T')[0];

const riskBadge = l =>
  l === 'high'   ? 'bg-red-100 text-red-700' :
  l === 'medium' ? 'bg-yellow-100 text-yellow-700' :
  l === 'low'    ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600';

const statusBadge = s =>
  s === 'booked'    ? 'bg-blue-100 text-blue-700' :
  s === 'completed' ? 'bg-green-100 text-green-700' :
  s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600';

const SPEC_ICON = { Cardiologist:'❤️', Neurologist:'🧠', Pediatrician:'👶', Dermatologist:'🌿',
  Pulmonologist:'🫁', Gastroenterologist:'🔬', Orthopedic:'🦴', Psychiatrist:'💭',
  'ENT Specialist':'👂', 'General Physician':'🩺', Gynecologist:'🌸', Oncologist:'🔴' };

const PatientDashboard = () => {
  const [activeTab, setActiveTab]       = useState('book');
  const [search, setSearch]             = useState('');
  const [doctors, setDoctors]           = useState([]);
  const [loadingDocs, setLoadingDocs]   = useState(true);
  const [myApts, setMyApts]             = useState([]);
  const [loadingApts, setLoadingApts]   = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [selectedDoc, setSelectedDoc]   = useState(null);
  const [bookDate, setBookDate]         = useState('');
  const [bookSlot, setBookSlot]         = useState('');
  const [booking, setBooking]           = useState(false);
  const [bookSuccess, setBookSuccess]   = useState(false);
  const [bookError, setBookError]       = useState('');
  const [bookedSlots, setBookedSlots]   = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [triageSummary, setTriageSummary] = useState(null); // from voice AI

  const patientName = localStorage.getItem('userName') || 'Patient';
  const patientId   = (() => { try { return JSON.parse(localStorage.getItem('userProfile'))?.id || patientName; } catch { return patientName; } })();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/doctors');
        if (!res.ok) throw new Error();
        setDoctors(await res.json());
      } catch {
        setDoctors([
          { id:'doc1', name:'Dr. Priya Sharma',  specialty:'General Physician', availability:'Today 10AM–2PM',    rating:4.8 },
          { id:'doc2', name:'Dr. Rajesh Patel',  specialty:'Cardiologist',      availability:'Today 2PM–6PM',     rating:4.9 },
          { id:'doc3', name:'Dr. Anjali Mehta',  specialty:'Pediatrician',      availability:'Tomorrow 11AM–4PM', rating:4.7 },
          { id:'doc4', name:'Dr. Suresh Kumar',  specialty:'Neurologist',       availability:'Today 11AM–3PM',    rating:4.6 },
          { id:'doc5', name:'Dr. Neha Gupta',    specialty:'Dermatologist',     availability:'Tomorrow 9AM–1PM',  rating:4.8 },
        ]);
      } finally { setLoadingDocs(false); }
    })();
  }, []);

  const fetchMyApts = async () => {
    setLoadingApts(true);
    try {
      const res  = await fetch('http://127.0.0.1:8000/appointments');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMyApts([...data.filter(a => a.patient_id === patientName || a.patient_id === patientId)].reverse());
    } catch { setMyApts([]); }
    finally  { setLoadingApts(false); }
  };

  useEffect(() => { if (activeTab === 'history') fetchMyApts(); }, [activeTab]);

  const fetchBookedSlots = async (docId, date) => {
    setLoadingSlots(true);
    try {
      const res  = await fetch('http://127.0.0.1:8000/appointments');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookedSlots(data.filter(a => a.doctor_raw_id === docId && a.appointment_date === date).map(a => a.appointment_time));
    } catch { setBookedSlots([]); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => {
    if (showModal && selectedDoc && bookDate) { setBookSlot(''); fetchBookedSlots(selectedDoc.id, bookDate); }
  }, [showModal, selectedDoc?.id, bookDate]);

  const openBooking = (doc) => {
    setSelectedDoc(doc); setBookDate(''); setBookSlot(''); setBookedSlots([]);
    setBookSuccess(false); setBookError(''); setShowModal(true);
  };

  const confirmBooking = async () => {
    if (!bookDate || !bookSlot) { setBookError('Please select a date and time slot.'); return; }
    if (bookedSlots.includes(bookSlot)) { setBookError('Slot already taken — pick another time.'); return; }
    setBooking(true); setBookError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId || patientName,
          doctor_id:  selectedDoc.id,
          appointment_date: bookDate,
          appointment_time: bookSlot,
          summary:    triageSummary?.summary || null,
          risk_level: triageSummary?.risk_level || 'low',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Booking failed');
      setBookedSlots(prev => [...prev, bookSlot]);
      setBookSuccess(true);
      setTimeout(() => { setShowModal(false); setBookSuccess(false); }, 2500);
    } catch (err) { setBookError(err.message); }
    finally { setBooking(false); }
  };

  const handleTriageComplete = (result) => setTriageSummary(result);

  const filteredDocs = doctors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDT = (str) => {
    try {
      const d = new Date(str);
      return { date: d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
               time: d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
               day: d.toLocaleDateString('en-IN',{day:'numeric'}), mon: d.toLocaleDateString('en-IN',{month:'short'}) };
    } catch { return { date:str, time:'', day:'--', mon:'--' }; }
  };

  const getDoctorName = id => doctors.find(d => d.id === id)?.name || id;

  const TAB_ITEMS = [
    { key:'book',    label:'Find a Doctor',    icon:Stethoscope },
    { key:'voice',   label:'Voice AI Triage',  icon:Mic },
    { key:'history', label:'My Appointments',  icon:History },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar role="patient" activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden ml-64">

        {/* Header */}
        <header className="bg-white border-b border-slate-100 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Hello, {patientName} 👋</h2>
              <p className="text-slate-500 text-sm">Your personal health dashboard</p>
            </div>
            <div className="flex gap-3 items-center">
              {triageSummary && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${riskBadge(triageSummary.risk_level)} border border-current/20`}>
                  <Activity size={16} /> Triage: {triageSummary.risk_level?.toUpperCase()} RISK
                </div>
              )}
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl hover:text-blue-600 shadow-sm transition">
                <Bell size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 px-6 shrink-0">
          <div className="max-w-7xl mx-auto flex gap-1 pt-1">
            {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}>
                <Icon size={16} />
                {label}
                {key === 'voice' && <span className="ml-1 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── TAB: FIND A DOCTOR ── */}
            {activeTab === 'book' && (
              <>
                {/* Triage summary banner */}
                {triageSummary && (
                  <div className={`p-5 rounded-2xl border-2 ${riskBadge(triageSummary.risk_level)} border-current/20 flex items-start justify-between gap-4`}>
                    <div>
                      <p className="font-bold text-sm mb-1">✅ AI Triage Summary Ready — will be attached to your booking</p>
                      <p className="text-xs opacity-80 line-clamp-2">{triageSummary.summary?.split('\n')[0]}</p>
                    </div>
                    <button onClick={() => setActiveTab('voice')} className="text-xs font-bold underline shrink-0">View</button>
                  </div>
                )}

                {/* Search */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold mb-4">Search Doctors</h3>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name or specialty…"
                      className="w-full p-3.5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 ring-blue-500 outline-none text-sm" />
                  </div>
                </div>

                {/* Doctors grid */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold mb-5">Available Doctors</h3>
                  {loadingDocs ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                  ) : filteredDocs.length === 0 ? (
                    <p className="text-slate-400 text-center py-10">No doctors match your search.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredDocs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                          <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                              {SPEC_ICON[doc.specialty] || '🩺'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{doc.name}</p>
                              <p className="text-xs text-blue-600 font-medium">{doc.specialty}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                  <Clock size={11} className="text-slate-400" /> {doc.availability || 'Available'}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-yellow-600 font-semibold">
                                  <Star size={11} fill="currentColor" /> {doc.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button onClick={() => openBooking(doc)}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition group-hover:scale-105">
                            Book <ChevronRight size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TAB: VOICE AI TRIAGE ── */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <VoiceAssistant patientName={patientName} onTriageComplete={handleTriageComplete} />
                {triageSummary && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" /> Triage Report Generated
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${riskBadge(triageSummary.risk_level)}`}>
                        {(triageSummary.risk_level || 'low').toUpperCase()} RISK
                      </span>
                    </div>
                    <pre className="text-sm text-slate-700 bg-slate-50 rounded-2xl p-5 whitespace-pre-wrap font-mono leading-relaxed border border-slate-100">
                      {triageSummary.summary}
                    </pre>
                    <button onClick={() => setActiveTab('book')}
                      className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                      Book Appointment with This Summary <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: MY APPOINTMENTS ── */}
            {activeTab === 'history' && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="text-blue-600" size={20} /> My Appointments
                  </h3>
                  <button onClick={fetchMyApts} className="text-sm text-blue-600 font-semibold hover:underline">Refresh</button>
                </div>
                {loadingApts ? (
                  <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                ) : myApts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No appointments yet</p>
                    <button onClick={() => setActiveTab('book')}
                      className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition">
                      Find a Doctor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myApts.map(apt => {
                      const { date, time, day, mon } = formatDT(apt.date);
                      return (
                        <div key={apt.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition">
                          <div className="flex gap-4 items-center">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-blue-100">
                              <p className="text-[10px] text-blue-400 font-bold uppercase">{mon}</p>
                              <p className="text-xl font-black text-blue-700 leading-none">{day}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{getDoctorName(apt.doctor_id)}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock size={11} className="text-blue-400" /> {time}</span>
                                <span className="text-slate-300">·</span>
                                <span>{date}</span>
                              </div>
                              {apt.summary && (
                                <p className="text-xs text-slate-500 mt-1 max-w-xs line-clamp-1">{apt.summary.split('\n')[0]}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${statusBadge(apt.status)}`}>
                              {apt.status}
                            </span>
                            {apt.risk_level && (
                              <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${riskBadge(apt.risk_level)}`}>
                                {apt.risk_level} risk
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── BOOKING MODAL ── */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-7 pt-7 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Book Appointment</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  with <span className="font-semibold text-blue-600">{selectedDoc.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{selectedDoc.specialty}</span>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
            </div>

            {bookSuccess ? (
              <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                <div className="w-18 h-18 bg-green-100 rounded-full flex items-center justify-center mb-5 p-4">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Appointment Booked!</h3>
                <p className="text-slate-500 text-sm">
                  {bookDate} at {bookSlot} with <strong>{selectedDoc.name}</strong>
                </p>
                {triageSummary && <p className="mt-2 text-xs text-green-600 font-medium">✅ AI triage summary attached</p>}
              </div>
            ) : (
              <div className="px-7 py-5 space-y-5">
                {/* Doctor card */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                  <div className="text-3xl">{SPEC_ICON[selectedDoc.specialty] || '🩺'}</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{selectedDoc.name}</p>
                    <p className="text-sm text-blue-600">{selectedDoc.specialty}</p>
                  </div>
                  <span className="text-yellow-500 font-semibold text-sm flex items-center gap-1">
                    <Star size={13} fill="currentColor" /> {selectedDoc.rating}
                  </span>
                </div>

                {triageSummary && (
                  <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${riskBadge(triageSummary.risk_level)} border border-current/20`}>
                    <CheckCircle size={14} /> AI triage summary will be sent to doctor ({triageSummary.risk_level?.toUpperCase()} risk)
                  </div>
                )}

                {bookError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    <AlertCircle size={16} /> {bookError}
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date *</label>
                  <input type="date" min={todayStr()} value={bookDate} onChange={e => setBookDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 text-sm" />
                </div>

                {/* Slots */}
                {bookDate && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Time *</label>
                      {loadingSlots && <Loader2 size={13} className="animate-spin text-slate-400" />}
                    </div>
                    <div className="flex gap-3 mb-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Available</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Booked</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {ALL_SLOTS.map(slot => {
                        const isBooked   = bookedSlots.includes(slot);
                        const isSelected = bookSlot === slot;
                        return (
                          <button key={slot} disabled={isBooked || loadingSlots}
                            onClick={() => !isBooked && setBookSlot(slot)}
                            className={`relative py-2 rounded-xl text-xs font-semibold transition border ${
                              isBooked   ? 'bg-red-50 text-red-300 border-red-200 cursor-not-allowed line-through' :
                              isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' :
                                           'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                            }`}>
                            {slot}
                            {isBooked && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full flex items-center justify-center"><X size={7} className="text-white" strokeWidth={3} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={confirmBooking} disabled={booking || !bookDate || !bookSlot}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                    booking ? 'bg-blue-400 text-white cursor-not-allowed' :
                    !bookDate || !bookSlot ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                    'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                  }`}>
                  {booking ? <><Loader2 size={18} className="animate-spin" /> Booking…</> : <><Calendar size={18} /> Confirm Appointment</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;