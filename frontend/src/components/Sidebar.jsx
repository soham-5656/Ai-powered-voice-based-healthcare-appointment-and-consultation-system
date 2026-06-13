// frontend/src/components/Sidebar.jsx
import React from 'react';
import { HeartPulse, Search, Calendar, Mic, LayoutDashboard, Users, Settings, LogOut, Activity, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PATIENT_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard',      id: 'book' },
  { icon: Search,           label: 'Find Doctors',   id: 'book' },
  { icon: Mic,              label: 'Voice Triage',   id: 'voice' },
  { icon: Calendar,         label: 'My Appointments',id: 'history' },
];

const DOCTOR_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Calendar,        label: 'Appointments' },
  { icon: Activity,        label: 'Risk Monitor' },
  { icon: FileText,        label: 'Prescriptions' },
];

const ADMIN_MENU = [
  { icon: LayoutDashboard, label: 'Overview' },
  { icon: Users,           label: 'All Users' },
  { icon: Calendar,        label: 'Appointments' },
  { icon: Settings,        label: 'Settings' },
];

const Sidebar = ({ role, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const profile  = (() => { try { return JSON.parse(localStorage.getItem('userProfile')) || {}; } catch { return {}; } })();
  const name     = localStorage.getItem('userName') || 'User';
  const initial  = name.charAt(0).toUpperCase();

  const menu = role === 'patient' ? PATIENT_MENU : role === 'doctor' ? DOCTOR_MENU : ADMIN_MENU;

  const handleLogout = () => {
    ['userRole','userName','userId','userProfile'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const handleItemClick = (item) => {
    if (role === 'patient' && setActiveTab && item.id) setActiveTab(item.id);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40"
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <HeartPulse size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">VitalSync</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {role === 'patient' ? 'Patient Portal' : role === 'doctor' ? 'Doctor Portal' : 'Admin Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 mb-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-slate-400 capitalize">{profile.specialization || role}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            role === 'doctor' ? 'bg-emerald-500/20 text-emerald-300' :
            role === 'admin'  ? 'bg-amber-500/20 text-amber-300' :
                                'bg-blue-500/20 text-blue-300'
          }`}>
            {role === 'doctor' ? 'Dr.' : role === 'admin' ? 'Admin' : 'Patient'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const isActive = role === 'patient' ? activeTab === item.id :
                           item.label === 'Dashboard' || item.label === 'Appointments';
          return (
            <button key={item.label} onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`}
              style={!isActive ? { '--tw-bg-opacity': 1 } : {}}>
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              {item.label}
              {item.label === 'Voice Triage' && (
                <span className="ml-auto text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-white/10 pt-4">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;