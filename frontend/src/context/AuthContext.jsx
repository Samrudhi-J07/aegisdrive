import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('aegis_auth_token');
    const savedUser = localStorage.getItem('aegis_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('aegis_auth_token');
        localStorage.removeItem('aegis_auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to login');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('aegis_auth_token', data.token);
    localStorage.setItem('aegis_auth_user', JSON.stringify(data.user));
    return data;
  };

  const signup = async (name, email, password, role = 'analyst') => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to sign up');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('aegis_auth_token', data.token);
    localStorage.setItem('aegis_auth_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aegis_auth_token');
    localStorage.removeItem('aegis_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
