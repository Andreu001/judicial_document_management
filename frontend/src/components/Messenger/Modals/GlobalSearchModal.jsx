// communication-frontend/src/components/Messenger/Modals/GlobalSearchModal.jsx
import React, { useState, useEffect } from 'react';
import { useMessenger } from '../context/MessengerContext';
import styles from '../MessengerApp.module.css';

const GlobalSearchModal = ({ onClose }) => {
  const { searchMessages, searchResults, searchLoading, openChat, chats } = useMessenger();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => searchMessages(query), 400);
      return () => clearTimeout(timer);
    }
  }, [query, searchMessages]);

  const handleResultClick = async (result) => {
    const chat = chats.find(c => c.id === result.chat_id);
    if (chat) {
      await openChat(chat);
      onClose();
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ width: 520 }}>
        <div className={styles.modalHeader}>
          <span>Поиск сообщений</span>
          <button className={styles.closePanelBtn} onClick={onClose}>&#x2715;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <input
              className={styles.formInput}
              placeholder="Введите текст для поиска..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.searchResults}>
            {searchLoading && <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Поиск...</div>}

            {searchResults && !searchLoading && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                {query.trim().length < 2 ? 'Введите минимум 2 символа' : 'Ничего не найдено'}
              </div>
            )}

            {searchResults?.map((r, idx) => (
              <div
                key={`${r.message_id}-${idx}`}
                className={styles.searchResultItem}
                onClick={() => handleResultClick(r)}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2b5278' }}>{r.chat_title}</div>
                  <div style={{ fontSize: 13 }}>
                    <b>{r.sender_name}</b>: {r.text_content?.substring(0, 100)}
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>{formatTime(r.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
