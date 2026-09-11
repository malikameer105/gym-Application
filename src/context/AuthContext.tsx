import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isReceptionist: boolean;
  isTrainer: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewExpenses: boolean;
  canManageExpenses: boolean;
  canViewReports: boolean;
  canManageTrainers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN' || isSuperAdmin;
  const isReceptionist = role === 'RECEPTIONIST';
  const isTrainer = role === 'TRAINER';

  const canManageUsers = isSuperAdmin;
  const canManageSettings = isSuperAdmin;
  const canViewExpenses = isSuperAdmin || role === 'ADMIN';
  const canManageExpenses = isSuperAdmin || role === 'ADMIN';
  const canViewReports = isSuperAdmin || role === 'ADMIN';
  const canManageTrainers = isSuperAdmin || role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        checkAuth,
        isSuperAdmin,
        isAdmin,
        isReceptionist,
        isTrainer,
        canManageUsers,
        canManageSettings,
        canViewExpenses,
        canManageExpenses,
        canViewReports,
        canManageTrainers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
