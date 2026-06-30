// communication-frontend/src/components/Messenger/Chat/ChatView.jsx
import React, { useState, useRef, useCallback } from 'react';
import { useMessenger } from '../context/MessengerContext';
import wsService from '../services/websocketService';
import styles from '../MessengerApp.module.css';

// SVG иконки
const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5.5 1.5L1.5 7.5H4.5L4 11L8 6.5H6.5L9.5 2.5L5.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M8.5 1.5L10.5 3.5M2 8L8 2L10 4L4 10H2V8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconDelete = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4.5 1.5H7.5M2 3H10M9.5 3L9 10C9 10.2761 8.77614 10.5 8.5 10.5H3.5C3.22386 10.5 3 10.2761 3 10L2.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconAttach = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M9 4.5V9.5C9 10.8807 7.88071 12 6.5 12C5.11929 12 4 10.8807 4 9.5V4.5C4 2.84315 5.34315 1.5 7 1.5C8.65685 1.5 10 2.84315 10 4.5V9.5C10 11.7091 8.20914 13.5 6 13.5C3.79086 13.5 2 11.7091 2 9.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 8L15 1L8 15L5 11L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconTask = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 6L7 8L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDocument = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 2.5H10L12.5 5V13.5C12.5 14.0523 12.0523 14.5 11.5 14.5H4.5C3.94772 14.5 3.5 14.0523 3.5 13.5V3.5C3.5 2.94772 3.94772 2.5 4 2.5Z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M7 8H10M7 10.5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconLeave = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3.5V1.5H12.5V14.5H6V12.5M9 8H1.5M1.5 8L4.5 5M1.5 8L4.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ==================== Message Bubble ====================
const MessageBubble = ({ msg, isOwn, showAvatar, showSender }) => {
  const { editMessage, deleteMessage, togglePinMessage } = useMessenger();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (msg.is_deleted) {
    return (
      <div className={`${styles.msgWrapper} ${isOwn ? styles.own : styles.other}`}>
        <div className={styles.msgContent}>
          <div className={`${styles.msgBubble} ${styles.deleted}`}>Сообщение удалено</div>
          <div className={`${styles.msgTime} ${isOwn ? styles.ownTime : styles.otherTime}`}>
            {formatTime(msg.created_at)}
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => { setEditing(true); setEditText(msg.text); };
  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== msg.text) {
      try { await editMessage(msg.id, editText); } catch (e) { alert('Не удалось редактировать сообщение'); }
    }
    setEditing(false);
  };
  const handleDelete = async () => {
    try { await deleteMessage(msg.id); } catch (e) { alert('Не удалось удалить сообщение'); }
    setShowDeleteConfirm(false);
  };
  const handlePin = () => { togglePinMessage(msg.id, msg.is_pinned); };

  return (
    <>
      <div className={`${styles.msgWrapper} ${isOwn ? styles.own : styles.other}`}>
        {!isOwn && (showAvatar ? (
          <div className={styles.msgAvatar}>{msg.sender?.name?.charAt(0) || '?'}</div>
        ) : <div style={{ width: 32 }} />)}
        <div className={styles.msgContent} style={isOwn ? { alignItems: 'flex-end' } : {}}>
          {!isOwn && showSender && <div className={styles.msgSender}>{msg.sender?.name || 'Неизвестный'}</div>}

          {msg.reply_to_preview && (
            <div className={styles.replyPreview}>↩ {msg.reply_to_preview.sender_name}: {msg.reply_to_preview.text}</div>
          )}
          {msg.forward_from_preview && (
            <div className={styles.forwardPreview}>↪ Переслано из {msg.forward_from_preview.chat_title}</div>
          )}

          <div
            className={`${styles.msgBubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            <div className={styles.msgActions}>
              {isOwn && (
                <button className={styles.msgActionBtn} onClick={handleEdit} title="Редактировать">
                  <IconEdit />
                </button>
              )}
              <button className={styles.msgActionBtn} onClick={() => setShowDeleteConfirm(true)} title="Удалить">
                <IconDelete />
              </button>
              <button className={styles.msgActionBtn} onClick={handlePin} title="Закрепить">
                <IconPin />
              </button>
            </div>

            {editing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: '100%', minWidth: 200, padding: 6, borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  autoFocus
                />
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={handleSaveEdit} style={{ marginRight: 8 }}>Сохранить</button>
                  <button className={styles.btnSecondary + ' ' + styles.btnSmall} onClick={() => setEditing(false)}>Отмена</button>
                  <span style={{ marginLeft: 8 }}>Enter — сохранить, Esc — отмена</span>
                </div>
              </div>
            ) : (
              <div>{msg.text}</div>
            )}

            {msg.attachments?.map(att => (
              <div key={att.id} className={styles.attachmentCard}>
                <span className={styles.attachmentIcon}>📄</span>
                <div className={styles.attachmentInfo}>
                  <div className={styles.attachmentName}>{att.original_filename}</div>
                  <div className={styles.attachmentSize}>{(att.file_size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}

            {msg.task_info && (
              <div style={{ marginTop: 8, padding: 8, background: 'var(--accent-light)', borderRadius: 6, fontSize: 12 }}>
                <strong>Задача:</strong> {msg.task_info.title}<br/>
                Статус: {msg.task_info.status_display}
                {msg.task_info.deadline && <> | Срок: {new Date(msg.task_info.deadline).toLocaleDateString()}</>}
              </div>
            )}

            <div className={`${styles.msgTime} ${isOwn ? styles.ownTime : styles.otherTime}`}>
              {msg.is_edited && <span className={styles.editedMark}>изм.</span>}
              {formatTime(msg.created_at)}
              {isOwn && msg.read_by?.length > 0 && <span className={styles.readStatus}>✓✓</span>}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>Удалить сообщение?</div>
            <div className={styles.confirmText}>Это действие нельзя отменить. Сообщение будет удалено для всех участников чата.</div>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary + ' ' + styles.btn} onClick={() => setShowDeleteConfirm(false)}>Отмена</button>
              <button className={styles.btnDanger + ' ' + styles.btn} onClick={handleDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==================== Message List ====================
const MessageList = ({ messages }) => {
  const { messagesEndRef, typingUsers, activeChat } = useMessenger();

  if (!messages || messages.length === 0) {
    return (
      <div className={styles.messageList}>
        <div className={styles.emptyChat}>
          <div className={styles.emptyChatIcon}>💬</div>
          <div>Нет сообщений. Начните общение!</div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  let lastDate = null;
  let lastSender = null;

  return (
    <div className={styles.messageList}>
      {messages.filter(m => m.is_pinned).map(msg => (
        <div key={`pin-${msg.id}`} className={styles.pinnedLabel}>📌 Закреплённое сообщение: {msg.text?.substring(0, 60)}</div>
      ))}

      {messages.map((msg) => {
        const msgDate = new Date(msg.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        const showDate = msgDate !== lastDate;
        lastDate = msgDate;

        const isOwn = msg.sender?.id === parseInt(localStorage.getItem('userId') || '0');
        const showAvatar = !isOwn && msg.sender?.id !== lastSender;
        const showSender = !isOwn && msg.sender?.id !== lastSender;
        lastSender = msg.sender?.id;

        return (
          <React.Fragment key={msg.id}>
            {showDate && <div className={styles.dateDivider}>{msgDate}</div>}
            <MessageBubble msg={msg} isOwn={isOwn} showAvatar={showAvatar} showSender={showSender} />
          </React.Fragment>
        );
      })}

      {typingUsers[activeChat?.id] && (
        <div className={styles.typingIndicator}>
          {typingUsers[activeChat.id].userName} печатает
          <span className={styles.typingDots}>
            <span className={styles.typingDot} /><span className={styles.typingDot} /><span className={styles.typingDot} />
          </span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

// ==================== Message Input ====================
const MessageInput = ({ chatId, replyTo, onCancelReply }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const { sendMessage, uploadAttachments } = useMessenger();

  const handleSend = async () => {
    if (!chatId || (!text.trim() && attachments.length === 0)) return;
    try {
      await sendMessage(chatId, text, attachments, replyTo);
      setText('');
      setAttachments([]);
      if (onCancelReply) onCancelReply();
    } catch (e) { console.error(e); }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadAttachments(files);
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (e) { console.error(e); }
    setUploading(false);
    e.target.value = '';
  };

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTyping = () => {
    wsService.sendTyping();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 3000);
  };

  return (
    <div className={styles.inputArea}>
      {replyTo && (
        <div className={styles.replyPreview} style={{ marginBottom: 8 }}>
          ↩ Ответ на сообщение
          <button onClick={onCancelReply} style={{ marginLeft: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className={styles.attachmentPreviews}>
          {attachments.map((att, idx) => (
            <div key={idx} className={styles.attachmentPreview}>
              {att.file_type === 'image' ? <img src={att.url} alt="" /> : <span>📄</span>}
              <button className={styles.removeAttachment} onClick={() => removeAttachment(idx)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputRow}>
        <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <IconAttach />
        </button>
        <input type="file" ref={fileInputRef} multiple onChange={handleFileSelect} style={{ display: 'none' }} />

        <textarea
          className={styles.inputBox}
          placeholder="Написать сообщение..."
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim() && attachments.length === 0}>
          <IconSend />
        </button>
      </div>
    </div>
  );
};

// ==================== Chat Header ====================
const ChatHeader = ({ chat, onNewTask, onDocumentExchange }) => {
  const { setRightPanel, rightPanel, togglePinChat, leaveChat, loadChats, setActiveChat } = useMessenger();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const getSubtitle = () => {
    switch (chat.chat_type) {
      case 'direct': return 'Личные сообщения';
      case 'group': return `${chat.member_count || '?'} участников`;
      case 'department': return `Отдел: ${chat.title || ''}`;
      case 'court_channel': return 'Служебный канал';
      case 'intercourt': 
        const courtName = chat.target_court_name || chat.court_info?.target_court_name || '';
        return `Межсудебный: ${courtName}`;
      case 'interregional': 
        const regionName = chat.court_info?.target_region_name || '';
        return `Межрегиональный: ${regionName}`;
      case 'higher_instance': return 'Чат с вышестоящей инстанцией';
      default: return '';
    }
  };

  const handleTogglePin = async () => {
    try { await togglePinChat(chat.id); await loadChats(); } catch (e) { console.error(e); }
  };

  const handleLeaveChat = async () => {
    try {
      await leaveChat(chat.id);
      await loadChats();
      setActiveChat(null);
      setShowLeaveConfirm(false);
    } catch (e) {
      console.error('Leave chat error:', e);
      alert('Не удалось покинуть чат: ' + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderInfo} onClick={() => setRightPanel(rightPanel === 'info' ? null : 'info')}>
        <div className={styles.chatAvatar} style={{ width: 40, height: 40, fontSize: 14 }}>
          {(chat.title || 'Ч').charAt(0)}
        </div>
        <div>
          <div className={styles.chatHeaderTitle}>{chat.title || 'Без названия'}</div>
          <div className={styles.chatHeaderSubtitle}>{getSubtitle()}</div>
        </div>
      </div>
      <div className={styles.chatHeaderActions}>
        <button className={`${styles.headerBtn} ${chat.is_pinned ? styles.active : ''}`} onClick={handleTogglePin} title={chat.is_pinned ? 'Открепить чат' : 'Закрепить чат'}>
          <IconPin />
        </button>
        <button className={styles.headerBtn} onClick={onNewTask} title="Поручение"><IconTask /></button>
        <button className={styles.headerBtn} onClick={onDocumentExchange} title="Межсудебный обмен"><IconDocument /></button>
        <button className={styles.headerBtn} title="Поиск в чате"><IconSearch /></button>
        <button className={`${styles.headerBtn} ${styles.dangerBtn}`} onClick={() => setShowLeaveConfirm(true)} title="Покинуть чат">
          <IconLeave />
        </button>
      </div>

      {showLeaveConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowLeaveConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>Покинуть чат?</div>
            <div className={styles.confirmText}>
              Вы уверены, что хотите покинуть чат "{chat.title || 'Без названия'}"?
              {chat.chat_type === 'direct' && ' Личный чат будет удалён.'}
              {chat.chat_type === 'group' && ' Вы перестанете получать сообщения из этого чата.'}
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.btnSecondary + ' ' + styles.btn} onClick={() => setShowLeaveConfirm(false)}>Отмена</button>
              <button className={styles.btnDanger + ' ' + styles.btn} onClick={handleLeaveChat}>Покинуть чат</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ChatView ====================
const ChatView = ({ onNewTask, onDocumentExchange }) => {
  const { activeChat, messages } = useMessenger();
  const [replyTo, setReplyTo] = useState(null);

  if (!activeChat) {
    return (
      <div className={styles.chatView}>
        <div className={styles.emptyChat}>
          <div className={styles.emptyChatIcon}>💬</div>
          <div>Выберите чат для начала общения</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Или создайте новый чат через боковую панель</div>
        </div>
      </div>
    );
  }

  const chatMessages = [...(messages[activeChat.id] || [])].reverse();

  return (
    <div className={styles.chatView}>
      <ChatHeader chat={activeChat} onNewTask={onNewTask} onDocumentExchange={onDocumentExchange} />
      <MessageList messages={chatMessages} />
      <MessageInput chatId={activeChat.id} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  );
};

export default ChatView;