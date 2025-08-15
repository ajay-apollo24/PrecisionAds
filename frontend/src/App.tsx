import React, { useState, createContext, useContext } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Toaster } from './components/ui/sonner';

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

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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