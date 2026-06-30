// src/components/Documents/DocumentDetail.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useModalDialog from '../../hooks/useModalDialog';
import styles from './Documents.module.css';

const API_BASE_URL = 'http://localhost:8000';

const DocumentDetail = ({ document, onSign, onEdit, onDelete, onPrint, proceedingId, caseType }) => {
  const navigate = useNavigate();
  const { showConfirm, showInfo, showError, ModalDialog } = useModalDialog();

  // Получение токена из localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('citizen_token');
  };

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

  const handleBack = () => {
    navigate(`/${caseType}-proceedings/${proceedingId}/documents`);
  };

  const handleSign = async () => {
    showConfirm(
      'Подписание документа',
      'Вы уверены, что хотите подписать документ? После подписания редактирование будет недоступно.',
      async () => {
        await onSign(document.id);
      },
      'Да, подписать',
      false
    );
  };

  const handleDelete = async () => {
    showConfirm(
      'Удаление документа',
      'Вы уверены, что хотите удалить документ?',
      async () => {
        await onDelete(document.id);
      },
      'Да, удалить',
      true
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError('Ошибка', 'Пожалуйста, разрешите всплывающие окна для печати');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title || 'Документ'}</title>
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
            .signature-block {
              margin-top: 48pt;
              padding-top: 24pt;
              border-top: 2px solid #000;
              font-style: italic;
            }
            .meta-info {
              margin-bottom: 24pt;
              padding: 12pt;
              background: #f5f5f5;
              border-radius: 4pt;
            }
            @media print {
              body { margin: 2cm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="meta-info">
            <p><strong>Статус:</strong> ${document.status === 'signed' ? 'Подписан' : 'Черновик'}</p>
            <p><strong>Создан:</strong> ${formatDate(document.created_at)}</p>
            <p><strong>Кем создан:</strong> ${document.created_by_name || '—'}</p>
            ${document.signed_at ? `
              <p><strong>Подписан:</strong> ${formatDate(document.signed_at)}</p>
              <p><strong>Кем подписан:</strong> ${document.signed_by_name || '—'}</p>
            ` : ''}
          </div>
          
          <h1>${document.title || ''}</h1>
          
          ${document.content || ''}
          
          ${document.signature_text ? `
            <div class="signature-block">
              <h3>Подпись</h3>
              ${document.signature_text}
            </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportPdf = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        showError('Ошибка авторизации', 'Не найден токен авторизации. Пожалуйста, войдите в систему.');
        return;
      }

      const url = `${API_BASE_URL}/case-documents/documents/${document.id}/export-pdf/`;
      console.log('Запрос PDF:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = `${document.title || 'document'}.pdf`;

      if (window.document.body) {
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      } else {
        a.style.display = 'none';
        window.document.head.appendChild(a);
        a.click();
        window.document.head.removeChild(a);
      }

      URL.revokeObjectURL(blobUrl);
      showInfo('Успешно', 'Документ сохранен в PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Ошибка', 'Не удалось сохранить документ в PDF');
    }
  };

  const handleExportWord = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        showError('Ошибка авторизации', 'Не найден токен авторизации. Пожалуйста, войдите в систему.');
        return;
      }

      const url = `${API_BASE_URL}/case-documents/documents/${document.id}/export-word/`;
      console.log('Запрос Word:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = `${document.title || 'document'}.docx`;

      if (window.document.body) {
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      } else {
        a.style.display = 'none';
        window.document.head.appendChild(a);
        a.click();
        window.document.head.removeChild(a);
      }

      URL.revokeObjectURL(blobUrl);
      showInfo('Успешно', 'Документ сохранен в Word');
    } catch (error) {
      console.error('Error exporting Word:', error);
      showError('Ошибка', 'Не удалось сохранить документ в Word');
    }
  };

  return (
    <>
      <ModalDialog />
      <div className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Назад к списку
          </button>
          <div className={styles.detailTitle}>
            <h1>{document.title}</h1>
            {getStatusBadge(document.status)}
          </div>
        </div>

        <div className={styles.detailMeta}>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Шаблон:</span>
              <span className={styles.metaValue}>{document.template_detail?.name || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Создан:</span>
              <span className={styles.metaValue}>{formatDate(document.created_at)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Кем создан:</span>
              <span className={styles.metaValue}>{document.created_by_name || '—'}</span>
            </div>
            {document.signed_at && (
              <>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Подписан:</span>
                  <span className={styles.metaValue}>{formatDate(document.signed_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Кем подписан:</span>
                  <span className={styles.metaValue}>{document.signed_by_name || '—'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.documentContent}>
          <h3>Содержание документа</h3>
          <div 
            className={styles.contentText}
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>

        {document.signature_text && (
          <div className={styles.signatureBlock}>
            <h3>Подпись</h3>
            <div 
              className={styles.signatureText}
              dangerouslySetInnerHTML={{ __html: document.signature_text }}
            />
          </div>
        )}

        <div className={styles.detailActions}>
          <button onClick={handlePrint} className={styles.printButton}>
            Распечатать
          </button>
          
          <button onClick={handleExportPdf} className={styles.pdfButton}>
            Сохранить PDF
          </button>
          
          <button onClick={handleExportWord} className={styles.wordButton}>
            Сохранить Word
          </button>
          
          {document.status === 'draft' ? (
            <>
              <button onClick={() => onEdit(document.id)} className={styles.editButton}>
                Редактировать
              </button>
              <button onClick={handleSign} className={styles.signButton}>
                Подписать
              </button>
            </>
          ) : null}
          
          <button onClick={handleDelete} className={styles.deleteButton}>
            Удалить
          </button>
        </div>
      </div>
    </>
  );
};

export default DocumentDetail;