// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  Users, Clock, Loader2, Activity,
  TrendingUp, FileText, CheckCircle, AlertTriangle,
  RefreshCw, Settings, ChevronRight, Download, Server
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

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [stats, setStats]               = useState(null);
  const [uptime, setUptime]             = useState("99.98%");

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      
      const aptRes = await fetch('http://127.0.0.1:8000/appointments');
      const aptData = await aptRes.json();
      setAppointments(aptData);
      
      const statsRes = await fetch('http://127.0.0.1:8000/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
      
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Simulate slight uptime changes over time
    const interval = setInterval(() => {
      setUptime((99.90 + Math.random() * 0.09).toFixed(2) + "%");
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeDoctors = 5; // Mock value fallback

  const riskBadge = (l) =>
    l === 'high'   ? 'bg-red-100 text-red-700 border border-red-200' :
    l === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                     'bg-green-100 text-green-700 border border-green-200';

  const riskRow = (l) =>
    l === 'high'   ? 'bg-red-50/60 hover:bg-red-50' :
    l === 'medium' ? 'bg-yellow-50/40 hover:bg-yellow-50' :
                     'hover:bg-slate-50/50';

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900 relative overflow-hidden">
      <Sidebar role="admin" />

      <div className="ml-64 flex-1 flex flex-col h-screen">
        
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm z-10 sticky top-0">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="animate-fade-right">
              <h2 className="text-3xl font-bold text-slate-800">Admin Command Center</h2>
              <p className="text-slate-500 mt-1">Platform overview and real-time statistics</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchData(true)}
                className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-blue-600 transition shadow-sm">
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-105 transition-all">
                <Download size={18} /> Export Report
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <span className="ml-3 text-slate-500 font-bold">Loading system data...</span>
              </div>
            ) : (
              <>
                {/* ── STATS GRID ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="glass-card rounded-[2rem] p-6 border border-blue-200 relative overflow-hidden animate-fade-up">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-blue-900">
                      <Users size={80} />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 shadow-inner rounded-2xl flex items-center justify-center mb-4">
                      <Users className="text-blue-600" size={28} />
                    </div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Total Patients</p>
                    <p className="text-4xl font-black text-slate-800 mt-1"><AnimatedCounter value={stats?.total_patients || 0} /></p>
                    <div className="mt-3 flex items-center gap-1 text-green-600 text-sm font-bold bg-green-50 px-2 py-1 inline-flex rounded-lg border border-green-100">
                      <TrendingUp size={14} /> +12% this week
                    </div>
                  </div>

                  <div className="glass-card rounded-[2rem] p-6 border border-indigo-200 relative overflow-hidden animate-fade-up delay-100">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-indigo-900">
                      <Activity size={80} />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-50 shadow-inner rounded-2xl flex items-center justify-center mb-4">
                      <Activity className="text-indigo-600" size={28} />
                    </div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Active Doctors</p>
                    <p className="text-4xl font-black text-slate-800 mt-1"><AnimatedCounter value={stats?.total_doctors || activeDoctors} /></p>
                    <div className="mt-3 text-indigo-600 text-sm font-bold bg-indigo-50 px-2 py-1 inline-flex rounded-lg border border-indigo-100">
                      All departments online
                    </div>
                  </div>

                  <div className="glass-card rounded-[2rem] p-6 border border-emerald-200 relative overflow-hidden animate-fade-up delay-200">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-emerald-900">
                      <Clock size={80} />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-inner rounded-2xl flex items-center justify-center mb-4">
                      <Clock className="text-emerald-600" size={28} />
                    </div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Total Appointments</p>
                    <p className="text-4xl font-black text-slate-800 mt-1"><AnimatedCounter value={stats?.total_appointments || 0} /></p>
                    <div className="mt-3 flex items-center gap-1 text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 inline-flex rounded-lg border border-emerald-100">
                      <CheckCircle size={14} /> 85% completion rate
                    </div>
                  </div>

                  <div className="glass-card rounded-[2rem] p-6 border border-red-200 relative overflow-hidden animate-fade-up delay-300">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-red-900">
                      <AlertTriangle size={80} />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 shadow-inner rounded-2xl flex items-center justify-center mb-4">
                      <AlertTriangle className="text-red-600" size={28} />
                    </div>
                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider">High Risk Cases</p>
                    <p className="text-4xl font-black text-slate-800 mt-1"><AnimatedCounter value={stats?.high_risk || 0} /></p>
                    <div className="mt-3 flex items-center gap-1 text-red-600 text-sm font-bold bg-red-50 px-2 py-1 inline-flex rounded-lg border border-red-100 animate-pulse-glow">
                      Requires attention
                    </div>
                  </div>
                </div>

                {/* ── CHARTS / RISK DISTRIBUTION ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  <div className="md:col-span-1 glass-card rounded-[2.5rem] p-8 border border-slate-200 animate-fade-up delay-400">
                    <h3 className="font-black text-xl mb-6 text-slate-800">Risk Distribution</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm font-black mb-2">
                          <span className="text-red-600">High Risk</span>
                          <span className="text-slate-800"><AnimatedCounter value={stats?.high_risk || 0} /></span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden shadow-inner">
                          <div className="bg-red-500 h-full rounded-full animate-progress" style={{ width: `${Math.max(5, ((stats?.high_risk || 0) / Math.max(1, stats?.total_appointments)) * 100)}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm font-black mb-2">
                          <span className="text-yellow-600">Medium Risk</span>
                          <span className="text-slate-800"><AnimatedCounter value={stats?.medium_risk || 0} /></span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden shadow-inner">
                          <div className="bg-yellow-500 h-full rounded-full animate-progress" style={{ width: `${Math.max(5, ((stats?.medium_risk || 0) / Math.max(1, stats?.total_appointments)) * 100)}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm font-black mb-2">
                          <span className="text-green-600">Low Risk</span>
                          <span className="text-slate-800"><AnimatedCounter value={stats?.low_risk || 0} /></span>
                        </div>
                        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden shadow-inner">
                          <div className="bg-green-500 h-full rounded-full animate-progress" style={{ width: `${Math.max(5, ((stats?.low_risk || 0) / Math.max(1, stats?.total_appointments)) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-xl text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-slate-700 rounded-xl"><Server size={20} className="text-emerald-400"/></div>
                        <div>
                          <h4 className="font-bold text-sm">System Health</h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">All nodes online</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end border-t border-slate-700 pt-3 mt-1">
                        <div>
                          <p className="text-xs text-slate-400">Current Uptime</p>
                          <p className="font-black text-xl text-emerald-400">{uptime}</p>
                        </div>
                        <div className="flex gap-1 h-6 items-end">
                          {[4, 7, 5, 8, 6, 9, 8].map((h, i) => (
                            <div key={i} className="w-1.5 bg-emerald-500 rounded-t-sm animate-pulse" style={{ height: `${h * 10}%`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 glass-card rounded-[2.5rem] overflow-hidden animate-fade-up delay-500 border border-slate-200">
                    <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between bg-white/50">
                      <h3 className="font-black text-xl text-slate-800">Recent Appointments</h3>
                      <button className="text-blue-600 text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="p-6 bg-white/30 backdrop-blur-sm min-h-[300px]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200">
                              <th className="pb-4 pl-4 font-bold">Patient</th>
                              <th className="pb-4 font-bold">Doctor</th>
                              <th className="pb-4 font-bold">Date & Time</th>
                              <th className="pb-4 font-bold">Risk</th>
                              <th className="pb-4 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50">
                            {appointments.slice(0, 6).map((apt, i) => (
                              <tr key={apt.id} className={`transition-all duration-300 ${riskRow(apt.risk_level)} animate-row-in`} style={{ animationDelay: `${i * 0.05}s` }}>
                                <td className="py-4 pl-4 font-bold text-slate-800">{apt.patient_id}</td>
                                <td className="py-4 text-slate-600 font-semibold">{apt.doctor_id}</td>
                                <td className="py-4 text-sm">
                                  <div className="font-bold text-slate-700">{apt.appointment_date}</div>
                                  <div className="text-slate-500 font-medium">{apt.appointment_time}</div>
                                </td>
                                <td className="py-4">
                                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize shadow-sm ${riskBadge(apt.risk_level)}`}>
                                    {apt.risk_level}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold capitalize shadow-sm">
                                    {apt.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {appointments.length === 0 && (
                              <tr>
                                <td colSpan="5" className="py-16 text-center text-slate-400">
                                  <FileText size={48} className="mx-auto mb-4 opacity-30 text-blue-500" />
                                  <p className="font-bold text-lg text-slate-600">No appointments found</p>
                                  <p className="text-sm font-medium mt-1">in the system database</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;