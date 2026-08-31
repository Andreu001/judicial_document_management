// src/components/SideAuth/CasePartyDocumentsView.jsx
// Компонент для просмотра документов стороны (PartyDocument) по конкретному делу

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import SideCaseService from '../../API/SideCaseService';
import styles from './CaseViewOnly.module.css';

const CasePartyDocumentsView = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseNumber, setCaseNumber] = useState('');

  useEffect(() => {
    loadDocuments();
    loadCaseInfo();
  }, [caseType, caseId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Преобразуем тип дела для API
      const mappedType = mapCaseTypeForApi(caseType);
      
      console.log(`Loading party documents for case: ${mappedType}, ID: ${caseId}`);
      
      // Получаем документы стороны по делу
      const docs = await DocumentService.getPartyDocumentsByCase(mappedType, caseId);
      
      console.log('Loaded party documents:', docs);
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error loading party documents:', err);
      setError('Ошибка загрузки документов');
    } finally {
      setLoading(false);
    }
  };

  const mapCaseTypeForApi = (type) => {
    const typeMap = {
      'criminal': 'criminal',
      'civil': 'civil',
      'admin': 'administrative',
      'administrative': 'administrative',
      'kas': 'kas'
    };
    return typeMap[type] || type;
  };

  const loadCaseInfo = async () => {
    try {
      const cases = await SideCaseService.getUserCases();
      let foundNumber = '';
      
      const typeMapping = {
        criminal: 'criminal',
        civil: 'civil',
        kas: 'kas',
        administrative: 'administrative'
      };
      
      const mappedType = typeMapping[caseType] || caseType;
      
      if (cases[mappedType]) {
        const found = cases[mappedType].find(c => c.case_id === parseInt(caseId));
        if (found) {
          foundNumber = found.case_number;
        }
      }
      
      setCaseNumber(foundNumber);
    } catch (err) {
      console.error('Error loading case info:', err);
    }
  };

  const getCaseTypeName = () => {
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении (КоАП РФ)'
    };
    return names[caseType] || 'Дело';
  };

  // Получение статуса документа
  const getDocumentStatusInfo = (status) => {
    const statusMap = {
      'pending': { label: 'Ожидает регистрации', className: styles.statusPending },
      'registered': { label: 'Зарегистрирован', className: styles.statusRegistered },
      'under_review': { label: 'На рассмотрении', className: styles.statusUnderReview },
      'accepted': { label: 'Принят', className: styles.statusAccepted },
      'attached_to_case': { label: 'Приобщен к делу', className: styles.statusAttached },
      'rejected': { label: 'Отказано', className: styles.statusRejected },
      'returned': { label: 'Возвращен', className: styles.statusReturned },
    };
    return statusMap[status] || { label: status || 'Неизвестно', className: styles.statusUnknown };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Скачивание документа
  const handleDownload = async (docId, title) => {
    try {
      const response = await DocumentService.downloadPartyDocument(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Ошибка при скачивании документа');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка документов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Назад
        </button>
        <h1>Направленные документы</h1>
        {caseNumber && <p className={styles.caseNumber}>Дело №{caseNumber}</p>}
        <p className={styles.caseTypeLabel}>{getCaseTypeName()}</p>
      </div>

      <div className={styles.content}>
        {documents.length === 0 ? (
          <div className={styles.noData}>
            <p>Вы еще не направляли документы по данному делу</p>
            <p className={styles.emptyHint}>
              Документы, которые вы загрузите через кнопку "Досылка документов", появятся здесь
            </p>
          </div>
        ) : (
          <div className={styles.documentsList}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Дата отправки</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const statusInfo = getDocumentStatusInfo(doc.review_status);
                  return (
                    <tr key={doc.id}>
                      <td className={styles.historyTitleCell}>{doc.title}</td>
                      <td>{doc.document_type_display || doc.document_type || '—'}</td>
                      <td>{doc.submission_date ? formatDate(doc.submission_date) : '—'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {doc.document_file && (
                          <button 
                            className={styles.downloadBtnSmall}
                            onClick={() => handleDownload(doc.id, doc.title)}
                          >
                            📥 Скачать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.note}>
          <p>📌 Для отправки новых документов используйте кнопку "Досылка документов" в личном кабинете.</p>
        </div>
      </div>
    </div>
  );
};

export default CasePartyDocumentsView;