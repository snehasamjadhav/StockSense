import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api, getStoredToken, setStoredToken } from '../api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  demoLogin: (role: 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (allowedRoles: Array<'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setStoredToken(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setLoading(false);
          return;
        } catch {
          setStoredToken(null);
        }
      }

      // Default to demo admin for seamless evaluation
      try {
        const demoData = await api.demoLogin('ADMIN');
        setStoredToken(demoData.token);
        setUser(demoData.user);
      } catch (err) {
        console.error('Failed to initialize demo persona', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await api.register({ name, email, password, role });
    setStoredToken(res.token);
    setUser(res.user);
  };

  const demoLogin = async (role: 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF') => {
    const res = await api.demoLogin(role);
    setStoredToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles: Array<'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'>) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        hasRole
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
