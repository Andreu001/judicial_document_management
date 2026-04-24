// src/pages/citizen/OAuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { citizenLoginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const completeAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
          // ✅ Сохраняем токен в нужное место
          localStorage.setItem('token', token);
          localStorage.setItem('citizen_token', token);
          
          // Обновляем состояние авторизации
          citizenLoginWithToken(token);
          
          // Небольшая задержка для синхронизации
          setTimeout(() => {
            navigate('/citizen/dashboard', { replace: true });
          }, 500);
        } else {
          setError('Токен авторизации не получен');
          setTimeout(() => navigate('/citizen/login'), 2000);
        }
      } catch (error) {
        console.error('OAuth error:', error);
        setError('Ошибка при входе через Яндекс');
        setTimeout(() => navigate('/citizen/login'), 2000);
      }
    };
    
    completeAuth();
  }, [navigate, citizenLoginWithToken]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <h2 style={{ color: '#e53e3e' }}>Ошибка входа</h2>
        <p>{error}</p>
        <p>Перенаправление на страницу входа...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h2>Вход через Яндекс...</h2>
      <p>Пожалуйста, подождите</p>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f3f3', 
        borderTop: '4px solid #1e3c5c', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        marginTop: '20px'
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;