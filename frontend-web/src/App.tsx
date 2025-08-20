import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/contacts" element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        } />
        <Route path="/lists" element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;