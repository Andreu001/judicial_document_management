// src/components/SideAuth/DocumentsViewPage.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SideCaseService from '../../API/SideCaseService';
import baseService from '../../API/baseService';
import styles from './CaseViewOnly.module.css';

const DocumentsViewPage = () => {
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
      console.log(`Loading documents for case: ${caseType}, ID: ${caseId}`);
      
      // Пробуем получить решения через вложенный маршрут документов
      let docs = await SideCaseService.getCaseDecisionsViaProceeding(caseType, caseId);
      
      // Если не нашли, пробуем через основной метод
      if (!docs || docs.length === 0) {
        docs = await SideCaseService.getCaseDecisions(caseType, caseId);
      }
      
      console.log('Loaded documents:', docs);
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Ошибка загрузки документов');
    } finally {
      setLoading(false);
    }
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

  const handleDownload = async (decisionId) => {
      try {
          // Используем тот же эндпоинт что и в карточке документа
          const response = await baseService.get(
              `/case-documents/documents/${decisionId}/download-signed/`,
              { responseType: 'blob' }
          );
          
          const contentDisposition = response.headers['content-disposition'] || '';
          let filename = `Решение_${caseNumber || 'case'}.pdf`;
          
          // Пробуем извлечь имя файла из Content-Disposition
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match && match[1]) {
              filename = match[1];
          }
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
      } catch (error) {
          console.error('Error downloading decision:', error);
          let errorMsg = 'Ошибка при скачивании решения';
          if (error.response?.status === 404) {
              errorMsg = 'Файл решения не найден на сервере';
          } else if (error.response?.status === 403) {
              errorMsg = 'У вас нет доступа к этому решению';
          } else if (error.message) {
              errorMsg = error.message;
          }
          alert(errorMsg);
      }
  };

  const handlePrint = (doc) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Пожалуйста, разрешите всплывающие окна для печати');
      return;
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '—';
      return new Date(dateString).toLocaleDateString('ru-RU');
    };
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Решение по делу №${caseNumber}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              margin: 2cm;
              font-size: 14pt;
              line-height: 1.5;
            }
            h1 { 
              text-align: center;
              font-size: 18pt;
              margin-bottom: 24pt;
            }
            .meta-info {
              margin-bottom: 24pt;
              padding: 12pt;
              background: #f5f5f5;
              border-radius: 4pt;
            }
            @media print {
              body { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="meta-info">
            <p><strong>Дело №:</strong> ${caseNumber}</p>
            <p><strong>Тип дела:</strong> ${getCaseTypeName()}</p>
            <p><strong>Дата решения:</strong> ${formatDate(doc.created_at)}</p>
            <p><strong>Результат:</strong> ${doc.title || 'Решение вынесено'}</p>
          </div>
          <h1>${doc.title || 'Решение по делу'}</h1>
          ${doc.content ? `<div>${doc.content}</div>` : ''}
          ${doc.signature_text ? `<div class="signature-block">${doc.signature_text}</div>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка решений...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          Вернуться к моим делам
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
            ← Назад к моим делам
          </button>
          <h1>Решения по делу</h1>
          {caseNumber && <p className={styles.caseNumber}>Дело №{caseNumber}</p>}
          <p className={styles.caseTypeLabel}>{getCaseTypeName()}</p>
        </div>
        <div className={styles.content}>
          <div className={styles.noData}>
            <p>Нет решений по данному делу</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Решения появляются в этом разделе после их подписания судьей.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          ← Назад к моим делам
        </button>
        <h1>Решения по делу</h1>
        {caseNumber && <p className={styles.caseNumber}>Дело №{caseNumber}</p>}
        <p className={styles.caseTypeLabel}>{getCaseTypeName()}</p>
      </div>

      <div className={styles.content}>
        <div className={styles.decisionsList}>
          {documents.map((doc) => (
            <div key={doc.id} className={styles.decisionCard}>
              <div className={styles.decisionHeader}>
                <span className={styles.decisionDate}>
                  {formatDate(doc.created_at)}
                </span>
                <button 
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(doc.id)}
                >
                  Скачать решение
                </button>
              </div>
              <div className={styles.decisionResult}>
                <strong>Наименование:</strong> {doc.title || 'Решение по делу'}
              </div>
              {doc.signed_at && (
                <div className={styles.decisionMeta}>
                  Подписано: {formatDate(doc.signed_at)}
                </div>
              )}
              <div className={styles.decisionActions}>
                <button 
                  onClick={() => handlePrint(doc)} 
                  className={styles.printBtn}
                >
                  Распечатать
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.note}>
          <p>📌 Для загрузки документов или подачи ходатайств вернитесь в личный кабинет.</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentsViewPage;