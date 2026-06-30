import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import DocumentService from '../../API/DocumentService';
import useModalDialog from '../../hooks/useModalDialog';
import styles from './Documents.module.css';
import NotificationService from '../../API/NotificationService';

const PartyDocumentDetailPage = ({ onUpdate }) => {
  const navigate = useNavigate();
  const { proceedingId, documentId, caseType: paramCaseType } = useParams();
  const location = useLocation();
  const { showPrompt, showInfo, showError, ModalDialog, showConfirm } = useModalDialog();
  
  let caseType = paramCaseType;
  if (!caseType && location.pathname) {
    if (location.pathname.includes('criminal-proceedings')) caseType = 'criminal';
    else if (location.pathname.includes('civil-proceedings')) caseType = 'civil';
    else if (location.pathname.includes('admin-proceedings')) caseType = 'admin';
    else if (location.pathname.includes('kas-proceedings')) caseType = 'kas';
  }
  
  const [documentData, setDocumentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
  
  const userRole = localStorage.getItem('userRole') || 'internal';

  useEffect(() => {
    if (documentId) {
      loadData();
    }
  }, [documentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docData, historyData] = await Promise.all([
        DocumentService.getPartyDocumentById(documentId),
        DocumentService.getPartyDocumentHistory(documentId)
      ]);
      setDocumentData(docData);
      setHistory(historyData || []);
      setError(null);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Не удалось загрузить документ');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const markDocumentAsRead = async () => {
    if (!documentData || !documentData.case || !documentData.id) return;
    
    try {
      // Определяем тип дела
      let caseTypeForApi = 'administrative';
      if (location.pathname.includes('criminal-proceedings')) {
        caseTypeForApi = 'criminal';
      } else if (location.pathname.includes('civil-proceedings')) {
        caseTypeForApi = 'civil';
      } else if (location.pathname.includes('admin-proceedings')) {
        caseTypeForApi = 'administrative';
      } else if (location.pathname.includes('kas-proceedings')) {
        caseTypeForApi = 'kas';
      }
      
      // 🔥 НОВЫЙ ЭНДПОИНТ - помечаем конкретную активность по связанному объекту
      await baseService.post('/notifications/case-activities/mark-by-object/', {
        case_type: caseTypeForApi,
        case_id: proceedingId,
        object_type: 'partydocument',
        object_id: documentData.id
      });
      
      setIsMarkedAsRead(true);
      
      // Обновляем статус в карточке
      await refreshNotificationStatus();
      
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };
  // Отмечаем как прочитанное при загрузке документа
  useEffect(() => {
    if (documentData && userRole === 'internal' && !isMarkedAsRead) {
      markDocumentAsRead();
    }
  }, [documentData, userRole]);

  const getStatusConfig = () => {
    const statuses = DocumentService.getReviewStatuses();
    return statuses[documentData?.review_status] || { label: documentData?.review_status_display || documentData?.review_status, color: '#6c757d' };
  };

  const getDocumentTypeLabel = () => {
    const types = DocumentService.getPartyDocumentTypes();
    const found = types.find(t => t.value === documentData?.document_type);
    return found ? found.label : documentData?.document_type;
  };

  const handleDownload = async () => {
    if (!documentId) {
      showError('Ошибка', 'ID документа не найден');
      return;
    }

    try {
      const response = await DocumentService.downloadPartyDocument(documentId);
      
      if (!response || !response.data) {
        throw new Error('Нет данных для скачивания');
      }

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const downloadLink = window.document.createElement('a');
      downloadLink.href = url;
      const fileName = documentData?.file_name || documentData?.title || 'document';
      downloadLink.setAttribute('download', fileName);
      
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      
      setTimeout(() => {
        window.document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (err) {
      console.error('Error downloading:', err);
      showError('Ошибка скачивания', `Не удалось скачать файл: ${err.response?.data?.error || err.message || 'Неизвестная ошибка'}`);
    }
  };

  const handleRegister = async () => {
    showConfirm(
      'Регистрация документа',
      'Зарегистрировать документ? Номер будет сгенерирован автоматически.',
      async () => {
        setActionLoading(true);
        try {
          await DocumentService.registerPartyDocument(documentId, null);
          await loadData();
          showInfo('Успешно', 'Документ успешно зарегистрирован');
          if (onUpdate) onUpdate();
          await refreshNotificationStatus();
        } catch (err) {
          console.error('Registration error:', err);
          showError('Ошибка', `Ошибка регистрации документа: ${err.response?.data?.error || err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
      'Да, зарегистрировать',
      'Отмена'
    );
  };

  const refreshNotificationStatus = async () => {
    try {
      let apiCaseType = caseType;
      if (caseType === 'admin') {
        apiCaseType = 'admin';
      }
      const status = await NotificationService.getCaseNotificationStatus(apiCaseType, proceedingId);
      window.dispatchEvent(new CustomEvent('refreshNotifications', { 
        detail: { caseType: caseType, caseId: proceedingId, status }
      }));
    } catch (err) {
      console.error('Error refreshing notification status:', err);
    }
  };

  const handleReject = async () => {
    showPrompt(
      'Отказ в приобщении',
      'Укажите причину отказа:',
      async (reason) => {
        setActionLoading(true);
        try {
          // Проверяем причину
          const finalReason = (reason && reason.trim() !== '') ? reason.trim() : 'Причина не указана';
          
          // Вызываем API
          await DocumentService.rejectPartyDocument(documentId, finalReason);
          await loadData();
          showInfo('Успешно', 'В приобщении документа отказано');
          if (onUpdate) onUpdate();
          await refreshNotificationStatus();
        } catch (err) {
          console.error('Reject error:', err);
          showError('Ошибка', `Ошибка при отклонении документа: ${err.response?.data?.error || err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
      'Причина отказа',
      ''
    );
  };

  // ВОЗВРАТ - теперь РАБОТАЕТ как Приобщить к делу
  const handleReturn = async () => {
    showPrompt(
      'Возврат документа',
      'Укажите причину возврата:',
      async (reason) => {
        setActionLoading(true);
        try {
          // Проверяем причину
          const finalReason = (reason && reason.trim() !== '') ? reason.trim() : 'Причина не указана';
          
          // Вызываем API
          await DocumentService.returnPartyDocument(documentId, finalReason);
          await loadData();
          showInfo('Успешно', 'Документ возвращен заявителю');
          if (onUpdate) onUpdate();
          await refreshNotificationStatus();
        } catch (err) {
          console.error('Return error:', err);
          showError('Ошибка', `Ошибка при возврате документа: ${err.response?.data?.error || err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
      'Причина возврата',
      ''
    );
  };

  const handleAttach = async () => {
    showPrompt(
      'Приобщение документа к делу',
      'Введите решение судьи (необязательно):',
      async (decision) => {
        const finalDecision = (decision && decision.trim() !== '') ? decision.trim() : 'Документ приобщен к материалам дела.';
        
        setActionLoading(true);
        try {
          await DocumentService.attachPartyDocumentToCase(documentId, finalDecision);
          await loadData();
          showInfo('Успешно', 'Документ успешно приобщен к делу');
          if (onUpdate) onUpdate();
        } catch (err) {
          console.error('Attach error:', err);
          showError('Ошибка', `Ошибка при приобщении документа: ${err.response?.data?.error || err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
      'Решение судьи',
      ''
    );
  };

  const handleDelete = async () => {
    showPrompt(
      'Удаление документа',
      'Введите причину удаления (необязательно):',
      async (reason) => {
        setActionLoading(true);
        try {
          await DocumentService.deletePartyDocument(documentId);
          showInfo('Успешно', 'Документ удален');
          if (onUpdate) onUpdate();
          navigate(`/${caseType}-proceedings/${proceedingId}/party-documents`);
        } catch (err) {
          console.error('Delete error:', err);
          showError('Ошибка', `Ошибка удаления документа: ${err.response?.data?.error || err.message}`);
        } finally {
          setActionLoading(false);
        }
      },
      'Причина удаления',
      ''
    );
  };

  const showRegisterButton = () => {
    return userRole === 'internal' && documentData?.review_status === 'pending';
  };
  
  const showRejectReturnButtons = () => {
    const activeStatuses = ['pending', 'registered', 'under_review', 'accepted'];
    return userRole === 'internal' && activeStatuses.includes(documentData?.review_status) && documentData?.review_status !== 'rejected' && documentData?.review_status !== 'returned';
  };
  
  const showAttachButton = () => {
    const attachableStatuses = ['accepted', 'registered', 'under_review'];
    return userRole === 'internal' && 
           attachableStatuses.includes(documentData?.review_status) &&
           documentData?.review_status !== 'attached_to_case';
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  if (error || !documentData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Документ не найден'}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>Назад</button>
      </div>
    );
  }

  const statusConfig = getStatusConfig();

  return (
    <div className={styles.container}>
      <ModalDialog />
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Назад
        </button>
        <h1>Документ стороны</h1>
        <button 
          onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/party-documents`)}
          className={styles.allDocumentsButton}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          Показать все документы
        </button>
      </div>

      <div className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>
            <h2>{documentData.title}</h2>
            <span className={styles.statusBadge} style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        <div className={styles.detailMeta}>
          <div className={styles.metaGrid}>
            <div><label>Тип документа:</label><span>{getDocumentTypeLabel()}</span></div>
            <div><label>Податель:</label><span>{documentData.submitter_name}</span></div>
            {documentData.submitter_role && <div><label>Роль:</label><span>{documentData.submitter_role}</span></div>}
            <div><label>Способ подачи:</label><span>{documentData.submission_method_display || documentData.submission_method}</span></div>
            <div><label>Дата подачи:</label><span>{formatDateTime(documentData.submission_date)}</span></div>
            <div><label>Статус:</label><span style={{ fontWeight: 'bold' }}>{statusConfig.label}</span></div>
            {documentData.registration_number && (
              <div><label>Входящий номер:</label><span>{documentData.registration_number}</span></div>
            )}
            {documentData.registration_date && (
              <div><label>Дата регистрации:</label><span>{formatDateTime(documentData.registration_date)}</span></div>
            )}
            {documentData.reviewed_by && (
              <div><label>Судья:</label><span>{documentData.reviewed_by_name || documentData.reviewed_by}</span></div>
            )}
            {documentData.judge_decision_date && (
              <div><label>Дата решения:</label><span>{formatDateTime(documentData.judge_decision_date)}</span></div>
            )}
          </div>
        </div>

        {documentData.description && (
          <div className={styles.documentContent}>
            <h3>Описание</h3>
            <div className={styles.contentText}>{documentData.description}</div>
          </div>
        )}

        {documentData.judge_decision && (
          <div className={styles.signatureBlock} style={{ borderLeftColor: '#3182ce' }}>
            <h3>Решение судьи</h3>
            <div className={styles.signatureText}>{documentData.judge_decision}</div>
          </div>
        )}

        <div className={styles.detailActions}>
          <button onClick={handleDownload} className={styles.downloadButton} disabled={actionLoading}>
            Скачать файл
          </button>
          
          {showRegisterButton() && (
            <button onClick={handleRegister} className={styles.registerButton} disabled={actionLoading}>
              Зарегистрировать
            </button>
          )}
          
          {showRejectReturnButtons() && (
            <>
              <button onClick={handleReject} className={styles.rejectButton} disabled={actionLoading}>
                Отказать
              </button>
              <button onClick={handleReturn} className={styles.returnButton} disabled={actionLoading}>
                Вернуть
              </button>
            </>
          )}
          
          {showAttachButton() && (
            <button onClick={handleAttach} className={styles.attachButton} disabled={actionLoading}>
              Приобщить к делу
            </button>
          )}
          
          {userRole === 'internal' && (
            <button onClick={handleDelete} className={styles.deleteButton} disabled={actionLoading}>
              Удалить
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div className={styles.historySection}>
            <h3>История статусов</h3>
            <div className={styles.historyList}>
              {history.map((entry, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <div className={styles.historyStatus}>
                    {entry.previous_status} → {entry.new_status}
                  </div>
                  <div className={styles.historyMeta}>
                    <span>{entry.changed_by}</span>
                    <span>{formatDateTime(entry.created_at)}</span>
                  </div>
                  {entry.comment && <div className={styles.historyComment}>{entry.comment}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyDocumentDetailPage;