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
  }

  connect(chatId, token) {
    this.chatId = chatId;
    this.token = token;
    
    // Используем правильные порты для WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Если Django на порту 8000, а WebSocket сервер на том же порту
    const host = 'localhost:8000'; // или window.location.hostname + ':8000'

    if (chatId) {
      const chatUrl = `${protocol}//${host}/ws/chat/${chatId}/`;
      this._connectChat(chatUrl);
    }

    const globalUrl = `${protocol}//${host}/ws/global/`;
    this._connectGlobal(globalUrl);
  }

  _connectChat(url) {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log('[WS] Chat connected');
      this._startPing(this.ws);
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = this.chatHandlers.get(data.type);
        if (handler) handler(data);
        // Also call 'all' handler
        const allHandler = this.chatHandlers.get('*');
        if (allHandler) allHandler(data);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };
    this.ws.onclose = () => {
      console.log('[WS] Chat disconnected');
      this._scheduleReconnect('chat');
    };
    this.ws.onerror = (e) => console.error('[WS] Chat error:', e);
  }

  _connectGlobal(url) {
    if (this.globalWs) {
      this.globalWs.close();
    }
    this.globalWs = new WebSocket(url);
    this.globalWs.onopen = () => console.log('[WS] Global connected');
    this.globalWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = this.globalHandlers.get(data.type);
        if (handler) handler(data);
      } catch (e) {
        console.error('[WS] Global parse error:', e);
      }
    };
    this.globalWs.onclose = () => {
      console.log('[WS] Global disconnected');
      this._scheduleReconnect('global');
    };
  }

  _startPing(ws) {
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'chat.ping' }));
      } else {
        clearInterval(ping);
      }
    }, 30000);
  }

  _scheduleReconnect(type) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('[WS] Reconnecting...');
      if (this.chatId && type === 'chat') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws/chat/${this.chatId}/`;
        this._connectChat(url);
      }
      if (type === 'global') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws/global/`;
        this._connectGlobal(url);
      }
    }, 3000);
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
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/chat/${chatId}/`;
    this._connectChat(url);
  }

  disconnectChat() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  disconnect() {
    this.disconnectChat();
    if (this.globalWs) {
      this.globalWs.close();
      this.globalWs = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
