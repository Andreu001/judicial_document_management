// src/components/Coap/AppointmentWizardCoap/StepReviewDocument.jsx

import React, { useState, useEffect } from 'react';
import DocumentService from '../../../API/DocumentService';
import styles from './AppointmentWizardCoap.module.css';

const StepReviewDocument = ({ 
  wizardData, 
  updateWizardData, 
  templates, 
  caseData,
  generateDocument,
  loading 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleTemplateChange = (e) => {
    const templateId = parseInt(e.target.value);
    const template = templates.find(t => t.id === templateId);
    updateWizardData({
      selectedTemplateId: templateId,
      documentTemplate: template
    });
  };

  const handleTitleChange = (e) => {
    updateWizardData({ documentTitle: e.target.value });
  };

  const handleContentChange = (e) => {
    updateWizardData({ documentContent: e.target.value });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateDocument();
    setIsGenerating(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  useEffect(() => {
    if (templates.length > 0 && !wizardData.selectedTemplateId) {
      const defaultTemplate = templates.find(t => 
        t.name.includes('назначение') || 
        t.name.includes('рассмотрение') ||
        t.name.includes('подготовка')
      );
      if (defaultTemplate) {
        updateWizardData({
          selectedTemplateId: defaultTemplate.id,
          documentTemplate: defaultTemplate
        });
      }
    }
  }, [templates]);

  return (
    <div className={styles.stepContent}>
      <h3 className={styles.stepTitle}>Постановление о назначении рассмотрения</h3>
      <p className={styles.stepDescription}>
        Выберите шаблон и сформируйте постановление по КоАП РФ
      </p>

      <div className={styles.formGroup}>
        <label className={styles.label}>Шаблон постановления *</label>
        <select
          value={wizardData.selectedTemplateId || ''}
          onChange={handleTemplateChange}
          className={styles.select}
          disabled={loading}
        >
          <option value="">Выберите шаблон</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Заголовок документа</label>
        <input
          type="text"
          value={wizardData.documentTitle || ''}
          onChange={handleTitleChange}
          placeholder="Постановление о назначении рассмотрения дела об административном правонарушении"
          className={styles.input}
        />
      </div>

      <div className={styles.documentActions}>
        <button 
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={!wizardData.selectedTemplateId || isGenerating || loading}
        >
          {isGenerating ? 'Генерация...' : '📄 Сгенерировать постановление'}
        </button>
        
        {wizardData.documentContent && (
          <button 
            className={styles.editToggleButton}
            onClick={handleEditToggle}
          >
            {editMode ? 'Просмотр' : 'Редактировать'}
          </button>
        )}
      </div>

      {wizardData.documentContent && (
        <div className={styles.documentPreview}>
          <div className={styles.documentHeader}>
            <span className={styles.documentStatus}>
              {editMode ? '✏️ Режим редактирования' : '📄 Предпросмотр'}
            </span>
          </div>
          
          {editMode ? (
            <textarea
              value={wizardData.documentContent}
              onChange={handleContentChange}
              className={styles.documentEditor}
              rows={20}
            />
          ) : (
            <div 
              className={styles.documentContent}
              dangerouslySetInnerHTML={{ __html: wizardData.documentContent }}
            />
          )}
        </div>
      )}

      {!wizardData.documentContent && (
        <div className={styles.emptyState}>
          <p>Постановление еще не сформировано</p>
          <p className={styles.hint}>Нажмите «Сгенерировать постановление» для автоматического заполнения</p>
        </div>
      )}
    </div>
  );
};

export default StepReviewDocument;