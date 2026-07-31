// src/components/AIAssistant/AIAssistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import baseService from '../../API/baseService';
import styles from './AIAssistant.module.css';

const AIAssistant = ({ caseId, caseType, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const messagesEndRef = useRef(null);

  // Создание сессии
  useEffect(() => {
    createSession();
  }, []);

  // Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createSession = async () => {
    try {
      const response = await baseService.post('/api/ai/sessions/', {
        session_type: caseId ? 'case_analysis' : 'general',
        title: caseId ? `Анализ дела ${caseId}` : 'Новая сессия',
        case_content_type: caseType ? getContentType(caseType) : null,
        case_object_id: caseId || null,
      });
      setSessionId(response.data.id);
    } catch (error) {
      console.error('Ошибка создания сессии:', error);
    }
  };

  const getContentType = (type) => {
    const types = {
      criminal: 'criminal_proceedings.criminalproceedings',
      civil: 'civil_proceedings.civilproceedings',
      coap: 'administrative_code.administrativeproceedings',
      kas: 'administrative_proceedings.kasproceedings',
    };
    return types[type] || null;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (sessionId) {
        // Отправка в сессии
        const response = await baseService.post(`/api/ai/sessions/${sessionId}/send_message/`, {
          message: userMessage
        });
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message.content 
        }]);
      } else {
        // Прямой запрос к анализу
        const response = await baseService.post('/api/ai/analysis/analyze_case/', {
          case_type: caseType,
          case_id: caseId,
          analysis_type: 'full'
        });
        setAnalysisResult(response.data);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.raw_response || 'Анализ завершен'
        }]);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ошибка: ' + (error.response?.data?.error || error.message)
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const analyzeCase = async (type = 'full') => {
    if (!caseId || !caseType) return;

    setLoading(true);
    try {
      const response = await baseService.post('/api/ai/analysis/analyze_case/', {
        case_type: caseType,
        case_id: caseId,
        analysis_type: type
      });
      setAnalysisResult(response.data);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.raw_response || 'Анализ завершен'
      }]);
    } catch (error) {
      console.error('Ошибка анализа:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Ошибка анализа: ' + (error.response?.data?.error || error.message)
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>🤖 AI Ассистент</h3>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        )}
      </div>

      {/* Быстрые действия */}
      {caseId && caseType && (
        <div className={styles.quickActions}>
          <button onClick={() => analyzeCase('full')} className={styles.quickButton}>
            Полный анализ
          </button>
          <button onClick={() => analyzeCase('decision_check')} className={styles.quickButton}>
            Проверить решение
          </button>
          <button onClick={() => analyzeCase('stage_recommendation')} className={styles.quickButton}>
            Рекомендации
          </button>
          <button onClick={() => analyzeCase('deadline_check')} className={styles.quickButton}>
            Проверить сроки
          </button>
        </div>
      )}

      {/* Результаты анализа */}
      {analysisResult && (
        <div className={styles.analysisResult}>
          {analysisResult.compliance_score && (
            <div className={styles.score}>
              Оценка соответствия: {analysisResult.compliance_score}/10
            </div>
          )}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h4>Рекомендации:</h4>
              <ul>
                {analysisResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
          {analysisResult.violations && analysisResult.violations.length > 0 && (
            <div className={styles.violations}>
              <h4>Нарушения:</h4>
              <ul>
                {analysisResult.violations.map((viol, i) => (
                  <li key={i}>⚠️ {viol}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Сообщения */}
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.messageRole}>
              {msg.role === 'user' ? '👤 Вы' : '🤖 AI'}
            </div>
            <div className={styles.messageContent}>
              {msg.content.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Задайте вопрос AI ассистенту..."
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
    </div>
  );
};

export default AIAssistant;