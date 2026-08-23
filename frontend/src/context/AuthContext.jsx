import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('society_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('society_token');
    setToken(null);
    setUser(null);
  };

  // Restore session on mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.data.user);
        } catch (err) {
          console.warn('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('society_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('society_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin,
      isResident
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
