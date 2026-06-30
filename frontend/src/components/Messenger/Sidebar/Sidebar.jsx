// communication-frontend/src/components/Messenger/Sidebar/Sidebar.jsx
import React, { useState, useMemo } from 'react';
import { useMessenger } from '../context/MessengerContext';
import styles from '../MessengerApp.module.css';

// SVG иконки
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconBroadcast = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 7C1 3.68629 3.68629 1 7 1C10.3137 1 13 3.68629 13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 7C3 4.79086 4.79086 3 7 3C9.20914 3 11 4.79086 11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5.5 1.5L1.5 7.5H4.5L4 11L8 6.5H6.5L9.5 2.5L5.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconMute = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5 2L2.5 4.5H1V7.5H2.5L5 10V2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M8 4L10 6M10 4L8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconLeave = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4 2.5V0.5H10.5V11.5H4V9.5M7 6H0.5M0.5 6L3.5 3M0.5 6L3.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChatListItem = ({ chat, isActive, onClick }) => {
  const { unreadCounts, togglePinChat, toggleMuteChat, leaveChat, loadChats } = useMessenger();
  const unread = unreadCounts[chat.id] || chat.unread_count || 0;

  const getAvatar = () => {
    const type = chat.chat_type;
    if (type === 'direct') {
      const members = chat.member_info || [];
      const name = members[0]?.name || '?';
      return name.charAt(0).toUpperCase();
    }
    if (type === 'group' || type === 'department') return (chat.title || 'Г').charAt(0).toUpperCase();
    if (type === 'court_channel') return '#';
    if (type === 'intercourt' || type === 'interregional') return '⇄';
    return '?';
  };

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    try {
      await togglePinChat(chat.id);
      await loadChats();
    } catch (err) {
      console.error('Toggle pin error:', err);
    }
  };

  const handleToggleMute = async (e) => {
    e.stopPropagation();
    try {
      await toggleMuteChat(chat.id);
      await loadChats();
    } catch (err) {
      console.error('Toggle mute error:', err);
    }
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Вы уверены, что хотите покинуть чат "${chat.title || 'Без названия'}"?`)) {
      try {
        await leaveChat(chat.id);
        await loadChats();
      } catch (err) {
        console.error('Leave chat error:', err);
        alert('Не удалось покинуть чат: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getTitle = () => {
    if (chat.chat_type === 'direct' && chat.member_info) {
      return chat.member_info.map(m => m.name).join(', ');
    }
    if (chat.chat_type === 'intercourt' || chat.chat_type === 'interregional' || chat.chat_type === 'higher_instance') {
      if (chat.target_court_name) {
        return chat.target_court_name;
      }
      if (chat.court_info?.target_court_name) {
        return chat.court_info.target_court_name;
      }
    }
    return chat.custom_title || chat.title || 'Без названия';
  };

  const getAvatarClass = () => {
    const type = chat.chat_type;
    if (type === 'court_channel') return styles.channel;
    if (type === 'intercourt' || type === 'interregional' || type === 'higher_instance') return styles.intercourt;
    if (type === 'group' || type === 'department') return styles.group;
    return '';
  };

  const preview = chat.last_message_preview;
  const time = preview?.created_at ? new Date(preview.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div
      className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={`${styles.chatAvatar} ${getAvatarClass()}`}>{getAvatar()}</div>
      <div className={styles.chatItemBody}>
        <div className={styles.chatItemTop}>
          <span className={styles.chatItemTitle}>{getTitle()}</span>
          <span className={styles.chatItemMeta}>{time}</span>
        </div>
        <div className={styles.chatItemBottom}>
          <span className={styles.chatItemPreview}>
            {chat.is_pinned && <span className={styles.badge}>📌</span>}
            {chat.is_muted && <span className={styles.badge}>🔇</span>}
            {chat.chat_type === 'intercourt' && <span className={styles.badge}>⇄ </span>}
            {preview ? `${preview.sender_name}: ${preview.text}` : 'Нет сообщений'}
          </span>
          {unread > 0 && <span className={styles.unreadBadge}>{unread}</span>}
        </div>
      </div>
      <div className={styles.chatItemActions}>
        <button className={styles.chatItemActionBtn} onClick={handleTogglePin} title={chat.is_pinned ? 'Открепить' : 'Закрепить'}>
          <IconPin />
        </button>
        <button className={styles.chatItemActionBtn} onClick={handleToggleMute} title={chat.is_muted ? 'Включить уведомления' : 'Отключить уведомления'}>
          <IconMute />
        </button>
        <button className={`${styles.chatItemActionBtn} ${styles.dangerAction}`} onClick={handleLeave} title="Покинуть чат">
          <IconLeave />
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ onNewChat, onBroadcast, onSearch }) => {
  const { chats, activeChat, openChat } = useMessenger();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filteredChats = useMemo(() => {
    let filtered = chats;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.member_info || []).some(m => m.name.toLowerCase().includes(q)) ||
        (c.target_court_name || '').toLowerCase().includes(q)
      );
    }
    switch (tab) {
      case 'unread': return filtered.filter(c => (c.unread_count || 0) > 0);
      case 'groups': return filtered.filter(c => ['group', 'department'].includes(c.chat_type));
      case 'channels': return filtered.filter(c => c.chat_type === 'court_channel');
      default: return filtered;
    }
  }, [chats, search, tab]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarActions}>
          <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={onNewChat}>
            <IconPlus /> Новый чат
          </button>
          <button className={styles.btnSecondary + ' ' + styles.btnSmall} onClick={onBroadcast}>
            <IconBroadcast /> Рассылка
          </button>
          <button className={styles.btnSecondary + ' ' + styles.btnSmall} onClick={onSearch}>
            <IconSearch />
          </button>
        </div>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            className={styles.searchBox}
            placeholder="Поиск чатов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.sidebarTabs}>
        <button className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`} onClick={() => setTab('all')}>Все</button>
        <button className={`${styles.tab} ${tab === 'unread' ? styles.active : ''}`} onClick={() => setTab('unread')}>Непрочитанные</button>
        <button className={`${styles.tab} ${tab === 'groups' ? styles.active : ''}`} onClick={() => setTab('groups')}>Группы</button>
        <button className={`${styles.tab} ${tab === 'channels' ? styles.active : ''}`} onClick={() => setTab('channels')}>Каналы</button>
      </div>

      <div className={styles.chatList}>
        {filteredChats.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? 'Ничего не найдено' : 'Нет чатов'}
          </div>
        )}
        {filteredChats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => openChat(chat)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;