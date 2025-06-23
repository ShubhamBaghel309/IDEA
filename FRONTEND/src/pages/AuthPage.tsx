import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { toast } from 'sonner';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleRegister = async (name: string, email: string, password: string, role: 'teacher' | 'student') => {
    try {
      await register({ name, email, password, role });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-google-blue-50 to-google-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {isLogin ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
