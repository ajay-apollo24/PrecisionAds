import React, { useState, createContext, useContext, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import { authService } from './services/auth.service';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'advertiser' | 'publisher';
  organizationId: string;
  organizationName: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            // Validate token if using real API
            const isValid = await authService.validateToken();
            if (isValid) {
              setUser(currentUser);
            } else {
              // Token is invalid, clear storage
              await authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear any invalid authentication data
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <div className="min-h-screen bg-background">
        {user ? (
          <DashboardLayout />
        ) : (
          <LoginPage />
        )}
        <Toaster />
      </div>
    </AuthContext.Provider>
  );
} 