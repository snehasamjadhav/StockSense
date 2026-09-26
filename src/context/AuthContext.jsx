import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { mockInventoryService } from '../services/mockInventoryService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => authService.getSession());
  const [currentUser, setCurrentUser] = useState(() => {
    const s = authService.getSession();
    return s ? s.user : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keep mockInventoryService persona in sync with authenticated user
    if (currentUser) {
      mockInventoryService.setPersona(currentUser.role);
    }
  }, [currentUser]);

  const login = async (identifier, password, remember = false) => {
    setLoading(true);
    try {
      const newSession = await authService.login(identifier, password, remember);
      setSession(newSession);
      setCurrentUser(newSession.user);
      mockInventoryService.setPersona(newSession.user.role);
      return newSession.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.signup(userData);
      setSession(res.session);
      setCurrentUser(res.user);
      mockInventoryService.setPersona(res.user.role);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.clearSession();
    setSession(null);
    setCurrentUser(null);
  };

  const updateProfile = (data) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    if (session) {
      setSession({ ...session, user: updated });
      authService.setSession(updated, session.remember);
    }
    mockInventoryService.updateProfile(data);
  };

  const value = {
    session,
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
