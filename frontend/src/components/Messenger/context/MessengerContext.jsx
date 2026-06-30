import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  chatService, messageService, broadcastService,
  taskService, documentExchangeService, searchService, dashboardService,
  attachmentService, intercourtService,
} from '../services/messengerService';
import wsService from '../services/websocketService';

const MessengerContext = createContext(null);
export const useMessenger = () => {
  const ctx = useContext(MessengerContext);
  if (!ctx) throw new Error('useMessenger must be inside MessengerProvider');
  return ctx;
};

export const MessengerProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rightPanel, setRightPanel] = useState(null);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [taskMode, setTaskMode] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const loadedChats = useRef(new Set());
  const wsInitialized = useRef(false);

  // ==================== Загрузка чатов ====================
  const loadChats = useCallback(async () => {
    try {
      const res = await chatService.list();
      setChats(res.data);
      return res.data;
    } catch (e) {
      console.error('Load chats error:', e);
      return [];
    }
  }, []);

  // ==================== Создание чата ====================
  const createChat = useCallback(async (data) => {
    try {
      const res = await chatService.create(data);
      setChats(prev => [res.data, ...prev]);
      return res.data;
    } catch (e) {
      console.error('Create chat error:', e);
      throw e;
    }
  }, []);

  // ==================== Поиск судов для межсудебного чата ====================
  const searchIntercourtCourts = useCallback(async (query, regionId = null, levelCode = null) => {
    setSearchLoading(true);
    try {
      const params = { q: query };
      if (regionId) params.region = regionId;
      if (levelCode) params.level = levelCode;
      const res = await intercourtService.searchCourts(params);
      return res.data;
    } catch (e) {
      console.error('Search intercourt courts error:', e);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ==================== Загрузка дашборда ====================
  const loadDashboard = useCallback(async () => {
    try {
      const res = await dashboardService.get();
      setDashboard(res.data);
    } catch (e) {
      console.error('Dashboard error:', e);
    }
  }, []);

  // ==================== Загрузка сообщений чата ====================
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const res = await messageService.list(chatId);
      setMessages(prev => ({ ...prev, [chatId]: res.data }));
      loadedChats.current.add(chatId);
      return res.data;
    } catch (e) {
      console.error('Load messages error:', e);
    }
  }, []);

  // ==================== Открытие чата ====================
  const openChat = useCallback(async (chat) => {
    // Проверяем, что чат существует и имеет ID
    if (!chat || !chat.id) {
      console.error('Cannot open chat: invalid chat object', chat);
      return;
    }

    setActiveChat(chat);
    setBroadcastMode(false);
    setTaskMode(false);

    wsService.switchChat(chat.id);

    if (!loadedChats.current.has(chat.id)) {
      await loadMessages(chat.id);
    }

    try {
      await chatService.markRead(chat.id);
      setUnreadCounts(prev => ({ ...prev, [chat.id]: 0 }));
    } catch (e) {
      console.warn('Mark read error:', e);
    }

    return chat;
  }, [loadMessages]);

  // ==================== Отправка сообщения ====================
  const sendMessage = useCallback(async (chatId, text, attachments = [], replyTo = null) => {
    // Проверяем, что chatId передан
    if (!chatId) {
      console.error('Cannot send message: chatId is missing');
      throw new Error('chatId is required');
    }

    try {
      // Получаем ID вложений, фильтруем undefined
      const attachmentIds = attachments
        .map(a => a.id)
        .filter(id => id !== undefined && id !== null);

      // Формируем payload
      const payload = {
        chat: chatId,
        text: text || '',
        message_type: 'text',
      };

      if (replyTo) {
        payload.reply_to_id = replyTo;
      }

      if (attachmentIds.length > 0) {
        payload.attachment_ids = attachmentIds;
      }

      const res = await messageService.create(payload);

      const newMsg = res.data;

      if (attachments.length > 0) {
        newMsg.attachments = attachments;
      }

      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg],
      }));

      setChats(prev => {
        const updated = prev.map(c =>
          c.id === chatId
            ? {
                ...c,
                last_message_preview: {
                  text: text || (attachments.length > 0 ? '📎 Вложение' : ''),
                  sender_name: 'Вы',
                  created_at: new Date().toISOString()
                },
                last_message_at: new Date().toISOString()
              }
            : c
        );
        const chat = updated.find(c => c.id === chatId);
        return [chat, ...updated.filter(c => c.id !== chatId)];
      });

      return newMsg;
    } catch (e) {
      console.error('Send message error:', e);
      throw e;
    }
  }, []);

  // ==================== Редактирование сообщения ====================
  const editMessage = useCallback(async (messageId, text) => {
    try {
      const res = await messageService.edit(messageId, { text });
      const updated = res.data;
      setMessages(prev => {
        const newMsgs = { ...prev };
        Object.keys(newMsgs).forEach(chatId => {
          newMsgs[chatId] = newMsgs[chatId].map(m =>
            m.id === messageId ? { ...m, text, is_edited: true, edited_at: updated.edited_at } : m
          );
        });
        return newMsgs;
      });
    } catch (e) {
      console.error('Edit error:', e);
    }
  }, []);

  // ==================== Удаление сообщения ====================
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await messageService.delete(messageId);
      setMessages(prev => {
        const newMsgs = { ...prev };
        Object.keys(newMsgs).forEach(chatId => {
          newMsgs[chatId] = newMsgs[chatId].map(m =>
            m.id === messageId ? { ...m, is_deleted: true, text: 'Сообщение удалено' } : m
          );
        });
        return newMsgs;
      });
    } catch (e) {
      console.error('Delete error:', e);
    }
  }, []);

  // ==================== Закрепление сообщения ====================
  const togglePinMessage = useCallback(async (messageId, currentlyPinned) => {
    try {
      if (currentlyPinned) {
        await messageService.unpin(messageId);
      } else {
        await messageService.pin(messageId);
      }
      setMessages(prev => {
        const newMsgs = { ...prev };
        Object.keys(newMsgs).forEach(chatId => {
          newMsgs[chatId] = newMsgs[chatId].map(m =>
            m.id === messageId ? { ...m, is_pinned: !currentlyPinned } : m
          );
        });
        return newMsgs;
      });
    } catch (e) {
      console.error('Pin error:', e);
    }
  }, []);

  // ==================== Загрузка вложений ====================
  const uploadAttachments = useCallback(async (files) => {
    try {
      const res = await attachmentService.uploadMultiple(files);
      return res.data;
    } catch (e) {
      console.error('Upload error:', e);
      return [];
    }
  }, []);

  // ==================== Поиск ====================
  const searchMessages = useCallback(async (query, chatId = null) => {
    setSearchLoading(true);
    try {
      const params = { q: query };
      if (chatId) params.chat = chatId;
      const res = await messageService.search(params);
      setSearchResults(res.data);
      return res.data;
    } catch (e) {
      console.error('Search error:', e);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ==================== Поручения ====================
  const loadMyTasks = useCallback(async () => {
    try {
      const res = await taskService.my();
      setTasks(res.data);
    } catch (e) {
      console.error('Tasks error:', e);
    }
  }, []);

  const createTask = useCallback(async (data) => {
    try {
      const res = await taskService.create(data);
      setTasks(prev => [res.data, ...prev]);
      return res.data;
    } catch (e) {
      console.error('Create task error:', e);
      throw e;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId, action, reason = '') => {
    try {
      let res;
      switch (action) {
        case 'accept': res = await taskService.accept(taskId); break;
        case 'start': res = await taskService.start(taskId); break;
        case 'complete': res = await taskService.complete(taskId); break;
        case 'reject': res = await taskService.reject(taskId, reason); break;
        default: return;
      }
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (e) {
      console.error('Task update error:', e);
    }
  }, []);

  // ==================== Рассылки ====================
  const loadBroadcasts = useCallback(async () => {
    try {
      const res = await broadcastService.list();
      setBroadcasts(res.data);
    } catch (e) {
      console.error('Broadcasts error:', e);
    }
  }, []);

  const sendBroadcast = useCallback(async (data) => {
    try {
      const res = await broadcastService.create(data);
      setBroadcasts(prev => [res.data, ...prev]);
      return res.data;
    } catch (e) {
      console.error('Broadcast error:', e);
      throw e;
    }
  }, []);

  const togglePinChat = useCallback(async (chatId) => {
  try {
    const res = await chatService.togglePin(chatId);
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, is_pinned: res.data.is_pinned } : c
    ));
    return res.data;
  } catch (e) {
    console.error('Toggle pin error:', e);
    throw e;
  }
}, []);

  const leaveChat = useCallback(async (chatId) => {
    try {
      await chatService.leave(chatId);
      // Удаляем чат из списка
      setChats(prev => prev.filter(c => c.id !== chatId));
      // Очищаем сообщения чата
      setMessages(prev => {
        const newMsgs = { ...prev };
        delete newMsgs[chatId];
        return newMsgs;
      });
      // Если этот чат был активным, сбрасываем активный чат
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      return true;
    } catch (e) {
      console.error('Leave chat error:', e);
      throw e;
    }
  }, [activeChat]);

  // ==================== WebSocket ИНИЦИАЛИЗАЦИЯ ====================
  useEffect(() => {
    if (!wsInitialized.current) {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('[Context] Initializing WebSocket...');
        wsService.connect(null, token);
        wsInitialized.current = true;
      }
    }

  }, []);

  // ==================== WebSocket handlers ====================
  useEffect(() => {
    wsService.onChat('chat.message', (data) => {
      const msg = data.message;
      if (!activeChat || msg.chat_id !== activeChat.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.chat_id]: (prev[msg.chat_id] || 0) + 1,
        }));
        loadChats();
        return;
      }
      setMessages(prev => ({
        ...prev,
        [msg.chat_id]: [...(prev[msg.chat_id] || []), msg],
      }));
    });

    wsService.onChat('chat.message_edited', (data) => {
      setMessages(prev => {
        const newMsgs = { ...prev };
        Object.keys(newMsgs).forEach(chatId => {
          newMsgs[chatId] = newMsgs[chatId].map(m =>
            m.id === data.message_id ? {
              ...m, text: data.text, is_edited: true,
              edited_at: data.edited_at, edit_history: data.edit_history
            } : m
          );
        });
        return newMsgs;
      });
    });

    wsService.onChat('chat.message_deleted', (data) => {
      setMessages(prev => {
        const newMsgs = { ...prev };
        Object.keys(newMsgs).forEach(chatId => {
          newMsgs[chatId] = newMsgs[chatId].map(m =>
            m.id === data.message_id ? { ...m, is_deleted: true, text: 'Сообщение удалено' } : m
          );
        });
        return newMsgs;
      });
    });

    wsService.onChat('chat.typing', (data) => {
      if (activeChat) {
        setTypingUsers(prev => ({
          ...prev,
          [activeChat.id]: { userId: data.user_id, userName: data.user_name, ts: Date.now() },
        }));
        setTimeout(() => {
          setTypingUsers(prev => {
            const entry = prev[activeChat.id];
            if (entry && Date.now() - entry.ts > 4000) {
              const next = { ...prev };
              delete next[activeChat.id];
              return next;
            }
            return prev;
          });
        }, 4000);
      }
    });

    wsService.onChat('presence.online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.user_id]));
    });

    wsService.onChat('presence.offline', (data) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(data.user_id);
        return next;
      });
    });

    wsService.onGlobal('notification.broadcast', () => {
      loadBroadcasts();
    });

    wsService.onGlobal('notification.task', () => {
      loadMyTasks();
    });

    return () => {
      wsService.offChat('chat.message');
      wsService.offChat('chat.message_edited');
      wsService.offChat('chat.message_deleted');
      wsService.offChat('chat.typing');
      wsService.offChat('presence.online');
      wsService.offChat('presence.offline');
      wsService.offGlobal('notification.broadcast');
      wsService.offGlobal('notification.task');
    };
  }, [activeChat, loadChats, loadBroadcasts, loadMyTasks]);

  // ==================== Начальная загрузка данных ====================
  useEffect(() => {
    loadChats();
    loadDashboard();
    loadMyTasks();
    loadBroadcasts();
  }, [loadChats, loadDashboard, loadMyTasks, loadBroadcasts]);

  const value = {
    chats, setChats,
    activeChat, setActiveChat,
    messages, setMessages,
    unreadCounts,
    typingUsers,
    onlineUsers,
    dashboard,
    tasks, setTasks,
    broadcasts, setBroadcasts,
    loading,
    searchResults, searchLoading,
    rightPanel, setRightPanel,
    broadcastMode, setBroadcastMode,
    taskMode, setTaskMode,
    messagesEndRef,
    chatContainerRef,
    searchIntercourtCourts,
    togglePinChat,
    leaveChat,
    createChat,
    loadChats,
    loadDashboard,
    loadMessages,
    openChat,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    uploadAttachments,
    searchMessages,
    loadMyTasks,
    createTask,
    updateTaskStatus,
    loadBroadcasts,
    sendBroadcast,
  };

  return (
    <MessengerContext.Provider value={value}>
      {children}
    </MessengerContext.Provider>
  );
};