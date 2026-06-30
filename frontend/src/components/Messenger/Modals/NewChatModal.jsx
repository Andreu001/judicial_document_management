import React, { useState } from 'react';
import { useMessenger } from '../context/MessengerContext';
import { chatService } from '../services/messengerService';
import IntercourtCourtSelector from './IntercourtCourtSelector';
import styles from './NewChatModal.module.css';

const NewChatModal = ({ onClose }) => {
  const { createChat, loadChats } = useMessenger();
  const [chatType, setChatType] = useState('direct');
  const [title, setTitle] = useState('');
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [showCourtSelector, setShowCourtSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (chatType === 'intercourt' && !selectedCourt) {
      alert('Выберите суд для межсудебного чата');
      return;
    }

    setLoading(true);
    try {
      const data = {
        chat_type: chatType,
        title: title || (chatType === 'intercourt' ? 'Межсудебный чат' : 'Чат'),
      };

      if (chatType === 'intercourt' && selectedCourt) {
        data.target_court_code = selectedCourt.code;
      }

      const newChat = await createChat(data);
      await loadChats();
      
      // Открываем созданный чат, если он есть
      if (newChat && newChat.id) {
        // Просто обновляем список чатов и закрываем модалку
        // Пользователь сам выберет чат из списка
        onClose();
      } else {
        onClose();
      }
    } catch (e) {
      console.error('Create chat error:', e);
      alert('Ошибка создания чата: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Новый чат</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label>Тип чата</label>
            <select 
              className={styles.select}
              value={chatType}
              onChange={(e) => {
                setChatType(e.target.value);
                if (e.target.value !== 'intercourt') {
                  setSelectedCourt(null);
                }
              }}
            >
              <option value="direct">Личный чат</option>
              <option value="group">Групповой чат</option>
              <option value="intercourt">Межсудебный чат</option>
            </select>
          </div>

          {chatType === 'intercourt' && (
            <div className={styles.formGroup}>
              <label>Суд-корреспондент</label>
              <div className={styles.courtSelector}>
                {selectedCourt ? (
                  <div className={styles.selectedCourt}>
                    <span className={styles.courtName}>
                      {selectedCourt.name_short || selectedCourt.name}
                    </span>
                    <span className={styles.courtCode}>({selectedCourt.code})</span>
                    <button 
                      className={styles.changeBtn}
                      onClick={() => setShowCourtSelector(true)}
                    >
                      Изменить
                    </button>
                  </div>
                ) : (
                  <button 
                    className={styles.selectCourtBtn}
                    onClick={() => setShowCourtSelector(true)}
                  >
                    Выбрать суд
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Название чата (опционально)</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название..."
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          <button 
            className={styles.createBtn} 
            onClick={handleCreate}
            disabled={loading || (chatType === 'intercourt' && !selectedCourt)}
          >
            {loading ? 'Создание...' : 'Создать чат'}
          </button>
        </div>

        {showCourtSelector && (
          <IntercourtCourtSelector
            onSelect={(court) => {
              setSelectedCourt(court);
              setShowCourtSelector(false);
            }}
            onClose={() => setShowCourtSelector(false)}
          />
        )}
      </div>
    </div>
  );
};

export default NewChatModal;