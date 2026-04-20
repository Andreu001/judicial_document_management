// src/components/Documents/DocumentList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Documents.module.css';

const DocumentList = ({ documents, onDelete, onSign, proceedingId, caseType }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>Черновик</span>;
      case 'signed':
        return <span className={`${styles.statusBadge} ${styles.statusSigned}`}>Подписан</span>;
      default:
        return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const handleView = (documentId) => {
    if (caseType === 'other') {
      navigate(`/other-materials/${proceedingId}/documents/${documentId}`);
    } else {
      navigate(`/${caseType}-proceedings/${proceedingId}/documents/${documentId}`);
    }
  };

  const handleEdit = (documentId) => {
    if (caseType === 'other') {
      navigate(`/other-materials/${proceedingId}/documents/${documentId}/edit`);
    } else {
      navigate(`/${caseType}-proceedings/${proceedingId}/documents/${documentId}/edit`);
    }
  };

  const handleCreate = () => {
    if (caseType === 'other') {
      navigate(`/other-materials/${proceedingId}/documents/create`);
    } else {
      navigate(`/${caseType}-proceedings/${proceedingId}/documents/create`);
    }
  };

  if (documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Документы не добавлены</p>
        <button 
          onClick={handleCreate}
          className={styles.addButton}
        >
          Создать первый документ
        </button>
      </div>
    );
  }

  return (
    <div className={styles.documentList}>
      {documents.map(doc => (
        <div key={doc.id} className={styles.documentCard}>
          <div className={styles.documentHeader}>
            <div className={styles.documentTitle}>
              <h3>{doc.title}</h3>
              {getStatusBadge(doc.status)}
            </div>
            <div className={styles.documentTemplate}>
              {doc.template_name}
            </div>
          </div>
          
          <div className={styles.documentMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Создан:</span>
              <span className={styles.metaValue}>{formatDate(doc.created_at)}</span>
            </div>
            {doc.signed_at && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Подписан:</span>
                <span className={styles.metaValue}>{formatDate(doc.signed_at)}</span>
              </div>
            )}
            {doc.signed_by_name && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Кем подписан:</span>
                <span className={styles.metaValue}>{doc.signed_by_name}</span>
              </div>
            )}
          </div>

          <div className={styles.documentActions}>
            <button 
              onClick={() => handleView(doc.id)}
              className={styles.viewButton}
              title="Просмотреть"
            >
              Просмотр
            </button>
            {doc.status === 'draft' && (
              <>
                <button 
                  onClick={() => handleEdit(doc.id)}
                  className={styles.editButton}
                  title="Редактировать"
                >
                  Редактировать
                </button>
                <button 
                  onClick={() => onSign(doc.id)}
                  className={styles.signButton}
                  title="Подписать"
                >
                  Подписать
                </button>
              </>
            )}
            <button 
              onClick={() => onDelete(doc.id)}
              className={styles.deleteButton}
              title="Удалить"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;