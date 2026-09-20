import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Login } from './pages/Login';
import { OperationsOverview } from './pages/OperationsOverview';
import { Dashboard as GateDashboard } from './pages/Dashboard';
import { StreetLightDashboard } from './pages/StreetLightDashboard';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { LoadingState } from './components/LoadingState';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Verifying session credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState message="Loading SmartView platform..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* SmartView Central Operations Overview */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OperationsOverview />
                </ProtectedRoute>
              }
            />

            {/* Operation 01: Remote Gate Control */}
            <Route
              path="/operations/gate"
              element={
                <ProtectedRoute>
                  <GateDashboard />
                </ProtectedRoute>
              }
            />

            {/* Operation 02: Smart Street Lighting (Real Hardware Test) */}
            <Route
              path="/operations/street-light"
              element={
                <ProtectedRoute>
                  <StreetLightDashboard />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs */}
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Logs />
                </ProtectedRoute>
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
