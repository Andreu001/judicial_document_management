// src/components/SideAuth/OAuthCallbackHandler.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSideAuth } from '../../context/SideAuthContext';

const OAuthCallbackHandler = () => {
  const navigate = useNavigate();
  const { loginWithYandex } = useSideAuth();
  const hasProcessed = useRef(false);  // Добавьте эту строку

  useEffect(() => {
    const handleCallback = async () => {
      // Добавьте эту проверку
      if (hasProcessed.current) {
        console.log('Already processed, skipping');
        return;
      }
      
      // Получаем токен из hash URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      console.log('Access token from hash:', accessToken);
      
      if (accessToken) {
        try {
          hasProcessed.current = true;  // Отмечаем, что обработали
          
          // Получаем данные пользователя от Яндекса
          const userInfoResponse = await fetch('https://login.yandex.ru/info?format=json', {
            headers: { 'Authorization': `OAuth ${accessToken}` }
          });
          const userInfo = await userInfoResponse.json();
          
          console.log('Yandex user info:', userInfo);
          
          // Отправляем данные на ваш бэкенд
          const result = await loginWithYandex({
            id: String(userInfo.id),
            email: userInfo.default_email,
            first_name: userInfo.first_name || '',
            last_name: userInfo.last_name || '',
            full_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
            birth_date: userInfo.birthday || null
          });
          
          if (result.success) {
            // Очищаем hash из URL, чтобы при обновлении не было повторной обработки
            window.location.hash = '';
            navigate('/my-cases');
          } else {
            console.error('Login failed:', result.error);
            navigate('/');
          }
        } catch (err) {
          console.error('Error:', err);
          navigate('/');
        }
      } else {
        setTimeout(() => navigate('/'), 1000);
      }
    };
    
    handleCallback();
  }, [navigate, loginWithYandex]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div className="spinner"></div>
      <p>Выполняется вход...</p>
      <style>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #1e3c5c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallbackHandler;