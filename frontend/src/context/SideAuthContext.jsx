// src/context/SideAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import SideCaseService from '../API/SideCaseService';

const SideAuthContext = createContext();

export const useSideAuth = () => {
  const context = useContext(SideAuthContext);
  if (!context) {
    throw new Error('useSideAuth must be used within a SideAuthProvider');
  }
  return context;
};

export const SideAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('Checking auth...');
    try {
      if (SideCaseService.isAuthenticated()) {
        const cachedUser = SideCaseService.getCurrentUser();
        console.log('Cached user:', cachedUser);
        
        if (cachedUser) {
          setUser(cachedUser);
        } else {
          // Если нет кэша, значит не авторизованы
          setLoading(false);
          return;
        }
        
        try {
          // Пытаемся обновить данные с сервера
          const userData = await SideCaseService.getProfile();
          console.log('Profile from server:', userData);
          setUser(userData);
          localStorage.setItem('side_user', JSON.stringify(userData));
          
          // После получения профиля, синхронизируем доступы
          console.log('Syncing access after auth...');
          await SideCaseService.syncAccess();
        } catch (profileError) {
          console.error('Error getting profile, but user might still be valid:', profileError);
          // Если не удалось получить профиль, но есть кэш - оставляем кэш
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const loginWithYandex = async (yandexData) => {
    try {
      setLoading(true);
      console.log('Logging in with Yandex:', yandexData);
      const result = await SideCaseService.socialAuth('yandex', yandexData);
      setUser(result.user);
      console.log('Login successful, cases synced:', result.sync_result);
      return { success: true, syncResult: result.sync_result };
    } catch (error) {
      console.error('Yandex login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithVK = async (vkData) => {
    try {
      setLoading(true);
      const result = await SideCaseService.socialAuth('vk', vkData);
      setUser(result.user);
      return { success: true, syncResult: result.sync_result };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const syncAccess = async () => {
    try {
      setSyncing(true);
      const result = await SideCaseService.syncAccess();
      console.log('Sync result:', result);
      // После синхронизации перезагружаем список дел через событие
      window.dispatchEvent(new Event('cases-synced'));
      return { success: true, result };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await SideCaseService.updateProfile(profileData);
      setUser(updatedUser);
      localStorage.setItem('side_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await SideCaseService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    syncing,
    loginWithYandex,
    loginWithVK,
    syncAccess,
    updateProfile,
    logout,
    isAuthenticated: SideCaseService.isAuthenticated,
  };

  return (
    <SideAuthContext.Provider value={value}>
      {children}
    </SideAuthContext.Provider>
  );
};