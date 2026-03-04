// src/pages/documents/DocumentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import DocumentDetail from '../../components/Documents/DocumentDetail';
import styles from '../../components/Documents/Documents.module.css';

const DocumentDetailPage = ({ caseType }) => {
  const navigate = useNavigate();
  const { proceedingId, documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const signDocumentMethod = (id) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.signCriminalDocument(proceedingId, id);
      case 'civil':
        return DocumentService.signCivilDocument(proceedingId, id);
      case 'admin':
        return DocumentService.signAdminDocument(proceedingId, id);
      case 'kas':
        return DocumentService.signKasDocument(proceedingId, id);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  const deleteDocumentMethod = (id) => {
    switch (caseType) {
      case 'criminal':
        return DocumentService.deleteCriminalDocument(proceedingId, id);
      case 'civil':
        return DocumentService.deleteCivilDocument(proceedingId, id);
      case 'admin':
        return DocumentService.deleteAdminDocument(proceedingId, id);
      case 'kas':
        return DocumentService.deleteKasDocument(proceedingId, id);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [proceedingId, documentId, caseType]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const data = await getDocumentMethod();
      setDocument(data);
      setError(null);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Не удалось загрузить документ');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (id) => {
    try {
      const updatedDocument = await signDocumentMethod(id);
      setDocument(updatedDocument);
    } catch (err) {
      console.error('Error signing document:', err);
      alert('Не удалось подписать документ');
    }
  };

  const handleEdit = (id) => {
    navigate(`/${caseType}-proceedings/${proceedingId}/documents/${id}/edit`);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocumentMethod(id);
      navigate(`/${caseType}-proceedings/${proceedingId}/documents`);
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Не удалось удалить документ');
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  if (error || !document) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Документ не найден'}</div>
        <button 
          onClick={() => navigate(`/${caseType}-proceedings/${proceedingId}/documents`)} 
          className={styles.backButton}
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DocumentDetail
        document={document}
        onSign={handleSign}
        onEdit={handleEdit}
        onDelete={handleDelete}
        proceedingId={proceedingId}
        caseType={caseType}
      />
    </div>
  );
};

export default DocumentDetailPage;