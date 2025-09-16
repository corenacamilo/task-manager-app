import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface AuthCallbackProps {
  onLoginSuccess: (token: string, user: any, accessToken: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication was cancelled or failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const { data } = await authAPI.callback(code);
        
        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        
        onLoginSuccess(data.token, data.user, data.accessToken);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.response?.data?.message || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {error ? 'Error de autenticación' : 'Completando inicio de sesión...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {error ? (
            <div className="space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo a la página de inicio de sesión...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Procesando tu información de inicio de sesión...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
