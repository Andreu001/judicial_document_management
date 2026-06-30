// src/components/SideAuth/SideLoginForm.jsx
import React, { useState, useEffect } from 'react';
import { useSideAuth } from '../../context/SideAuthContext';
import styles from './SideLoginForm.module.css';

const SideLoginForm = ({ onClose, onSuccess }) => {
  const { loginWithYandex, loginWithVK, loading } = useSideAuth();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleYandexLogin = () => {
    const clientId = '7ae23a1626884d3e8fb7399c3f1dc630';
    const redirectUri = `${window.location.origin}/side_case/oauth-callback/`;
    const scope = 'login:info login:email';
    
    // Используем response_type=token для получения токена напрямую (без обмена кода)
    const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    console.log('Yandex auth URL:', authUrl);
    
    // Редирект всей страницы (не popup)
    window.location.href = authUrl;
  };

  // Обработка входа через VK
  const handleVKLogin = () => {
    const VK_APP_ID = 'YOUR_VK_APP_ID'; // Замените на ваш ID приложения VK
    const redirectUri = `${window.location.origin}/side_case/oauth-callback/`;
    const scope = 'email';
    
    const authUrl = `https://oauth.vk.com/authorize?client_id=${VK_APP_ID}&display=popup&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&v=5.131`;
    
    const popup = window.open(authUrl, 'vk-auth', 'width=600,height=500,left=200,top=100');
    
    if (!popup) {
      setError('Пожалуйста, разрешите всплывающие окна для этого сайта');
    }
  };

  // Отправка кода на бэкенд для Yandex
  const handleYandexCode = async (code) => {
    setIsProcessing(true);
    try {
      console.log('Sending Yandex code to backend:', code);
      
      const response = await fetch('/side_case/auth/callback/yandex/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/side_case/oauth-callback/` })
      });
      
      const data = await response.json();
      console.log('Yandex auth response:', data);
      
      if (data.user) {
        const result = await loginWithYandex(data.user);
        if (result.success) {
          onSuccess && onSuccess(result);
          onClose();
        } else {
          setError(result.error || 'Ошибка при входе через Яндекс');
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('Yandex code exchange error:', err);
      setError('Ошибка при входе через Яндекс: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Отправка кода на бэкенд для VK
  const handleVKCode = async (code) => {
    setIsProcessing(true);
    try {
      console.log('Sending VK code to backend:', code);
      
      const response = await fetch('/side_case/auth/callback/vk/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/side_case/oauth-callback/` })
      });
      const data = await response.json();
      console.log('VK auth response:', data);
      
      if (data.user) {
        const result = await loginWithVK(data.user);
        if (result.success) {
          onSuccess && onSuccess(result);
          onClose();
        } else {
          setError(result.error);
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('VK code exchange error:', err);
      setError('Ошибка при входе через ВКонтакте');
    } finally {
      setIsProcessing(false);
    }
  };

  // Обработка callback страницы для popup
  useEffect(() => {
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Проверяем наличие кода в URL (для обоих провайдеров)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    // Для Яндекс также может быть токен в hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (window.location.pathname.includes('/side_case/oauth-callback/')) {
      console.log('Callback detected! Code:', code, 'AccessToken:', accessToken);
      
      if (accessToken) {
        // Обработка токена для Яндекс (альтернативный способ)
        console.log('Processing Yandex access token');
        const processToken = async () => {
          setIsProcessing(true);
          try {
            const userInfoResponse = await fetch('https://login.yandex.ru/info?format=json', {
              headers: { 'Authorization': `OAuth ${accessToken}` }
            });
            const userInfo = await userInfoResponse.json();
            console.log('Yandex user info:', userInfo);
            
            const result = await loginWithYandex({
              id: String(userInfo.id),
              email: userInfo.default_email,
              first_name: userInfo.first_name || '',
              last_name: userInfo.last_name || '',
              full_name: `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim(),
              birth_date: userInfo.birthday || null
            });
            
            if (result.success) {
              onSuccess && onSuccess(result);
              onClose();
            } else {
              setError(result.error);
            }
          } catch (err) {
            console.error('Token processing error:', err);
            setError('Ошибка при обработке токена');
          } finally {
            setIsProcessing(false);
          }
        };
        processToken();
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } 
      else if (code) {
        // Определяем провайдера по наличию параметров
        console.log('Processing code:', code);
        
        // Если есть state с VK или другие признаки
        const state = urlParams.get('state');
        
        if (state && state.includes('vk')) {
          handleVKCode(code);
        } else {
          // Пробуем Яндекс
          handleYandexCode(code);
        }
        
        // Очищаем параметры из URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Вход в личный кабинет</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.description}>
            Войдите через сервис, который вы использовали при регистрации в суде
          </p>
          
          {error && (
            <div className={styles.error}>
              {error}
              {error.includes('redirect_uri') && (
                <div className={styles.errorHint}>
                  <p><strong>Решение:</strong> Добавьте в настройках приложения Яндекса Callback URI:</p>
                  <code>http://localhost:3000/side_case/oauth-callback/</code>
                </div>
              )}
            </div>
          )}
          
          <div className={styles.socialButtons}>
            <button 
              className={`${styles.socialButton} ${styles.yandexButton}`}
              onClick={handleYandexLogin}
              disabled={isProcessing || loading}
            >
              <span className={styles.socialIcon}>Я</span>
              Войти через Яндекс ID
            </button>
            
            <button 
              className={`${styles.socialButton} ${styles.vkButton}`}
              onClick={handleVKLogin}
              disabled={isProcessing || loading}
            >
              <span className={styles.socialIcon}>VK</span>
              Войти через ВКонтакте
            </button>
          </div>
          
          {(isProcessing || loading) && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Выполняется вход...</p>
            </div>
          )}
          
          <div className={styles.info}>
            <p>При первом входе система автоматически свяжет вас с вашими делами</p>
            <p className={styles.infoSmall}>Для точного определения используйте тот же email, что указан в суде</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideLoginForm;