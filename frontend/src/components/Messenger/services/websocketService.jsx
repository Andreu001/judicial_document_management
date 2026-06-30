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
    this.isConnecting = false;
  }

  connect(chatId, token) {
    // Если уже есть открытое соединение, не создаем новое
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected, skipping reconnect');
      return;
    }
    
    // Если идет процесс подключения, не создаем новое
    if (this.isConnecting) {
      console.log('[WS] Connection already in progress, skipping');
      return;
    }
    
    this.chatId = chatId;
    this.token = token;
    this.reconnectAttempts = 0;
    this.isConnecting = true;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000';

    // Подключаем глобальный WebSocket всегда
    const globalUrl = `${protocol}//${host}/ws/global/?token=${token}`;
    console.log('[WS] Connecting to global:', globalUrl);
    this._connectGlobal(globalUrl);

    // Подключаем чат если указан
    if (chatId) {
      const chatUrl = `${protocol}//${host}/ws/chat/${chatId}/?token=${token}`;
      console.log('[WS] Connecting to chat:', chatUrl);
      this._connectChat(chatUrl);
    }
  }

  _connectChat(url) {
    // Если уже есть соединение, закрываем его
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
        this.isConnecting = false;
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
        this.isConnecting = false;
        if (event.code !== 1000) {
          this._scheduleReconnect('chat');
        }
      };
      
      this.ws.onerror = (e) => {
        console.error('[WS] Chat error:', e);
        this.isConnecting = false;
      };
    } catch (e) {
      console.error('[WS] Connection error:', e);
      this.isConnecting = false;
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
        this.isConnecting = false;
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
        this.isConnecting = false;
        if (event.code !== 1000) {
          this._scheduleReconnect('global');
        }
      };
      
      this.globalWs.onerror = (e) => {
        console.error('[WS] Global error:', e);
        this.isConnecting = false;
      };
    } catch (e) {
      console.error('[WS] Global connection error:', e);
      this.isConnecting = false;
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = 'localhost:8000';
      
      if (type === 'global') {
        const url = `${protocol}//${host}/ws/global/?token=${this.token}`;
        this._connectGlobal(url);
      }
      
      if (this.chatId && type === 'chat') {
        const url = `${protocol}//${host}/ws/chat/${this.chatId}/?token=${this.token}`;
        this._connectChat(url);
      }
    }, delay);
  }

  onChat(eventType, handler) {
    this.chatHandlers.set(eventType, handler);
  }

  offChat(eventType) {
    this.chatHandlers.delete(eventType);
  }

  onGlobal(eventType, handler) {
    this.globalHandlers.set(eventType, handler);
  }

  offGlobal(eventType) {
    this.globalHandlers.delete(eventType);
  }

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
    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = 'localhost:8000';
    const url = `${protocol}//${host}/ws/chat/${chatId}/?token=${this.token}`;
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
    this.isConnecting = false;
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
    this.isConnecting = false;
  }
}

const wsService = new WebSocketService();
export default wsService;