import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTP from './pages/auth/OTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Patient Pages
import CompleteProfile from './pages/patient/CompleteProfile';
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import LiveQueue from './pages/patient/LiveQueue';
import Certificates from './pages/patient/Certificates';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';

// Receptionist Pages
import ReceptionistDashboard from './pages/receptionist/Dashboard';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Profile from './pages/auth/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />; // or unauthorized page
  }
  
  // Patient Profile check
  if (user.role === 'Patient' && !user.profile_completed) {
    if (window.location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" />;
    }
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/verify-otp" element={<OTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Patient Routes */}
          <Route path="/complete-profile" element={
            <PrivateRoute roles={['Patient']}>
              <CompleteProfile />
            </PrivateRoute>
          } />
          <Route path="/patient/dashboard" element={
            <PrivateRoute roles={['Patient']}>
              <PatientDashboard />
            </PrivateRoute>
          } />
          <Route path="/patient/book" element={
            <PrivateRoute roles={['Patient']}>
              <BookAppointment />
            </PrivateRoute>
          } />
          <Route path="/patient/queue" element={
            <PrivateRoute roles={['Patient']}>
              <LiveQueue />
            </PrivateRoute>
          } />
          <Route path="/patient/certificates" element={
            <PrivateRoute roles={['Patient']}>
              <Certificates />
            </PrivateRoute>
          } />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={
            <PrivateRoute roles={['Doctor']}>
              <DoctorDashboard />
            </PrivateRoute>
          } />

          {/* Receptionist Routes */}
          <Route path="/receptionist/dashboard" element={
            <PrivateRoute roles={['Receptionist']}>
              <ReceptionistDashboard />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute roles={['Admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Profile Route */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
