// DocumentViewModal.jsx
import React, { useState } from 'react';
import styles from './LegalDocuments.module.css';

const DocumentViewModal = ({ document, onClose, formatDate, formatFileSize, onFileAction }) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImage(null);
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modalContent} ${styles.viewModal}`} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>{document.title}</h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>

          <div className={styles.documentDetail}>
            <div className={styles.detailSection}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Тип документа:</span>
                <span className={styles.detailValue}>{document.document_type_display}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Категория:</span>
                <span className={styles.detailValue}>{document.category_display}</span>
              </div>
              {document.document_number && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Номер:</span>
                  <span className={styles.detailValue}>{document.document_number}</span>
                </div>
              )}
              {document.document_date && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Дата:</span>
                  <span className={styles.detailValue}>{formatDate(document.document_date)}</span>
                </div>
              )}
              {document.source && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Источник:</span>
                  <span className={styles.detailValue}>{document.source}</span>
                </div>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Статус:</span>
                <span className={`${styles.statusBadge} ${document.is_active ? styles.active : styles.inactive}`}>
                  {document.is_active ? 'Действующий' : 'Недействующий'}
                </span>
              </div>
            </div>

            {document.description && (
              <div className={styles.detailSection}>
                <h3>Описание</h3>
                <p className={styles.detailText}>{document.description}</p>
              </div>
            )}

            {document.articles && (
              <div className={styles.detailSection}>
                <h3>Статьи</h3>
                <p className={styles.detailText}>{document.articles}</p>
              </div>
            )}

            {document.keywords && (
              <div className={styles.detailSection}>
                <h3>Ключевые слова</h3>
                <p className={styles.detailText}>{document.keywords}</p>
              </div>
            )}

            <div className={styles.detailSection}>
              <h3>Файлы</h3>
              <div className={styles.fileList}>
                {document.file_word && (
                  <button 
                    onClick={() => onFileAction(document.file_word, 'word')}
                    className={`${styles.fileItem} ${styles.wordFile}`}
                  >
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileName}>
                      Документ Word
                      {document.file_word_size && ` (${document.file_word_size})`}
                    </span>
                    <span className={styles.downloadLink}>Скачать</span>
                  </button>
                )}
                {document.file_pdf && (
                  <button 
                    onClick={() => onFileAction(document.file_pdf, 'pdf')}
                    className={`${styles.fileItem} ${styles.pdfFile}`}
                  >
                    <span className={styles.fileIcon}>📕</span>
                    <span className={styles.fileName}>
                      Документ PDF
                      {document.file_pdf_size && ` (${document.file_pdf_size})`}
                    </span>
                    <span className={styles.downloadLink}>Просмотреть</span>
                  </button>
                )}
                {/* Новый блок для отображения изображений */}
                {document.file_image && (
                  <>
                    <button 
                      onClick={() => handleImageClick(document.file_image)}
                      className={`${styles.fileItem} ${styles.imageFile}`}
                    >
                      <span className={styles.fileIcon}>🖼️</span>
                      <span className={styles.fileName}>
                        Изображение документа
                        {document.file_image_size && ` (${document.file_image_size})`}
                      </span>
                      <span className={styles.downloadLink}>Просмотреть</span>
                    </button>
                    
                    {/* Миниатюра изображения */}
                    <div className={styles.imageThumbnailContainer}>
                      <img 
                        src={document.file_image} 
                        alt={document.title}
                        className={styles.imageThumbnail}
                        onClick={() => handleImageClick(document.file_image)}
                      />
                      <button 
                        onClick={() => onFileAction(document.file_image, 'image')}
                        className={styles.imageDownloadButton}
                      >
                        Скачать изображение
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.detailMeta}>
              <div>Загружен: {formatDate(document.uploaded_at)}</div>
              {document.uploaded_by_name && <div>Загрузил: {document.uploaded_by_name}</div>}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно для предпросмотра изображения */}
      {showImagePreview && previewImage && (
        <div className={styles.imagePreviewOverlay} onClick={closeImagePreview}>
          <div className={styles.imagePreviewContainer} onClick={e => e.stopPropagation()}>
            <button className={styles.closePreviewButton} onClick={closeImagePreview}>×</button>
            <img src={previewImage} alt="Предпросмотр документа" className={styles.fullPreviewImage} />
            <div className={styles.imagePreviewActions}>
              <a 
                href={previewImage} 
                download 
                className={styles.downloadPreviewButton}
              >
                Скачать изображение
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentViewModal;