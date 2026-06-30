// src/pages/documents/PartyDocumentsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import PartyDocumentItem from '../../components/Documents/PartyDocumentItem';
import useModalDialog from '../../hooks/useModalDialog';
import styles from '../../components/Documents/Documents.module.css';
import NotificationService from '../../API/NotificationService';

const PartyDocumentsPage = () => {
  const navigate = useNavigate();
  const { proceedingId, caseType: paramCaseType } = useParams();
  const location = useLocation();
  const { showError, ModalDialog } = useModalDialog();
  
  let caseType = paramCaseType;
  if (!caseType && location.pathname) {
    if (location.pathname.includes('criminal-proceedings')) caseType = 'criminal';
    else if (location.pathname.includes('civil-proceedings')) caseType = 'civil';
    else if (location.pathname.includes('admin-proceedings')) caseType = 'admin';
    else if (location.pathname.includes('kas-proceedings')) caseType = 'kas';
  }
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const userRole = localStorage.getItem('userRole') || 'internal';

  useEffect(() => {
    if (caseType && proceedingId) {
      loadDocuments();
      // Отмечаем все документы как прочитанные при открытии страницы
      if (userRole === 'internal') {
        markAllAsRead();
      }
    }
  }, [proceedingId, caseType]);


  const markAllAsRead = async () => {
    try {
      let apiCaseType = caseType;
      if (caseType === 'admin') {
        apiCaseType = 'administrative';
      }
      const result = await NotificationService.markAllCaseActivitiesAsRead(
        apiCaseType,
        proceedingId,
        'new_party_document'
      );
      
      // Если вернулся обновленный статус, отправляем его в карточку
      if (result && result.status) {
        window.dispatchEvent(new CustomEvent('refreshNotifications', { 
          detail: { 
            caseType: caseType, 
            caseId: proceedingId, 
            status: result.status 
          }
        }));
      } else {
        await refreshNotificationStatus();
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      await refreshNotificationStatus();
    }
  };

  const loadDocuments = async () => {
    if (!caseType) {
      console.error('Cannot load documents: caseType is undefined');
      setError('Не удалось определить тип дела');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await DocumentService.getPartyDocumentsByCase(caseType, proceedingId);
      setDocuments(data);
      setError(null);
      
      // Обновляем статус уведомлений после загрузки
      await refreshNotificationStatus();
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  };

  const refreshNotificationStatus = useCallback(async () => {
    try {
      let apiCaseType = caseType;
      if (caseType === 'admin') {
        apiCaseType = 'administrative';
      }
      const status = await NotificationService.getCaseNotificationStatus(apiCaseType, proceedingId);
      
      // Отправляем событие для обновления статуса в карточке
      window.dispatchEvent(new CustomEvent('refreshNotifications', { 
        detail: { 
          caseType: caseType, 
          caseId: proceedingId, 
          status: status 
        }
      }));
      
      // Также отправляем событие для обновления в текущей странице
      window.dispatchEvent(new CustomEvent('partyDocumentsUpdated', { 
        detail: { caseId: proceedingId }
      }));
      
    } catch (err) {
      console.error('Error refreshing notification status:', err);
    }
  }, [caseType, proceedingId]);

  const getFilteredDocuments = () => {
    if (filter === 'all') return documents;
    if (filter === 'pending') return documents.filter(d => d.review_status === 'pending' || d.review_status === 'registered');
    if (filter === 'processed') return documents.filter(d => d.review_status === 'accepted' || d.review_status === 'attached_to_case');
    if (filter === 'rejected') return documents.filter(d => d.review_status === 'rejected' || d.review_status === 'returned');
    return documents;
  };

  const getStats = () => ({
    total: documents.length,
    pending: documents.filter(d => d.review_status === 'pending' || d.review_status === 'registered').length,
    processed: documents.filter(d => d.review_status === 'accepted' || d.review_status === 'attached_to_case').length,
    rejected: documents.filter(d => d.review_status === 'rejected' || d.review_status === 'returned').length
  });

  const stats = getStats();
  const filteredDocs = getFilteredDocuments();

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <ModalDialog />
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Назад
        </button>
        <h1>Документы сторон</h1>
        <button 
          onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/party-documents/create`)}
          className={styles.addButton}
        >
          + Добавить документ
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterBar}>
        <button 
          className={`${styles.filterButton} ${filter === 'all' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('all')}
        >
          Все ({stats.total})
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'pending' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('pending')}
        >
          На рассмотрении ({stats.pending})
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'processed' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('processed')}
        >
          Приняты ({stats.processed})
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'rejected' ? styles.activeFilter : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Отклонены ({stats.rejected})
        </button>
      </div>

      <div className={styles.partyDocumentsList}>
        {filteredDocs.length > 0 ? (
          filteredDocs.map(doc => (
            <PartyDocumentItem 
              key={doc.id} 
              document={doc} 
              caseId={proceedingId}
              caseType={caseType}
              onUpdate={loadDocuments}
              onNotificationUpdate={refreshNotificationStatus}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>Документы от сторон не поступали</p>
            <button 
              onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/party-documents/create`)}
              className={styles.addButton}
            >
              Добавить первый документ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyDocumentsPage;