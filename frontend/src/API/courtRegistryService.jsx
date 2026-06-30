// src/API/courtRegistryService.jsx
import baseService from './baseService';

const BASE = '/api/court-registry';

// =============================================================================
// Справочники
// =============================================================================

export const getRegions = (params) => baseService.get(`${BASE}/regions/`, { params });
export const getCourtLevels = () => baseService.get(`${BASE}/court-levels/`);
export const getTransferTypes = () => baseService.get(`${BASE}/transfer-types/`);
export const getTransferStatuses = () => baseService.get(`${BASE}/transfer-statuses/`);

// =============================================================================
// Суды
// =============================================================================

export const getCourts = (params) => baseService.get(`${BASE}/courts/`, { params });
export const getCourt = (id) => baseService.get(`${BASE}/courts/${id}/`);
export const createCourt = (data) => baseService.post(`${BASE}/courts/`, data);
export const updateCourt = (id, data) => baseService.put(`${BASE}/courts/${id}/`, data);
export const partialUpdateCourt = (id, data) => baseService.patch(`${BASE}/courts/${id}/`, data);
export const deleteCourt = (id) => baseService.delete(`${BASE}/courts/${id}/`);

export const registerCourtInNetwork = (id) => baseService.post(`${BASE}/courts/${id}/register_in_network/`);
export const getCourtDepartments = (id) => baseService.get(`${BASE}/courts/${id}/departments/`);
export const getCourtEmployees = (id) => baseService.get(`${BASE}/courts/${id}/employees/`);
export const getCourtJudges = (id) => baseService.get(`${BASE}/courts/${id}/judges/`);
export const getMyCourt = () => baseService.get(`${BASE}/courts/my_court/`);
export const searchCourtNetwork = (params) => baseService.get(`${BASE}/courts/search_network/`, { params });

// =============================================================================
// Отделы (упрощенные)
// =============================================================================

export const getDepartments = (params) => baseService.get(`${BASE}/departments/`, { params });
export const getDepartment = (id) => baseService.get(`${BASE}/departments/${id}/`);
export const createDepartment = (data) => baseService.post(`${BASE}/departments/`, data);
export const updateDepartment = (id, data) => baseService.put(`${BASE}/departments/${id}/`, data);
export const partialUpdateDepartment = (id, data) => baseService.patch(`${BASE}/departments/${id}/`, data);
export const deleteDepartment = (id) => baseService.delete(`${BASE}/departments/${id}/`);
export const getDepartmentEmployees = (id) => baseService.get(`${BASE}/departments/${id}/employees/`);

// =============================================================================
// Сотрудники (упрощенные)
// =============================================================================

export const getEmployees = (params) => baseService.get(`${BASE}/employees/`, { params });
export const getEmployee = (id) => baseService.get(`${BASE}/employees/${id}/`);
export const createEmployee = (data) => baseService.post(`${BASE}/employees/`, data);
export const updateEmployee = (id, data) => baseService.put(`${BASE}/employees/${id}/`, data);
export const partialUpdateEmployee = (id, data) => baseService.patch(`${BASE}/employees/${id}/`, data);
export const deleteEmployee = (id) => baseService.delete(`${BASE}/employees/${id}/`);

// =============================================================================
// Передача дел
// =============================================================================

export const getTransfers = (params) => baseService.get(`${BASE}/transfers/`, { params });
export const getTransfer = (id) => baseService.get(`${BASE}/transfers/${id}/`);
export const createTransfer = (data) => baseService.post(`${BASE}/transfers/`, data);
export const sendTransfer = (id) => {
  return baseService.post(`${BASE}/intercourt/send-transfer/${id}/`);
};
export const acceptTransfer = (id, registerCases = true) =>
  baseService.post(`${BASE}/transfers/${id}/accept/`, { register_cases: registerCases });
export const rejectTransfer = (id, reason) =>
  baseService.post(`${BASE}/transfers/${id}/reject/`, { reason });
export const returnTransfer = (id, items) =>
  baseService.post(`${BASE}/transfers/${id}/return_transfer/`, { items });
export const getOutgoingTransfers = () => baseService.get(`${BASE}/transfers/outgoing/`);
export const getIncomingTransfers = () => baseService.get(`${BASE}/transfers/incoming/`);

// =============================================================================
// Уведомления о поступлении дел
// =============================================================================

export const getNotifications = (params) => baseService.get(`${BASE}/notifications/`, { params });
export const getNotification = (id) => baseService.get(`${BASE}/notifications/${id}/`);
export const acceptAllNotification = (id) => baseService.post(`${BASE}/notifications/${id}/accept_all/`);
export const rejectAllNotification = (id, reason) =>
  baseService.post(`${BASE}/notifications/${id}/reject_all/`, { reason });
export const getPendingNotificationCount = () => baseService.get(`${BASE}/notifications/pending_count/`);

// =============================================================================
// Дела, ожидающие передачи
// =============================================================================

export const getPendingTransfers = (params) => baseService.get(`${BASE}/pending-transfers/`, { params });
export const getPendingTransfersByReason = () => baseService.get(`${BASE}/pending-transfers/by_reason/`);
export const scanCasesForTransfer = () => baseService.post(`${BASE}/pending-transfers/scan_cases/`);

// =============================================================================
// ВКС
// =============================================================================

export const getVCSRequests = (params) => baseService.get(`${BASE}/vcs/`, { params });
export const getVCSRequest = (id) => baseService.get(`${BASE}/vcs/${id}/`);
export const createVCSRequest = (data) => baseService.post(`${BASE}/vcs/`, data);
export const updateVCSRequest = (id, data) => baseService.put(`${BASE}/vcs/${id}/`, data);
export const confirmVCS = (id) => baseService.post(`${BASE}/vcs/${id}/confirm/`);
export const rejectVCS = (id, reason) =>
  baseService.post(`${BASE}/vcs/${id}/reject/`, { reason });
export const completeVCS = (id) => baseService.post(`${BASE}/vcs/${id}/complete/`);

// =============================================================================
// Мессенджер
// =============================================================================

export const getMyRegistration = () => baseService.get(`${BASE}/messenger/my_registration/`);
export const registerMessenger = () => baseService.post(`${BASE}/messenger/register/`);
export const pingMessenger = () => baseService.post(`${BASE}/messenger/ping/`);
export const updateMessengerSettings = (data) => baseService.post(`${BASE}/messenger/update_settings/`, data);
export const syncMessengerData = () => baseService.post(`${BASE}/messenger/sync_data/`);

// =============================================================================
// Аудит
// =============================================================================

export const getAuditLogs = (params) => baseService.get(`${BASE}/audit/`, { params });
export const getCourtDirectory = (params) => baseService.get(`${BASE}/court-directory/`, { params });
export const getCourtDirectoryEntry = (id) => baseService.get(`${BASE}/court-directory/${id}/`);
export const searchCourtDirectory = (params) => baseService.get(`${BASE}/court-directory/search/`, { params });