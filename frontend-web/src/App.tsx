import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Lists } from './pages/Lists';
import { Settings } from './pages/Settings';
import { DemoModeProvider, DemoBanner } from './features/demo/DemoMode';
import { GuidedTour } from './features/demo/GuidedTour';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer, useToast } from './components/common/Toast';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import './utils/errorReporting'; // Initialize error reporting

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { checkAuth } = useAuth();
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []); // Empty dependency array - checkAuth should only run on mount

  return (
    <ErrorBoundary>
      <DemoModeProvider>
        <Router>
          <DemoBanner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists"
              element={
                <ProtectedRoute>
                  <Lists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lists/:listId"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          <GuidedTour />
          <ToastContainer toasts={toasts} onClose={removeToast} />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
            }}
          />
        </Router>
      </DemoModeProvider>
    </ErrorBoundary>
  );
}

export default App;
