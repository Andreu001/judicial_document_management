// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../API/authService';
import citizenAuthService from '../API/citizenAuthService';
import baseService from '../API/baseService';

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
      baseService.defaults.headers.common['Authorization'] = `Token ${citizenToken}`;
      try {
        const userData = await citizenAuthService.getProfile();
        setUser({ ...userData, role: 'citizen' });
      } catch (error) {
        console.error('Error fetching citizen profile:', error);
        localStorage.removeItem('citizen_token');
        delete baseService.defaults.headers.common['Authorization'];
      }
    } else if (token) {
      setIsCitizenMode(false);
      baseService.defaults.headers.common['Authorization'] = `Token ${token}`;
      try {
        const userData = await authService.getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        localStorage.removeItem('token');
        delete baseService.defaults.headers.common['Authorization'];
      }
    }
    
    setLoading(false);
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    const citizenToken = localStorage.getItem('citizen_token');
    
    if (citizenToken) {
      try {
        const userData = await citizenAuthService.getProfile();
        setUser({ ...userData, role: 'citizen' });
        return userData;
      } catch (error) {
        console.error('Error fetching citizen:', error);
        return null;
      }
    } else if (token) {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    }
    return null;
  };

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.auth_token) {
        localStorage.setItem('token', response.auth_token);
        baseService.defaults.headers.common['Authorization'] = `Token ${response.auth_token}`;
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
        baseService.defaults.headers.common['Authorization'] = `Token ${response.token}`;
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

  const citizenLoginWithToken = (token) => {
    localStorage.setItem('citizen_token', token);
    baseService.defaults.headers.common['Authorization'] = `Token ${token}`;
    setIsCitizenMode(true);
    fetchUser();
    return { success: true };
  };

  const loginWithToken = (token) => {
    localStorage.setItem('token', token);
    baseService.defaults.headers.common['Authorization'] = `Token ${token}`;
    fetchUser();
    return { success: true };
  };

  const logout = async () => {
    if (isCitizenMode) {
      await citizenAuthService.logout();
      localStorage.removeItem('citizen_token');
    } else {
      await authService.logout();
      localStorage.removeItem('token');
    }
    delete baseService.defaults.headers.common['Authorization'];
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

  const getFullName = () => {
    if (!user) return '';
    return `${user.last_name || ''} ${user.first_name || ''} ${user.middle_name || ''}`.trim();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isCitizenMode,
      login,
      citizenLogin,
      citizenLoginWithToken,
      loginWithToken,
      logout,
      fetchUser,
      isAuthenticated,
      hasRole,
      isCourtStaff,
      isCitizen,
      getFullName
    }}>
      {children}
    </AuthContext.Provider>
  );
};