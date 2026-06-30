// communication-frontend/src/components/Messenger/services/messengerService.jsx
import baseService from '../../../API/baseService';

const API = '/api/communication';

// ==================== Чаты ====================
export const chatService = {
  list: (params) => baseService.get(`${API}/chats/`, { params }),
  detail: (id) => baseService.get(`${API}/chats/${id}/`),
  create: (data) => baseService.post(`${API}/chats/`, data),
  update: (id, data) => baseService.patch(`${API}/chats/${id}/`, data),
  join: (id) => baseService.post(`${API}/chats/${id}/join/`),
  leave: (id) => baseService.post(`${API}/chats/${id}/leave/`), // ✅ уже есть
  addMembers: (id, userIds) => baseService.post(`${API}/chats/${id}/add_members/`, { user_ids: userIds }),
  removeMember: (id, userId) => baseService.post(`${API}/chats/${id}/remove_member/`, { user_id: userId }),
  changeRole: (id, userId, role) => baseService.post(`${API}/chats/${id}/change_role/`, { user_id: userId, role }),
  togglePin: (id) => baseService.post(`${API}/chats/${id}/toggle_pin/`), // ✅ уже есть
  toggleMute: (id) => baseService.post(`${API}/chats/${id}/toggle_mute/`), // ✅ уже есть
  markRead: (id) => baseService.post(`${API}/chats/${id}/mark_read/`),
  directChat: (userId) => baseService.post(`${API}/chats/direct_chat/`, { user_id: userId }),
  availableIntercourt: () => baseService.get(`${API}/chats/available_intercourt/`),
  pinned: () => baseService.get(`${API}/chats/pinned/`),
  unread: () => baseService.get(`${API}/chats/unread/`),
};

// ==================== Сообщения ====================
export const messageService = {
  list: (chatId, params) => baseService.get(`${API}/messages/`, { params: { chat: chatId, ...params } }),
  create: (data) => baseService.post(`${API}/messages/`, data),
  edit: (id, data) => baseService.post(`${API}/messages/${id}/edit/`, data),
  delete: (id) => baseService.post(`${API}/messages/${id}/delete/`),
  pin: (id) => baseService.post(`${API}/messages/${id}/pin/`),
  unpin: (id) => baseService.post(`${API}/messages/${id}/unpin/`),
  forward: (id, chatId) => baseService.post(`${API}/messages/${id}/forward/`, { chat_id: chatId }),
  markRead: (id) => baseService.post(`${API}/messages/${id}/mark_read/`),
  search: (params) => baseService.get(`${API}/messages/search/`, { params }),
  pinnedMessages: (chatId) => baseService.get(`${API}/messages/pinned/`, { params: { chat: chatId } }),
};

// ==================== Вложения ====================
export const attachmentService = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return baseService.post(`${API}/attachments/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return baseService.post(`${API}/attachments/upload_multiple/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==================== Рассылки ====================
export const broadcastService = {
  list: (params) => baseService.get(`${API}/broadcasts/`, { params }),
  create: (data) => baseService.post(`${API}/broadcasts/`, data),
  detail: (id) => baseService.get(`${API}/broadcasts/${id}/`),
  cancel: (id) => baseService.post(`${API}/broadcasts/${id}/cancel/`),
  recipients: (id) => baseService.get(`${API}/broadcasts/${id}/recipients/`),
  markRead: (id) => baseService.post(`${API}/broadcast-recipients/${id}/mark_read/`),
  confirm: (id) => baseService.post(`${API}/broadcast-recipients/${id}/confirm/`),
  myBroadcasts: () => baseService.get(`${API}/broadcast-recipients/`),
};

// ==================== Поручения ====================
export const taskService = {
  list: (params) => baseService.get(`${API}/tasks/`, { params }),
  create: (data) => baseService.post(`${API}/tasks/`, data),
  detail: (id) => baseService.get(`${API}/tasks/${id}/`),
  accept: (id) => baseService.post(`${API}/tasks/${id}/accept/`),
  start: (id) => baseService.post(`${API}/tasks/${id}/start/`),
  complete: (id) => baseService.post(`${API}/tasks/${id}/complete/`),
  reject: (id, reason) => baseService.post(`${API}/tasks/${id}/reject/`, { reason }),
  comment: (id, text) => baseService.post(`${API}/tasks/${id}/comment/`, { text }),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return baseService.post(`${API}/tasks/${id}/upload_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  my: () => baseService.get(`${API}/tasks/my/`),
  createdByMe: () => baseService.get(`${API}/tasks/created_by_me/`),
  overdue: () => baseService.get(`${API}/tasks/overdue/`),
};

// ==================== Межсудебный обмен ====================
export const documentExchangeService = {
  list: (params) => baseService.get(`${API}/document-exchanges/`, { params }),
  create: (data) => baseService.post(`${API}/document-exchanges/`, data),
  detail: (id) => baseService.get(`${API}/document-exchanges/${id}/`),
  send: (id) => baseService.post(`${API}/document-exchanges/${id}/send/`),
  accept: (id) => baseService.post(`${API}/document-exchanges/${id}/accept/`),
  reject: (id, reason) => baseService.post(`${API}/document-exchanges/${id}/reject/`, { reason }),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return baseService.post(`${API}/document-exchanges/${id}/upload_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  incoming: () => baseService.get(`${API}/document-exchanges/incoming/`),
  outgoing: () => baseService.get(`${API}/document-exchanges/outgoing/`),
};

// ==================== Поиск ====================
export const searchService = {
  courts: (params) => baseService.get(`${API}/courts/search/`, { params }),
  departments: (params) => baseService.get(`${API}/departments/search/`, { params }),
  employees: (params) => baseService.get(`${API}/employees/search/`, { params }),
};

// ==================== Дашборд ====================
export const dashboardService = {
  get: () => baseService.get(`${API}/dashboard/`),
};

// ==================== Маршрутизация ====================
export const routeService = {
  list: () => baseService.get(`${API}/routes/`),
  forMyCourt: () => baseService.get(`${API}/routes/for_my_court/`),
};

export const intercourtService = {
  searchCourts: (params) => baseService.get(`${API}/intercourt-courts/search/`, { params }),
};
