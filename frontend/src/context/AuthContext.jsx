import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../API/authService';
import citizenAuthService from '../API/citizenAuthService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCitizenMode, setIsCitizenMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const citizenToken = localStorage.getItem('citizen_token');
    
    if (citizenToken) {
      setIsCitizenMode(true);
      try {
        const userData = await citizenAuthService.getProfile();
        setUser({ ...userData, role: 'citizen' });
      } catch (error) {
        console.error('Error fetching citizen profile:', error);
        localStorage.removeItem('citizen_token');
      }
    } else if (token) {
      setIsCitizenMode(false);
      try {
        const userData = await authService.getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.auth_token) {
        localStorage.setItem('token', response.auth_token);
        setIsCitizenMode(false);
        const userData = await authService.getProfile();
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Ошибка авторизации' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const citizenLogin = async (username, password) => {
    try {
      const response = await citizenAuthService.login(username, password);
      if (response.token) {
        localStorage.setItem('citizen_token', response.token);
        setIsCitizenMode(true);
        const userData = await citizenAuthService.getProfile();
        setUser({ ...userData, role: 'citizen' });
        return { success: true };
      }
      return { success: false, error: 'Ошибка авторизации' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    if (isCitizenMode) {
      await citizenAuthService.logout();
      localStorage.removeItem('citizen_token');
    } else {
      await authService.logout();
      localStorage.removeItem('token');
    }
    setUser(null);
    setIsCitizenMode(false);
  };

  const isAuthenticated = () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('citizen_token'));
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isCourtStaff = () => {
    return user && ['admin', 'judge', 'secretary', 'hr'].includes(user.role);
  };

  const isCitizen = () => {
    return user && user.role === 'citizen';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isCitizenMode,
      login,
      citizenLogin,
      logout,
      isAuthenticated,
      hasRole,
      isCourtStaff,
      isCitizen
    }}>
      {children}
    </AuthContext.Provider>
  );
};