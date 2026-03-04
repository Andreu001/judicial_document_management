// LegalDocuments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import LegalDocumentService from '../../API/LegalDocumentService';
import styles from './LegalDocuments.module.css';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentViewModal from './DocumentViewModal';

const LegalDocuments = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'plenum';
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filter, setFilter] = useState({
    document_type: initialType,
    category: 'all',
    query: '',
    article: '',
    date_from: '',
    date_to: '',
    is_active: true
  });
  const [categories] = useState([
    { value: 'criminal', label: 'Уголовные' },
    { value: 'civil', label: 'Гражданские' },
    { value: 'administrative', label: 'Административные (КАС)' },
    { value: 'arbitration', label: 'Арбитражные' },
    { value: 'coap', label: 'КОАП' },
    { value: 'military', label: 'Военные' },
    { value: 'general', label: 'Общие вопросы' }
  ]);

  // Обновляем filter.document_type при изменении URL
  useEffect(() => {
    setFilter(prev => ({
      ...prev,
      document_type: initialType
    }));
  }, [initialType]);

  // Определяем заголовок в зависимости от типа документа
  const getPageTitle = () => {
    switch(filter.document_type) {
      case 'plenum': return 'Постановления пленумов ВС РФ';
      case 'review': return 'Обзоры практики ВС РФ';
      case 'reference': return 'Справочные материалы';
      default: return 'Правовые документы';
    }
  };

  // Загрузка документов
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (filter.query || filter.article || filter.date_from || filter.date_to) {
        data = await LegalDocumentService.advancedSearch({
          query: filter.query,
          document_type: filter.document_type,
          category: filter.category !== 'all' ? filter.category : undefined,
          article: filter.article,
          date_from: filter.date_from || undefined,
          date_to: filter.date_to || undefined,
          is_active: filter.is_active
        });
      } else {
        const params = {
          document_type: filter.document_type !== 'all' ? filter.document_type : undefined,
          category: filter.category !== 'all' ? filter.category : undefined,
          is_active: filter.is_active
        };
        data = await LegalDocumentService.getDocuments(params);
      }
      
      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (data && Array.isArray(data.results)) {
        setDocuments(data.results);
      } else {
        console.error('API вернул неожиданный формат данных:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadDocuments();
  }, [filter.document_type, filter.category, filter.is_active, loadDocuments]);

  // Обработка поиска
  const handleSearch = () => {
    loadDocuments();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Получение размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileAction = (fileUrl, fileType) => {
    if (fileType === 'pdf') {
      // PDF открываем для просмотра
      window.open(fileUrl, '_blank');
    } else if (fileType === 'image') {
      // Для изображений открываем в новой вкладке (скачивание через атрибут download)
      window.open(fileUrl, '_blank');
    } else {
      // Word документы и другие файлы - скачиваем
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = ''; // Пустое значение для скачивания с оригинальным именем
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={styles.container}>
      {/* Верхняя панель с фильтрами */}
      <div className={styles.filterPanel}>
        <div className={styles.filterRow}>
          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles.searchInput}
              value={filter.query}
              onChange={(e) => setFilter({...filter, query: e.target.value})}
              onKeyDown={handleKeyDown}
              placeholder="Поиск по названию, описанию, ключевым словам..."
            />
            <button className={styles.searchButton} onClick={handleSearch}>
              Найти
            </button>
          </div>
          
          <button 
            className={styles.uploadButton}
            onClick={() => setUploadModal(true)}
          >
            + Загрузить документ
          </button>
        </div>

        <div className={styles.filterRow}>
          <select
            className={styles.filterSelect}
            value={filter.category}
            onChange={(e) => setFilter({...filter, category: e.target.value})}
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <input
            type="text"
            className={styles.filterInput}
            value={filter.article}
            onChange={(e) => setFilter({...filter, article: e.target.value})}
            placeholder="Поиск по статье (например: УК 105)"
          />

          <input
            type="date"
            className={styles.filterInput}
            value={filter.date_from}
            onChange={(e) => setFilter({...filter, date_from: e.target.value})}
            placeholder="Дата с"
          />

          <input
            type="date"
            className={styles.filterInput}
            value={filter.date_to}
            onChange={(e) => setFilter({...filter, date_to: e.target.value})}
            placeholder="Дата по"
          />

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filter.is_active}
              onChange={(e) => setFilter({...filter, is_active: e.target.checked})}
            />
            Только действующие
          </label>
        </div>
      </div>

      {/* Заголовок раздела */}
      <h1 className={styles.pageTitle}>{getPageTitle()}</h1>

      {/* Список документов */}
      {loading ? (
        <div className={styles.loading}>Загрузка документов...</div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Документы не найдены</p>
          <button 
            className={styles.uploadButton}
            onClick={() => setUploadModal(true)}
          >
            Загрузить первый документ
          </button>
        </div>
      ) : (
        <div className={styles.documentsGrid}>
          {documents.map(doc => (
            <div key={doc.id} className={styles.documentCard}>
              <div className={styles.cardHeader}>
                <span className={styles.documentType}>
                  {doc.document_type_display}
                </span>
                <span className={styles.documentCategory}>
                  {doc.category_display}
                </span>
              </div>
              
              <h3 className={styles.documentTitle}>{doc.title}</h3>
              
              {doc.document_number && (
                <div className={styles.documentMeta}>
                  № {doc.document_number}
                  {doc.document_date && ` от ${formatDate(doc.document_date)}`}
                </div>
              )}
              
              {doc.description && (
                <p className={styles.documentDescription}>{doc.description}</p>
              )}
              
              {doc.articles && (
                <div className={styles.documentArticles}>
                  <strong>Статьи:</strong> {doc.articles}
                </div>
              )}
              
              {doc.keywords && (
                <div className={styles.documentKeywords}>
                  <strong>Ключевые слова:</strong> {doc.keywords}
                </div>
              )}
              
              <div className={styles.documentFooter}>
                <div className={styles.documentFiles}>
                  {document.file_image && (
                    <button 
                      onClick={() => handleFileAction(document.file_image, 'image')}
                      className={`${styles.fileLink} ${styles.imageFile}`}
                      title="Просмотреть изображение"
                    >
                      🖼️ Изображение
                      {document.file_image_size && ` (${document.file_image_size})`}
                    </button>
                  )}
                  {doc.file_word && (
                    <button 
                      onClick={() => handleFileAction(doc.file_word, 'word')}
                      className={`${styles.fileLink} ${styles.wordFile}`}
                      title="Скачать Word документ"
                    >
                      📄 Word
                      {doc.file_word_size && ` (${doc.file_word_size})`}
                    </button>
                  )}
                  {doc.file_pdf && (
                    <button 
                      onClick={() => handleFileAction(doc.file_pdf, 'pdf')}
                      className={`${styles.fileLink} ${styles.pdfFile}`}
                      title="Открыть PDF для просмотра"
                    >
                      📕 PDF
                      {doc.file_pdf_size && ` (${doc.file_pdf_size})`}
                    </button>
                  )}
                </div>
                
                <button 
                  className={styles.viewButton}
                  onClick={() => setSelectedDoc(doc)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно загрузки */}
      {uploadModal && (
        <DocumentUploadModal 
          onClose={() => setUploadModal(false)}
          onUpload={loadDocuments}
          documentType={filter.document_type}
        />
      )}

      {/* Модальное окно просмотра */}
      {selectedDoc && (
        <DocumentViewModal 
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          formatDate={formatDate}
          formatFileSize={formatFileSize}
          onFileAction={handleFileAction}
        />
      )}
    </div>
  );
};

export default LegalDocuments;