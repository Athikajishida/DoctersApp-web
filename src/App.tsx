// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { ScheduleProvider } from './context/ScheduleContext';
import { PrescriptionProvider } from './context/PrescriptionContext';
import { ChartProvider } from './context/ChartContext';
import { ToastProvider } from './context/ToastContext';
import BookingPage from './pages/Registrations/BookingPage';
import Dashboard from './components/Dashboard';
import ChartsPage from './pages/Charts/ChartsPage';
import Login from './components/Login/forms/Login';
import ForgotPassword from './components/Login/ForgotPassword';
import Profile from './components/Login/Profile';
import Appointments from './components/Appointments/forms/Appointments';
import Patients from './components/Patients/forms/Patients';
import AppointmentScheduler from './components/Schedule/AppointmentScheduler';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/common/ToastContainer';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <AuthProvider apiBaseUrl="http://localhost:3000">
          <PatientProvider>
            <ScheduleProvider>
              <PrescriptionProvider>
                <div className="App">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<BookingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgotpassword" element={<ForgotPassword />} />
                    
                    {/* Protected routes */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Charts route - wrapped with ChartProvider */}
                    <Route 
                      path="/charts" 
                      element={
                        <ProtectedRoute>
                          <ChartProvider>
                            <ChartsPage />
                          </ChartProvider>
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/appointments" 
                      element={
                        <ProtectedRoute>
                          <Appointments />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/patients" 
                      element={
                        <ProtectedRoute>
                          <Patients />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/schedule" 
                      element={
                        <ProtectedRoute>
                          <AppointmentScheduler />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                  <ToastContainer />
                </div>
              </PrescriptionProvider>
            </ScheduleProvider>
          </PatientProvider>
        </AuthProvider>
      </Router>
    </ToastProvider>
  );
};
//recent
export default App;