import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/authConfig';
import { authAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LogIn, Calendar, Users, BarChart3 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any, accessToken: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get login URL from backend
      const { data } = await authAPI.getLoginUrl();
      
      // Redirect to Azure login
      window.location.href = data.authUrl;
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Task Manager</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Gestiona tus tareas y agenda con integración de Outlook
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar sesión con Microsoft</span>
                </div>
              )}
            </Button>
            
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-center text-gray-700">
                Características principales
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Integración con Outlook</p>
                    <p className="text-xs text-gray-600">Agenda automática de tareas</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Gestión de usuarios</p>
                    <p className="text-xs text-gray-600">Roles comerciales y administrativos</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Dashboard y reportes</p>
                    <p className="text-xs text-gray-600">Exportación a Excel</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
