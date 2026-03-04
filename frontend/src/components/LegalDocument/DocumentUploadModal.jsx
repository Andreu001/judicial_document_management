// DocumentUploadModal.jsx
import React, { useState } from 'react';
import LegalDocumentService from '../../API/LegalDocumentService';
import styles from './LegalDocuments.module.css';

const DocumentUploadModal = ({ onClose, onUpload, documentType }) => {
  const [formData, setFormData] = useState({
    title: '',
    document_type: documentType,
    category: 'general',
    document_number: '',
    document_date: '',
    description: '',
    articles: '',
    keywords: '',
    source: '',
    is_active: true
  });
  
  const [files, setFiles] = useState({
    file_word: null,
    file_pdf: null,
    file_image: null // Новое поле для изображений
  });
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'criminal', label: 'Уголовные' },
    { value: 'civil', label: 'Гражданские' },
    { value: 'administrative', label: 'Административные (КАС)' },
    { value: 'arbitration', label: 'Арбитражные' },
    { value: 'coap', label: 'КОАП' },
    { value: 'military', label: 'Военные' },
    { value: 'general', label: 'Общие вопросы' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0] || null;
    
    // Дополнительная валидация для изображений
    if (name === 'file_image' && file) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/heic', 'image/heif'];
      if (!validImageTypes.includes(file.type)) {
        setError('Пожалуйста, выберите файл изображения (JPEG, PNG, GIF, BMP, WEBP, HEIC)');
        return;
      }
      
      // Ограничение размера для изображений (например, 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 20MB');
        return;
      }
    }
    
    setFiles(prev => ({
      ...prev,
      [name]: file
    }));
    setError(''); // Сбрасываем ошибку при успешном выборе файла
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка наличия хотя бы одного файла
    if (!files.file_word && !files.file_pdf && !files.file_image) {
      setError('Необходимо загрузить хотя бы один файл (Word, PDF или изображение)');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const data = new FormData();
      
      // Добавляем все поля формы
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      
      // Добавляем файлы
      if (files.file_word) {
        data.append('file_word', files.file_word);
      }
      if (files.file_pdf) {
        data.append('file_pdf', files.file_pdf);
      }
      if (files.file_image) {
        data.append('file_image', files.file_image);
      }

      await LegalDocumentService.createDocument(data);
      onUpload();
      onClose();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setError('Не удалось загрузить документ. Проверьте данные и попробуйте снова.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Загрузка правового документа</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.uploadForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Название документа *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Полное название документа"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Категория</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Номер документа</label>
              <input
                type="text"
                name="document_number"
                value={formData.document_number}
                onChange={handleInputChange}
                placeholder="Например: 1-П"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Дата документа</label>
              <input
                type="date"
                name="document_date"
                value={formData.document_date}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Источник</label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                placeholder="Например: КонсультантПлюс"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Краткое описание документа"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Статьи (через запятую)</label>
            <input
              type="text"
              name="articles"
              value={formData.articles}
              onChange={handleInputChange}
              placeholder="Например: УК 105, ГК 309, КОАП 12.8"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Ключевые слова (через запятую)</label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="Для улучшения поиска"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Файл Word (DOC/DOCX)</label>
              <input
                type="file"
                name="file_word"
                accept=".doc,.docx"
                onChange={handleFileChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Файл PDF</label>
              <input
                type="file"
                name="file_pdf"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Новая секция для загрузки изображений */}
          <div className={styles.formGroup}>
            <label>Изображение документа (фото)</label>
            <input
              type="file"
              name="file_image"
              accept="image/*,.heic,.heif"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <small className={styles.fileHint}>
              Поддерживаемые форматы: JPEG, PNG, GIF, BMP, WEBP, HEIC (до 20MB)
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              Документ действующий
            </label>
          </div>

          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={uploading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={uploading}
            >
              {uploading ? 'Загрузка...' : 'Загрузить документ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;