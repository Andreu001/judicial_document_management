// communication-frontend/src/components/Messenger/services/websocketService.jsx

class WebSocketService {
  constructor() {
    this.ws = null;
    this.globalWs = null;
    this.chatHandlers = new Map();
    this.globalHandlers = new Map();
    this.reconnectTimer = null;
    this.chatId = null;
    this.token = null;
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;
  }

  connect(chatId, token) {
      this.chatId = chatId;
      this.token = token;
      this.reconnectAttempts = 0;
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = 'localhost:8000';

      // ВАЖНО: передаём токен через query параметр
      if (chatId) {
        const chatUrl = `${protocol}//${host}/ws/chat/${chatId}/?token=${token}`;
        console.log('[WS] Connecting to chat:', chatUrl);
        this._connectChat(chatUrl);
      }

      const globalUrl = `${protocol}//${host}/ws/global/?token=${token}`;
      console.log('[WS] Connecting to global:', globalUrl);
      this._connectGlobal(globalUrl);
  }
  _connectChat(url) {
    if (this.ws) {
      try {
        this.ws.close(1000, 'Switching chat');
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('[WS] Chat connected successfully');
        this.reconnectAttempts = 0;
        this._startPing(this.ws);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Chat message received:', data.type);
          const handler = this.chatHandlers.get(data.type);
          if (handler) handler(data);
          const allHandler = this.chatHandlers.get('*');
          if (allHandler) allHandler(data);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('[WS] Chat disconnected, code:', event.code, 'reason:', event.reason);
        // Не переподключаться если закрыто намеренно (код 1000)
        if (event.code !== 1000) {
          this._scheduleReconnect('chat');
        }
      };
      
      this.ws.onerror = (e) => {
        console.error('[WS] Chat error:', e);
        // Не закрываем здесь, onclose будет вызван автоматически
      };
    } catch (e) {
      console.error('[WS] Connection error:', e);
      this._scheduleReconnect('chat');
    }
  }

  _connectGlobal(url) {
    if (this.globalWs) {
      try {
        this.globalWs.close(1000);
      } catch (e) {
        // ignore
      }
      this.globalWs = null;
    }

    try {
      this.globalWs = new WebSocket(url);
      
      this.globalWs.onopen = () => {
        console.log('[WS] Global connected successfully');
      };
      
      this.globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Global message received:', data.type);
          const handler = this.globalHandlers.get(data.type);
          if (handler) handler(data);
        } catch (e) {
          console.error('[WS] Global parse error:', e);
        }
      };
      
      this.globalWs.onclose = (event) => {
        console.log('[WS] Global disconnected, code:', event.code);
        if (event.code !== 1000) {
          this._scheduleReconnect('global');
        }
      };
      
      this.globalWs.onerror = (e) => {
        console.error('[WS] Global error:', e);
      };
    } catch (e) {
      console.error('[WS] Global connection error:', e);
      this._scheduleReconnect('global');
    }
  }

  _startPing(ws) {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
    this._pingInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'chat.ping' }));
      } else {
        clearInterval(this._pingInterval);
        this._pingInterval = null;
      }
    }, 30000);
  }

  _scheduleReconnect(type) {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.chatId && type === 'chat') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'localhost:8000';
        const url = `${protocol}//${host}/ws/chat/${this.chatId}/`;
        this._connectChat(url);
      }
      if (type === 'global') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'localhost:8000';
        const url = `${protocol}//${host}/ws/global/`;
        this._connectGlobal(url);
      }
    }, delay);
  }

  // Подписка на события чата
  onChat(eventType, handler) {
    this.chatHandlers.set(eventType, handler);
  }

  offChat(eventType) {
    this.chatHandlers.delete(eventType);
  }

  // Подписка на глобальные события
  onGlobal(eventType, handler) {
    this.globalHandlers.set(eventType, handler);
  }

  offGlobal(eventType) {
    this.globalHandlers.delete(eventType);
  }

  // Отправка в чат
  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn('[WS] Cannot send message, WebSocket not open');
      return false;
    }
  }

  sendTyping() {
    this.sendMessage({ type: 'chat.typing' });
  }

  sendRead(messageId) {
    this.sendMessage({ type: 'chat.message_read', message_id: messageId });
  }

  switchChat(chatId) {
    this.disconnectChat();
    this.chatId = chatId;
    this.reconnectAttempts = 0;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000';
    const url = `${protocol}//${host}/ws/chat/${chatId}/`;
    console.log('[WS] Switching to chat:', url);
    this._connectChat(url);
  }

  disconnectChat() {
    if (this.ws) {
      try {
        this.ws.close(1000, 'Disconnecting');
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }

  disconnect() {
    this.disconnectChat();
    if (this.globalWs) {
      try {
        this.globalWs.close(1000);
      } catch (e) {
        // ignore
      }
      this.globalWs = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

const wsService = new WebSocketService();
export default wsService;