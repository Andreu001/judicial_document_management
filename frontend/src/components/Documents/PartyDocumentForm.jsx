// src/components/Documents/PartyDocumentForm.jsx
import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import useModalDialog from '../../hooks/useModalDialog';
import styles from './Documents.module.css';

const PartyDocumentForm = ({ caseType, isEdit = false, initialData = null }) => {
  const navigate = useNavigate();
  const { proceedingId } = useParams();
  const fileInputRef = useRef(null);
  const { showInfo, showError, ModalDialog } = useModalDialog();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    document_type: initialData?.document_type || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    submitter_name: initialData?.submitter_name || '',
    submitter_role: initialData?.submitter_role || '',
    submission_method: initialData?.submission_method || 'online',
    document_file: null
  });
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');

  const documentTypes = DocumentService.getPartyDocumentTypes();
  const submissionMethods = DocumentService.getSubmissionMethods();

  const getContentTypeModel = () => {
    const mapping = {
      criminal: 'criminalproceedings',
      civil: 'civilproceedings',
      admin: 'administrativeproceedings',
      kas: 'kasproceedings'
    };
    return mapping[caseType] || 'civilproceedings';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('Файл не должен превышать 20 МБ');
      return;
    }
    
    setFileError('');
    setFormData(prev => ({ ...prev, document_file: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!caseType) {
      setError('Ошибка: не удалось определить тип дела');
      return;
    }
    if (!proceedingId) {
      setError('Ошибка: не удалось определить ID дела');
      return;
    }
    if (!formData.document_type) {
      setError('Выберите тип документа');
      return;
    }
    if (!formData.title) {
      setError('Введите заголовок документа');
      return;
    }
    if (!formData.submitter_name) {
      setError('Укажите имя подателя');
      return;
    }
    if (!formData.document_file && !isEdit) {
      setError('Выберите файл документа');
      return;
    }
    
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('content_type', getContentTypeModel());
      submitData.append('object_id', proceedingId);
      submitData.append('document_type', formData.document_type);
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('submitter_name', formData.submitter_name);
      submitData.append('submitter_role', formData.submitter_role);
      submitData.append('submission_method', formData.submission_method);
      if (formData.document_file) {
        submitData.append('document_file', formData.document_file);
      }
      
      console.log('=== Submitting PartyDocument ===');
      console.log('caseType:', caseType);
      console.log('proceedingId:', proceedingId);
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value);
      }
      
      const result = await DocumentService.createPartyDocument(submitData);
      console.log('Success:', result);
      showInfo('Успешно', 'Документ успешно отправлен');
      navigate(`/${caseType}-proceedings/${proceedingId}/party-documents`);
    } catch (err) {
      console.error('Error saving document:', err);
      if (err.response?.data) {
        console.error('Server error response:', err.response.data);
        const errorData = err.response.data;
        let errorMsg = '';
        if (typeof errorData === 'object') {
          errorMsg = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');
        } else {
          errorMsg = errorData.error || 'Ошибка при сохранении документа';
        }
        setError(errorMsg);
        showError('Ошибка', `Ошибка при сохранении документа:\n${errorMsg}`);
      } else {
        setError('Ошибка при сохранении документа');
        showError('Ошибка', 'Ошибка при сохранении документа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalDialog />
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            type="button" 
            onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/party-documents`)}
            className={styles.backButton}
          >
            ← Назад
          </button>
          <h1>{isEdit ? 'Редактирование документа' : 'Новый документ стороны'}</h1>
        </div>

        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Тип документа *</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isEdit}
              >
                <option value="">Выберите тип документа</option>
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Заголовок документа *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Например: Ходатайство о приобщении доказательств"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Краткое описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={styles.textarea}
                placeholder="Краткое содержание документа (необязательно)"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Податель (ФИО) *</label>
              <input
                type="text"
                name="submitter_name"
                value={formData.submitter_name}
                onChange={handleInputChange}
                placeholder="Иванов Иван Иванович"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Роль подателя</label>
              <input
                type="text"
                name="submitter_role"
                value={formData.submitter_role}
                onChange={handleInputChange}
                placeholder="Например: Истец, Ответчик, Обвиняемый"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Способ подачи</label>
              <select
                name="submission_method"
                value={formData.submission_method}
                onChange={handleInputChange}
                className={styles.select}
              >
                {submissionMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Файл документа {!isEdit && '*'}</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className={styles.fileInput}
              />
              {fileError && <div className={styles.errorMessage}>{fileError}</div>}
              {isEdit && !formData.document_file && initialData?.document_file && (
                <div className={styles.fieldHint}>Текущий файл: {initialData.file_name || 'загружен'}</div>
              )}
              <div className={styles.fieldHint}>Поддерживаемые форматы: PDF, DOC, DOCX, JPG, PNG. Максимум 20 МБ.</div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formActions}>
              <button 
                type="button" 
                onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/party-documents`)}
                className={styles.cancelButton}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Отправить документ')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PartyDocumentForm;