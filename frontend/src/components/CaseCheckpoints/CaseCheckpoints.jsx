// src/components/CaseCheckpoints/CaseCheckpoints.jsx
import React, { useState, useEffect } from 'react';
import NotificationService from '../../API/NotificationService';
import styles from './CaseCheckpoints.module.css';

const CaseCheckpoints = ({ caseId, caseType = 'criminal_proceedings.criminalproceedings' }) => {
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Маппинг типов моделей на content_type_id
  const CONTENT_TYPE_MAP = {
    'criminal_proceedings.criminalproceedings': 1, // Нужно получить реальный ID из БД
    'business_card.businesscard': 2,
  };

  useEffect(() => {
    loadCheckpoints();
  }, [caseId, caseType]);

  const loadCheckpoints = async () => {
    try {
      const contentTypeId = CONTENT_TYPE_MAP[caseType];
      const data = await NotificationService.getCheckpoints(contentTypeId, caseId);
      setCheckpoints(data);
    } catch (error) {
      console.error('Error loading checkpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheckpoint = async (checkpointId) => {
    try {
      setUpdating(true);
      await NotificationService.toggleCheckpoint(checkpointId);
      await loadCheckpoints(); // Перезагружаем для обновления статуса
    } catch (error) {
      console.error('Error toggling checkpoint:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка контрольных точек...</div>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Контрольные точки дела</h3>
      
      <div className={styles.checkpointsList}>
        {checkpoints.length === 0 ? (
          <div className={styles.empty}>Нет контрольных точек для этого дела</div>
        ) : (
          checkpoints.map(checkpoint => (
            <div 
              key={checkpoint.id} 
              className={`${styles.checkpointItem} ${checkpoint.is_checked ? styles.checked : ''}`}
            >
              <div className={styles.checkpointHeader}>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={checkpoint.is_checked}
                    onChange={() => handleToggleCheckpoint(checkpoint.id)}
                    disabled={updating}
                  />
                  <span className={styles.checkmark}></span>
                </label>
                
                <div className={styles.checkpointInfo}>
                  <h4 className={styles.checkpointName}>{checkpoint.checkpoint.name}</h4>
                  <p className={styles.checkpointDescription}>
                    {checkpoint.checkpoint.description}
                  </p>
                  
                  {checkpoint.checkpoint.legal_references && checkpoint.checkpoint.legal_references.length > 0 && (
                    <div className={styles.legalReferences}>
                      {checkpoint.checkpoint.legal_references.map(ref => (
                        <span key={ref.id} className={styles.legalRef}>
                          {ref.code_article}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {checkpoint.is_checked && (
                <div className={styles.checkpointMeta}>
                  <span className={styles.checkedBy}>
                    Проверено: {checkpoint.checked_by_name}
                  </span>
                  <span className={styles.checkedAt}>
                    {formatDate(checkpoint.checked_at)}
                  </span>
                </div>
              )}

              {checkpoint.notes && (
                <div className={styles.notes}>
                  <strong>Примечания:</strong> {checkpoint.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CaseCheckpoints;
