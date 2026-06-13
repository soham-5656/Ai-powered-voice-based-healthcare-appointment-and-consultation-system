// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home            from './pages/Home';
import Auth            from './pages/Auth';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard  from './pages/DoctorDashboard';
import AdminDashboard   from './pages/AdminDashboard';

// Read role directly from localStorage — no Firebase needed
const getRole = () => localStorage.getItem('userRole');

const ProtectedPatient = () => {
  const role = getRole();
  if (role === 'patient') return <PatientDashboard />;
  if (role === 'doctor')  return <Navigate to="/doctor"  replace />;
  if (role === 'admin')   return <Navigate to="/admin"   replace />;
  return <Navigate to="/login" replace />;
};

const ProtectedDoctor = () => {
  const role = getRole();
  if (role === 'doctor')  return <DoctorDashboard />;
  if (role === 'patient') return <Navigate to="/patient" replace />;
  if (role === 'admin')   return <Navigate to="/admin"   replace />;
  return <Navigate to="/login" replace />;
};

const ProtectedAdmin = () => {
  const role = getRole();
  if (role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const role = getRole();
  if (role === 'patient') return <Navigate to="/patient" replace />;
  if (role === 'doctor')  return <Navigate to="/doctor"  replace />;
  if (role === 'admin')   return <Navigate to="/admin"   replace />;
  return <Auth />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/login"  element={<PublicRoute />} />
        <Route path="/signup" element={<PublicRoute />} />
        <Route path="/patient" element={<ProtectedPatient />} />
        <Route path="/doctor"  element={<ProtectedDoctor />} />
        <Route path="/admin"   element={<ProtectedAdmin />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;