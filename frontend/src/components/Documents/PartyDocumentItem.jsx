// src/components/Documents/PartyDocumentItem.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import NotificationService from '../../API/NotificationService';
import useModalDialog from '../../hooks/useModalDialog';
import styles from './Documents.module.css';

const PartyDocumentItem = ({ document, caseId, caseType, onUpdate, onNotificationUpdate }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const { showConfirm, showPrompt, showInfo, showError, ModalDialog } = useModalDialog();
  const userRole = localStorage.getItem('userRole') || 'internal';

  const statusConfig = DocumentService.getReviewStatuses()[document.review_status] || 
    { label: document.review_status_display || document.review_status, color: '#6c757d', class: '' };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Функция для отметки документа как прочитанного через API
  const markDocumentAsRead = async () => {
    if (actionInProgress) return;
    
    try {
      let apiCaseType = caseType === 'admin' ? 'administrative' : caseType;
      await DocumentService.markDocumentAsReadByObject(apiCaseType, caseId, document.id);
      
      if (onNotificationUpdate) {
        await onNotificationUpdate();
      }
      return true;
    } catch (err) {
      console.error('Error marking as read:', err);
      return false;
    }
  };

  const handleView = async () => {
    if (actionInProgress) return;
    
    setActionInProgress(true);
    try {
      // Отмечаем как прочитанное перед переходом
      if (userRole === 'internal') {
        await markDocumentAsRead();
      }
      navigate(`/${caseType}-proceedings/${caseId}/party-documents/${document.id}`);
    } catch (err) {
      console.error('Error in handleView:', err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    setActionInProgress(true);
    try {
      const response = await DocumentService.downloadPartyDocument(document.id);
      
      if (!response || !response.data) {
        throw new Error('Нет данных для скачивания');
      }

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = document.file_name || document.title || 'document';
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Ошибка', `Не удалось скачать документ: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRegister = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    showPrompt(
      'Регистрация документа',
      'Введите входящий номер (оставьте пустым для автоматической генерации):',
      async (regNumber) => {
        setActionInProgress(true);
        try {
          const regNumberToSend = (regNumber && regNumber.trim() !== '') ? regNumber.trim() : null;
          const result = await DocumentService.registerPartyDocument(document.id, regNumberToSend);
          
          // ВАЖНО: Отмечаем как прочитанное после регистрации
          await markDocumentAsRead();
          
          if (onUpdate) onUpdate();
          const regNum = result?.registration_number || 'присвоен';
          showInfo('Успешно', `Документ зарегистрирован. Номер: ${regNum}`);
        } catch (error) {
          console.error('Register error:', error);
          showError('Ошибка', `Ошибка регистрации документа: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionInProgress(false);
        }
      },
      'Входящий номер (необязательно)',
      ''
    );
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    showPrompt(
      'Отказ в приобщении',
      'Укажите причину отказа:',
      async (reason) => {
        if (!reason || reason.trim() === '') {
          showError('Ошибка', 'Необходимо указать причину отказа');
          return;
        }
        setActionInProgress(true);
        try {
          await DocumentService.rejectPartyDocument(document.id, reason.trim());
          
          // Отмечаем как прочитанное после отказа
          await markDocumentAsRead();
          
          if (onUpdate) onUpdate();
          showInfo('Успешно', 'В приобщении документа отказано');
        } catch (error) {
          console.error('Reject error:', error);
          showError('Ошибка', `Ошибка: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionInProgress(false);
        }
      },
      'Причина отказа',
      ''
    );
  };

  const handleReturn = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    showPrompt(
      'Возврат документа',
      'Укажите причину возврата:',
      async (reason) => {
        if (!reason || reason.trim() === '') {
          showError('Ошибка', 'Необходимо указать причину возврата');
          return;
        }
        setActionInProgress(true);
        try {
          await DocumentService.returnPartyDocument(document.id, reason.trim());
          
          // Отмечаем как прочитанное после возврата
          await markDocumentAsRead();
          
          if (onUpdate) onUpdate();
          showInfo('Успешно', 'Документ возвращен заявителю');
        } catch (error) {
          console.error('Return error:', error);
          showError('Ошибка', `Ошибка: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionInProgress(false);
        }
      },
      'Причина возврата',
      ''
    );
  };

  const handleAttach = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    showPrompt(
      'Приобщение документа',
      'Введите решение судьи (необязательно):',
      async (decision) => {
        const finalDecision = (decision && decision.trim() !== '') ? decision.trim() : 'Документ приобщен к материалам дела.';
        showConfirm(
          'Подтверждение',
          'Приобщить документ к материалам дела?',
          async () => {
            setActionInProgress(true);
            try {
              await DocumentService.attachPartyDocumentToCase(document.id, finalDecision);
              
              // Отмечаем как прочитанное после приобщения
              await markDocumentAsRead();
              
              if (onUpdate) onUpdate();
              showInfo('Успешно', 'Документ приобщен к делу');
            } catch (error) {
              console.error('Attach error:', error);
              showError('Ошибка', `Ошибка: ${error.response?.data?.error || error.message}`);
            } finally {
              setActionInProgress(false);
            }
          },
          'Да, приобщить',
          false
        );
      },
      'Решение судьи',
      ''
    );
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (actionInProgress) return;
    
    showConfirm(
      'Удаление документа',
      'Удалить документ? Это действие необратимо.',
      async () => {
        setActionInProgress(true);
        try {
          await DocumentService.deletePartyDocument(document.id);
          
          // Отмечаем как прочитанное перед удалением
          await markDocumentAsRead();
          
          if (onUpdate) onUpdate();
          showInfo('Успешно', 'Документ удален');
        } catch (error) {
          console.error('Delete error:', error);
          showError('Ошибка', `Ошибка удаления документа: ${error.response?.data?.error || error.message}`);
        } finally {
          setActionInProgress(false);
        }
      },
      'Да, удалить',
      true
    );
  };

  const getDocumentTypeLabel = () => {
    const types = DocumentService.getPartyDocumentTypes();
    const found = types.find(t => t.value === document.document_type);
    return found ? found.label : document.document_type;
  };

  const canRegister = userRole === 'internal' && document.review_status === 'pending';

  const canRejectOrReturn = userRole === 'internal' && 
    ['pending', 'registered', 'under_review', 'accepted'].includes(document.review_status) &&
    document.review_status !== 'rejected' && 
    document.review_status !== 'returned';

  const canAttach = userRole === 'internal' && 
    ['accepted', 'registered', 'under_review'].includes(document.review_status) &&
    document.review_status !== 'attached_to_case';

  // Определяем, есть ли непрочитанное уведомление (если статус pending/registered и не отмечено как прочитанное)
  const hasUnreadNotification = userRole === 'internal' && 
    ['pending', 'registered'].includes(document.review_status) && 
    !document.is_read_by_judge;

  return (
    <>
      <ModalDialog />
      <div 
        className={`${styles.partyDocumentCard} ${hasUnreadNotification ? styles.unreadCard : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleView}
        style={hasUnreadNotification ? { borderLeft: '3px solid #ffc107', backgroundColor: '#fff9e6' } : {}}
      >
        <div className={styles.partyDocumentHeader}>
          <div className={styles.partyDocumentType}>
            {getDocumentTypeLabel()}
            {hasUnreadNotification && (
              <span className={styles.newBadge}>Новое</span>
            )}
          </div>
          <div 
            className={styles.partyDocumentStatus}
            style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color }}
          >
            {statusConfig.label}
          </div>
        </div>
        
        <div className={styles.partyDocumentTitle}>
          {document.title}
        </div>
        
        <div className={styles.partyDocumentMeta}>
          <span>От: {document.submitter_name}</span>
          {document.registration_number && (
            <span>Вх. №: {document.registration_number}</span>
          )}
          <span>Дата подачи: {formatDate(document.submission_date)}</span>
        </div>
        
        {document.description && (
          <div className={styles.partyDocumentDescription}>
            {document.description.length > 100 
              ? document.description.substring(0, 100) + '...' 
              : document.description}
          </div>
        )}
        
        {document.judge_decision && document.review_status !== 'pending' && (
          <div className={styles.partyDocumentDecision}>
            <strong>Решение судьи:</strong> {document.judge_decision}
          </div>
        )}
        
        <div className={styles.partyDocumentActions}>
          <button 
            onClick={handleDownload}
            className={styles.downloadButton}
            title="Скачать файл"
            disabled={actionInProgress}
          >
            Скачать
          </button>         
          {userRole === 'internal' && (
            <button 
              onClick={handleDelete}
              className={styles.deleteButton}
              disabled={actionInProgress}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default PartyDocumentItem;