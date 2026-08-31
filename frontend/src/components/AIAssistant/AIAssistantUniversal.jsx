// src/components/AIAssistant/AIAssistantUniversal.jsx
import React, { useState, useEffect, useRef } from 'react';
import baseService from '../../API/baseService';
import styles from './AIAssistantUniversal.module.css';

const AIAssistantUniversal = ({ onClose, initialContext }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showSessionList, setShowSessionList] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatService = useRef(null);

  // Инициализация
  useEffect(() => {
    loadSessions();
    chatService.current = new ChatService();
  }, []);

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Загрузка сессий
  const loadSessions = async () => {
    try {
      const response = await baseService.get('/api/ai/chat/');
      setSessions(response.data);
      
      // Если есть активная сессия, загружаем её
      if (response.data.length > 0 && !currentSession) {
        const activeSession = response.data.find(s => s.is_active && !s.is_archived);
        if (activeSession) {
          await loadSession(activeSession.id);
        } else {
          await createNewSession();
        }
      } else if (response.data.length === 0) {
        await createNewSession();
      }
    } catch (error) {
      console.error('Ошибка загрузки сессий:', error);
      setError('Не удалось загрузить сессии');
    }
  };

  // Создание новой сессии
  const createNewSession = async (title = 'Новый диалог') => {
    try {
      // ✅ Исправлено: отправляем как JSON, не multipart
      const response = await baseService.post('/api/ai/chat/', {
        title: title,
        session_type: 'general',
        context: initialContext || {}
      });
      setSessions(prev => [response.data, ...prev]);
      await loadSession(response.data.id);
      return response.data;
    } catch (error) {
      console.error('Ошибка создания сессии:', error);
      setError('Не удалось создать сессию');
    }
  };

  // Загрузка сессии
  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      const response = await baseService.get(`/api/ai/chat/${sessionId}/`);
      setCurrentSession(response.data);
      setMessages(response.data.messages || []);
      setUploadedFiles(response.data.uploaded_files || []);
      setError(null);
    } catch (error) {
      console.error('Ошибка загрузки сессии:', error);
      setError('Не удалось загрузить сессию');
    } finally {
      setLoading(false);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!input.trim() || loading || !currentSession) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      created_at: new Date().toISOString()
    }]);
    setLoading(true);

    try {
      // ✅ Исправлено: используем FormData только когда есть файлы
      const formData = new FormData();
      formData.append('message', userMessage);
      
      // Добавляем файлы, которые еще не загружены на сервер
      const filesToUpload = uploadedFiles.filter(f => f.file instanceof File);
      filesToUpload.forEach(file => {
        formData.append('files', file.file);
      });

      const response = await baseService.post(
        `/api/ai/chat/${currentSession.id}/send_message/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      // Обновляем сообщения
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString()
      }]);

      // Обновляем файлы - заменяем временные на загруженные
      if (response.data.files) {
        const uploadedFileIds = response.data.files.map(f => f.id);
        setUploadedFiles(prev => 
          prev.filter(f => !(f.file instanceof File) || uploadedFileIds.includes(f.id))
        );
        setUploadedFiles(prev => [...prev, ...response.data.files]);
      }

    } catch (error) {
      console.error('Ошибка отправки:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ошибка: ' + (error.response?.data?.error || error.message)
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка файла
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setUploading(true);
    const formData = new FormData();
    
    for (let file of files) {
      formData.append('file', file);
      if (currentSession) {
        formData.append('session_id', currentSession.id);
      }
    }

    try {
      const response = await baseService.post('/api/ai/files/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Если загружено несколько файлов
      const uploaded = Array.isArray(response.data) ? response.data : [response.data];
      setUploadedFiles(prev => [...prev, ...uploaded]);

      // Добавляем сообщение о загрузке
      const fileNames = uploaded.map(f => f.file_name).join(', ');
      setMessages(prev => [...prev, {
        role: 'user',
        content: `📎 Загружен файл(ы): ${fileNames}`,
        created_at: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      setError('Не удалось загрузить файл');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Удаление файла
  const deleteFile = async (fileId) => {
    try {
      await baseService.delete(`/api/ai/files/${fileId}/delete/`);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
    }
  };

  // Переключение сессии
  const switchSession = async (sessionId) => {
    if (sessionId === currentSession?.id) return;
    await loadSession(sessionId);
    setShowSessionList(false);
  };

  // Архивирование сессии
  const archiveSession = async (sessionId) => {
    try {
      await baseService.post(`/api/ai/chat/${sessionId}/archive/`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        if (remaining.length > 0) {
          await loadSession(remaining[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error('Ошибка архивирования:', error);
    }
  };

  // Очистка сообщений
  const clearMessages = async () => {
    if (!currentSession) return;
    try {
      await baseService.post(`/api/ai/chat/${currentSession.id}/clear_messages/`);
      setMessages([]);
    } catch (error) {
      console.error('Ошибка очистки:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3>🤖 AI Ассистент</h3>
          <button 
            onClick={() => setShowSessionList(!showSessionList)}
            className={styles.sessionToggle}
          >
            {showSessionList ? '✕' : '📋 Диалоги'}
          </button>
        </div>
        <div className={styles.headerRight}>
          <button 
            onClick={clearMessages}
            className={styles.clearButton}
            title="Очистить историю"
          >
            🗑️
          </button>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Список сессий */}
      {showSessionList && (
        <div className={styles.sessionList}>
          <button 
            onClick={() => createNewSession()}
            className={styles.newSessionButton}
          >
            + Новый диалог
          </button>
          <div className={styles.sessionItems}>
            {sessions.map(session => (
              <div 
                key={session.id}
                className={`${styles.sessionItem} ${currentSession?.id === session.id ? styles.active : ''}`}
                onClick={() => switchSession(session.id)}
              >
                <span className={styles.sessionTitle}>
                  {session.title}
                </span>
                <span className={styles.sessionDate}>
                  {new Date(session.updated_at).toLocaleDateString()}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveSession(session.id);
                  }}
                  className={styles.archiveButton}
                >
                  📁
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Файлы */}
      {uploadedFiles.length > 0 && (
        <div className={styles.filesBar}>
          {uploadedFiles.map(file => (
            <div key={file.id || file.name} className={styles.fileChip}>
              📎 {file.file_name || file.name}
              <button 
                onClick={() => file.id && deleteFile(file.id)}
                className={styles.fileDelete}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Сообщения */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.welcomeMessage}>
            <h4>👋 Добро пожаловать в AI Ассистент!</h4>
            <p>Я помогу вам с юридическими вопросами и задачами судопроизводства.</p>
            <div className={styles.quickActions}>
              <button onClick={() => setInput('Проанализируй дело по статье 158 УК РФ')}>
                📋 Анализ дела
              </button>
              <button onClick={() => setInput('Какие сроки рассмотрения уголовного дела?')}>
                ⏰ Сроки
              </button>
              <button onClick={() => setInput('Как правильно составить ходатайство?')}>
                📄 Ходатайство
              </button>
              <button onClick={() => setInput('Проверь документ на ошибки')}>
                🔍 Проверка
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageRole}>
              {msg.role === 'user' ? '👤 Вы' : '🤖 AI'}
            </div>
            <div className={styles.messageContent}>
              {typeof msg.content === 'string' && msg.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageRole}>🤖 AI</div>
            <div className={styles.messageContent}>
              <span className={styles.typing}>● ● ●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className={styles.fileInput}
            multiple
            accept=".pdf,.docx,.doc,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={styles.attachButton}
            disabled={uploading}
          >
            {uploading ? '⏳' : '📎'}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос или введите текст для анализа..."
            className={styles.input}
            rows={2}
            disabled={loading}
          />
          <button 
            onClick={sendMessage} 
            className={styles.sendButton}
            disabled={loading || !input.trim()}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </div>
        <div className={styles.inputHint}>
          {currentSession && (
            <span className={styles.sessionContext}>
              {currentSession.context_string || 'Общий диалог'}
            </span>
          )}
          <span className={styles.fileHint}>
            Поддерживаются PDF, DOCX, TXT
          </span>
        </div>
      </div>
    </div>
  );
};

// Сервис для работы с чатом
class ChatService {
  async getSessions() {
    const response = await baseService.get('/api/ai/chat/');
    return response.data;
  }

  async createSession(data) {
    const response = await baseService.post('/api/ai/chat/', data);
    return response.data;
  }

  async getSession(id) {
    const response = await baseService.get(`/api/ai/chat/${id}/`);
    return response.data;
  }

  async sendMessage(sessionId, message, files) {
    const formData = new FormData();
    formData.append('message', message);
    if (files) {
      files.forEach(file => formData.append('files', file));
    }
    const response = await baseService.post(
      `/api/ai/chat/${sessionId}/send_message/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  async archiveSession(id) {
    await baseService.post(`/api/ai/chat/${id}/archive/`);
  }

  async clearMessages(id) {
    await baseService.post(`/api/ai/chat/${id}/clear_messages/`);
  }
}

export default AIAssistantUniversal;