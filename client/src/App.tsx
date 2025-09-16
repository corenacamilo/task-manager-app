import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './config/authConfig';
import LoginPage from './components/auth/LoginPage';
import AuthCallback from './components/auth/AuthCallback';
import Dashboard from './components/dashboard/Dashboard';
import CreateTask from './components/tasks/CreateTask';
import SchedulingDashboard from './components/scheduling/SchedulingDashboard';
import UserManagement from './components/users/UserManagement';
import { User } from './types';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');

    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      setAccessToken(storedAccessToken);
    }
    
    setLoading(false);
  }, []);

  const handleLoginSuccess = (token: string, userData: User, userAccessToken: string) => {
    setIsAuthenticated(true);
    setUser(userData);
    setAccessToken(userAccessToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard" replace /> : 
                  <LoginPage onLoginSuccess={handleLoginSuccess} />
              } 
            />
            
            <Route 
              path="/auth/callback" 
              element={<AuthCallback onLoginSuccess={handleLoginSuccess} />} 
            />
            
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated && user ? 
                  <Dashboard user={user} /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            <Route 
              path="/tasks/new" 
              element={
                isAuthenticated && user ? 
                  <CreateTask user={user} /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            <Route 
              path="/scheduling" 
              element={
                isAuthenticated && user ? 
                  <SchedulingDashboard user={user} /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            <Route 
              path="/users" 
              element={
                isAuthenticated && user ? 
                  <UserManagement user={user} /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            <Route 
              path="/" 
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              } 
            />
          </Routes>
        </div>
      </Router>
    </MsalProvider>
  );
}

export default App;
