// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse, Mic, Brain, Shield, Clock, Star, ArrowRight,
  Activity, Users, Calendar, CheckCircle, Zap, Globe
} from 'lucide-react';

const FEATURES = [
  { icon: Mic,      color: 'from-blue-500 to-cyan-400',   title: 'Voice AI Triage',       desc: 'Describe symptoms naturally by voice. Our AI collects your health info conversationally.' },
  { icon: Brain,    color: 'from-violet-500 to-purple-400',title: 'ML Risk Scoring',       desc: 'Machine learning prioritizes high-risk patients automatically so no case is missed.' },
  { icon: Calendar, color: 'from-emerald-500 to-teal-400', title: 'Smart Scheduling',      desc: 'Real-time slot booking with conflict detection. Doctors get your summary before you arrive.' },
  { icon: Activity, color: 'from-rose-500 to-pink-400',    title: 'Doctor Dashboard',      desc: 'Digital whiteboard, AI summaries, and one-click prescription delivery via email.' },
  { icon: Shield,   color: 'from-amber-500 to-orange-400', title: 'Secure & Private',      desc: 'Your health data is encrypted and private. HIPAA-aligned architecture.' },
  { icon: Globe,    color: 'from-indigo-500 to-blue-400',  title: 'Hindi & English',       desc: 'Voice interaction works in both Hindi and English for wider accessibility.' },
];

const STATS = [
  { value: '10,000+', label: 'Patients Served' },
  { value: '98%',     label: 'Satisfaction Rate' },
  { value: '< 2 min', label: 'Avg Booking Time' },
  { value: '24/7',    label: 'AI Availability' },
];

const STEPS = [
  { step: '01', title: 'Sign Up',              desc: 'Create your patient account in 30 seconds.' },
  { step: '02', title: 'Talk to AI',           desc: 'Describe symptoms by voice. AI builds your triage report.' },
  { step: '03', title: 'Book Appointment',     desc: 'Pick a doctor & slot. Summary auto-sent to doctor.' },
  { step: '04', title: 'Get Prescription',     desc: 'After consultation, receive prescription to your email.' },
];

const Home = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <HeartPulse size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">VitalSync</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-slate-700 font-semibold hover:text-blue-600 transition text-sm">
              Login
            </button>
            <button onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-gradient min-h-screen flex items-center justify-center pt-24 pb-20 px-6 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl animate-float" style={{animationDelay:'1.5s'}} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-400/15 rounded-full blur-3xl animate-float" style={{animationDelay:'0.8s'}} />

        <div className={`max-w-5xl mx-auto text-center relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-8 animate-fade-in">
            <Zap size={15} className="text-yellow-300" />
            AI-Powered Healthcare Platform • India's First Voice-Based System
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight animate-fade-up">
            Healthcare That<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
              Listens to You
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-up delay-200">
            Book appointments, describe symptoms by voice, get AI triage summaries — and receive digital prescriptions, all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <button onClick={() => navigate('/signup')}
              className="group bg-white text-blue-700 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3">
              <HeartPulse size={22} />
              Start for Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')}
              className="bg-white/15 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/25 transition-all duration-300 flex items-center justify-center gap-3">
              <Clock size={20} />
              Login
            </button>
          </div>
          <p className="mt-8 text-blue-200/70 text-sm animate-fade-up delay-400">
            No credit card required • Free for patients
          </p>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up delay-500">
            {STATS.map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <p className="text-2xl md:text-3xl font-black text-white">{value}</p>
                <p className="text-blue-200 text-sm mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">Features</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Everything you need for<br />
              <span className="gradient-text">smarter healthcare</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Built for patients, doctors, and healthcare administrators alike.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <div key={title}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={26} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-bold mb-4">How It Works</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">4 steps to better care</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 p-6 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                  {step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 hero-gradient relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to transform your healthcare experience?</h2>
          <p className="text-xl text-blue-100 mb-10">Join thousands of patients and doctors using VitalSync.</p>
          <button onClick={() => navigate('/signup')}
            className="bg-white text-blue-700 px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-3">
            <HeartPulse size={24} /> Get Started Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <HeartPulse size={18} className="text-blue-400" />
          <span className="text-white font-bold">VitalSync</span>
        </div>
        <p className="text-sm">AI-Powered Voice Healthcare • Hawkathon 2026 Project</p>
        <p className="text-xs mt-2 text-slate-600">Built for India • Secure • Private</p>
      </footer>
    </div>
  );
};

export default Home;