// src/pages/documents/DocumentFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import DocumentForm from '../../components/Documents/DocumentForm';
import styles from '../../components/Documents/Documents.module.css';

const DocumentFormPage = ({ caseType, isEdit = false }) => {
  const navigate = useNavigate();
  const { proceedingId, documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTemplatesMethod = () => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.getCriminalDocumentTemplates(proceedingId);
      case 'civil':
        return DocumentService.getCivilDocumentTemplates(proceedingId);
      case 'admin':
        return DocumentService.getAdminDocumentTemplates(proceedingId);
      case 'kas':
        return DocumentService.getKasDocumentTemplates(proceedingId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const getDocumentMethod = () => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.getCriminalDocument(proceedingId, documentId);
      case 'civil':
        return DocumentService.getCivilDocument(proceedingId, documentId);
      case 'admin':
        return DocumentService.getAdminDocument(proceedingId, documentId);
      case 'kas':
        return DocumentService.getKasDocument(proceedingId, documentId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const createDocumentMethod = (data) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.createCriminalDocument(proceedingId, data);
      case 'civil':
        return DocumentService.createCivilDocument(proceedingId, data);
      case 'admin':
        return DocumentService.createAdminDocument(proceedingId, data);
      case 'kas':
        return DocumentService.createKasDocument(proceedingId, data);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const updateDocumentMethod = (data) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.updateCriminalDocument(proceedingId, documentId, data);
      case 'civil':
        return DocumentService.updateCivilDocument(proceedingId, documentId, data);
      case 'admin':
        return DocumentService.updateAdminDocument(proceedingId, documentId, data);
      case 'kas':
        return DocumentService.updateKasDocument(proceedingId, documentId, data);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  useEffect(() => {
    loadData();
  }, [proceedingId, documentId, caseType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, documentData] = await Promise.all([
        getTemplatesMethod(),
        isEdit ? getDocumentMethod() : Promise.resolve(null)
      ]);
      
      setTemplates(templatesData);
      if (isEdit && documentData) {
        setDocument(documentData);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (isEdit) {
        await updateDocumentMethod(formData);
      } else {
        await createDocumentMethod(formData);
      }
      navigate(`/${caseType}-proceedings/${proceedingId}/documents`);
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Не удалось сохранить документ');
    }
  };

  const handleCancel = () => {
    navigate(`/${caseType}-proceedings/${proceedingId}/documents`);
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={handleCancel} className={styles.backButton}>
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DocumentForm
        document={document}
        templates={templates}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        proceedingId={proceedingId}
        caseType={caseType}
        isEdit={isEdit}
      />
    </div>
  );
};

export default DocumentFormPage;