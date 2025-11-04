/**
 * Contexto de Autenticación
 * Proporciona el estado global de autenticación a toda la aplicación
 */

import { createContext, useState, useCallback, useEffect } from 'react';
import { loginUser, logout as logoutService, getUserData, getToken, isAuthenticated } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar desde localStorage
  useEffect(() => {
    if (isAuthenticated()) {
      setToken(getToken());
      setUser(getUserData());
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (correo, contraseña) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await loginUser(correo, contraseña);
      
      if (result.ok) {
        setToken(result.token);
        setUser(result.data);
        return { ok: true };
      } else {
        setError(result.error);
        return { ok: false, error: result.error };
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
