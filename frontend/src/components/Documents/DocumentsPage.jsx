// src/pages/documents/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import DocumentList from '../../components/Documents/DocumentList';
import styles from './Documents.module.css';

const DocumentsPage = ({ caseType }) => {
  const navigate = useNavigate();
  const { proceedingId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getDocumentsMethod = () => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.getCriminalDocuments(proceedingId);
      case 'civil':
        return DocumentService.getCivilDocuments(proceedingId);
      case 'admin':
        return DocumentService.getAdminDocuments(proceedingId);
      case 'kas':
        return DocumentService.getKasDocuments(proceedingId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const deleteDocumentMethod = (documentId) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.deleteCriminalDocument(proceedingId, documentId);
      case 'civil':
        return DocumentService.deleteCivilDocument(proceedingId, documentId);
      case 'admin':
        return DocumentService.deleteAdminDocument(proceedingId, documentId);
      case 'kas':
        return DocumentService.deleteKasDocument(proceedingId, documentId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const signDocumentMethod = (documentId) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.signCriminalDocument(proceedingId, documentId);
      case 'civil':
        return DocumentService.signCivilDocument(proceedingId, documentId);
      case 'admin':
        return DocumentService.signAdminDocument(proceedingId, documentId);
      case 'kas':
        return DocumentService.signKasDocument(proceedingId, documentId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [proceedingId, caseType]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocumentsMethod();
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await deleteDocumentMethod(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Не удалось удалить документ');
    }
  };

  const handleSign = async (documentId) => {
    try {
      const updatedDocument = await signDocumentMethod(documentId);
      setDocuments(documents.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      ));
    } catch (err) {
      console.error('Error signing document:', err);
      alert('Не удалось подписать документ');
    }
  };

  const handleCreate = () => {
    navigate(`/${caseType}-proceedings/${proceedingId}/documents/create`);
  };

  const handleBack = () => {
    navigate('/cards');
  };

  const getCaseTitle = () => {
    switch (caseType) {
      case 'criminal': return 'уголовного';
      case 'civil': return 'гражданского';
      case 'admin': return 'об административном правонарушении';
      case 'kas': return 'административного (КАС)';
      default: return '';
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← На главную
        </button>
        <h1>Документы {getCaseTitle()} дела</h1>
        <button onClick={handleCreate} className={styles.addButton}>
          + Создать документ
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <DocumentList
        documents={documents}
        onDelete={handleDelete}
        onSign={handleSign}
        proceedingId={proceedingId}
        caseType={caseType}
      />
    </div>
  );
};

export default DocumentsPage;