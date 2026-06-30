// src/pages/documents/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentService from '../../API/DocumentService';
import DocumentList from '../../components/Documents/DocumentList';
import useModalDialog from '../../hooks/useModalDialog';
import styles from '../../components/Documents/Documents.module.css';

const DocumentsPage = ({ caseType }) => {
  const navigate = useNavigate();
  const { proceedingId, materialId } = useParams();
  const { showConfirm, showInfo, showError, ModalDialog } = useModalDialog();
  
  const objectId = proceedingId || materialId;
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
      case 'other':
        return DocumentService.getOtherMaterialDocuments(materialId);
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
      case 'other':
        return DocumentService.deleteOtherMaterialDocument(materialId, documentId);
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
      case 'other':
        return DocumentService.signOtherMaterialDocument(materialId, documentId);
      default:
        throw new Error(`Unknown case type: ${caseType}`);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [proceedingId, materialId, caseType]);

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
    showConfirm(
      'Удаление документа',
      'Вы уверены, что хотите удалить этот документ?',
      async () => {
        try {
          await deleteDocumentMethod(documentId);
          setDocuments(documents.filter(doc => doc.id !== documentId));
          showInfo('Успешно', 'Документ удален');
        } catch (err) {
          console.error('Error deleting document:', err);
          showError('Ошибка', 'Не удалось удалить документ');
        }
      },
      'Да, удалить',
      true
    );
  };

  const handleSign = async (documentId) => {
    showConfirm(
      'Подписание документа',
      'Подписать документ? После подписания редактирование будет недоступно.',
      async () => {
        try {
          const updatedDocument = await signDocumentMethod(documentId);
          setDocuments(documents.map(doc => 
            doc.id === documentId ? updatedDocument : doc
          ));
          showInfo('Успешно', 'Документ подписан');
        } catch (err) {
          console.error('Error signing document:', err);
          showError('Ошибка', 'Не удалось подписать документ');
        }
      },
      'Да, подписать',
      false
    );
  };

  const handleCreate = () => {
    if (caseType === 'other') {
      navigate(`/other-materials/${materialId}/documents/create`);
    } else {
      navigate(`/${caseType}-proceedings/${proceedingId}/documents/create`);
    }
  };

  const handleBack = () => {
    if (caseType === 'other') {
      navigate(`/other-materials/${materialId}`);
    } else {
      navigate('/cards');
    }
  };

  const getCaseTitle = () => {
    switch (caseType) {
      case 'criminal': return 'уголовного';
      case 'civil': return 'гражданского';
      case 'admin': return 'об административном правонарушении';
      case 'kas': return 'административного (КАС)';
      case 'other': return 'иного материала';
      default: return '';
    }
  };

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  return (
    <div className={styles.container}>
      <ModalDialog />
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← Назад
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
        proceedingId={objectId}
        caseType={caseType}
      />
    </div>
  );
};

export default DocumentsPage;