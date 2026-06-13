// frontend/src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Mail, Lock, User, Phone, Calendar, Stethoscope, Eye, EyeOff, CheckCircle, Mic, Brain, Shield } from 'lucide-react';

const ADMIN_EMAIL    = 'admin@vitalsync.com';
const ADMIN_PASSWORD = 'Admin@2026';
const API            = 'http://127.0.0.1:8000';

const HIGHLIGHTS = [
  { icon: Mic,    title: 'Voice AI Triage',    desc: 'Book by speaking naturally' },
  { icon: Brain,  title: 'ML Risk Scoring',    desc: 'Smart patient prioritization' },
  { icon: Shield, title: 'Secure & Private',   desc: 'Your data stays protected' },
];

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin]               = useState(true);
  const [role, setRole]                     = useState('patient');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [name, setName]                     = useState('');
  const [age, setAge]                       = useState('');
  const [phone, setPhone]                   = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [successName, setSuccessName]       = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const emailLower = email.trim().toLowerCase();
    try {
      if (emailLower === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('userRole',    'admin');
        localStorage.setItem('userName',    'Admin');
        localStorage.setItem('userProfile', JSON.stringify({ name: 'Admin', role: 'admin', email: ADMIN_EMAIL }));
        window.location.href = '/admin'; return;
      }
      if (isLogin) {
        const res  = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailLower, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        localStorage.setItem('userRole',    data.role);
        localStorage.setItem('userName',    data.name);
        localStorage.setItem('userId',      String(data.id));
        localStorage.setItem('userProfile', JSON.stringify(data));
        window.location.href = `/${data.role}`;
      } else {
        const body = { name: name.trim(), email: emailLower, password, role, age: parseInt(age) || 0, phone: phone.trim(),
          ...(role === 'patient' && { medical_history: medicalHistory }),
          ...(role === 'doctor'  && { specialization }) };
        const res  = await fetch(`${API}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Signup failed');
        localStorage.setItem('userRole',    data.role);
        localStorage.setItem('userName',    data.name);
        localStorage.setItem('userId',      String(data.id));
        localStorage.setItem('userProfile', JSON.stringify(data));
        setSuccessName(data.name); setShowSuccess(true);
        setTimeout(() => { window.location.href = `/${data.role}`; }, 2500);
      }
    } catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const inp = "w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all text-slate-800 placeholder-slate-400";

  return (
    <div className="min-h-screen flex">

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center text-center max-w-sm mx-4 animate-fade-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Account Created!</h2>
            <p className="text-slate-500 text-lg">Welcome, <span className="font-semibold text-blue-600">{successName}</span>!</p>
            <p className="text-slate-400 text-sm mt-2 capitalize">Signing you in as a <strong>{role}</strong>…</p>
            <div className="mt-5 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-progress" />
            </div>
          </div>
        </div>
      )}

      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 hero-gradient p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-cyan-400/15 rounded-full blur-3xl animate-float" style={{animationDelay:'1s'}} />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <HeartPulse size={22} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">VitalSync</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            AI-Powered Healthcare<br />at Your Fingertips
          </h2>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Book appointments, get AI triage, and receive digital prescriptions — all through voice and AI.
          </p>
          <div className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-blue-200 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300/60 text-xs relative z-10">© 2026 VitalSync • Hawkathon Project</p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <HeartPulse size={22} className="text-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900">VitalSync</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900">{isLogin ? 'Welcome back 👋' : 'Create account'}</h1>
            <p className="text-slate-500 mt-1">{isLogin ? 'Login to your VitalSync dashboard' : 'Join thousands of patients & doctors'}</p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Role toggle — signup */}
            {!isLogin && (
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">I am a</p>
                <div className="flex rounded-2xl bg-slate-100 p-1.5">
                  {['patient', 'doctor'].map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${role === r ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                      {r === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} required min="1" max="120" className={inp} />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required className={inp} />
                    </div>
                  </div>
                  {role === 'doctor' && (
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select value={specialization} onChange={e => setSpecialization(e.target.value)} required
                        className={`${inp} appearance-none text-slate-700`}>
                        <option value="">Select Specialization</option>
                        {['General Physician','Cardiologist','Dermatologist','Pediatrician','Neurologist',
                          'Orthopedic','Psychiatrist','ENT Specialist','Oncologist','Gynecologist','Pulmonologist','Gastroenterologist'].map(s => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {role === 'patient' && (
                    <textarea placeholder="Medical history (optional) — e.g. diabetes, allergies…"
                      value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} rows={3}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500 transition-all resize-none text-sm text-slate-800 placeholder-slate-400" />
                  )}
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className={inp} />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type={showPass ? 'text' : 'password'} placeholder="Password (min 6 characters)"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className={`${inp} pr-12`} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}>
                {loading ? '⏳ Please wait…' : isLogin ? 'Login →' : 'Create Account →'}
              </button>
            </form>

            <p className="text-center mt-5 text-slate-600 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-blue-600 font-semibold hover:underline">
                {isLogin ? 'Sign up free' : 'Login'}
              </button>
            </p>
            {isLogin && (
              <p className="text-center mt-2 text-xs text-slate-400">
                Admin: admin@vitalsync.com / Admin@2026
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
};

export default Auth;