// src/components/Documents/DocumentForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import styles from './Documents.module.css';
import baseService from '../../API/baseService';

// Вспомогательная функция для получения CSRF токена
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const DocumentForm = ({ 
  document, 
  templates, 
  onSubmit, 
  onCancel, 
  proceedingId, 
  caseType,
  isEdit = false 
}) => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    template: '',
    title: '',
    content: '',
    ...document
  });
  const [errors, setErrors] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Конфигурация Jodit редактора с кастомными стилями под ваш проект
  const editorConfig = {
    readonly: false,
    height: 600,
    language: 'ru',
    toolbar: true,
    spellcheck: true,
    
    // Кастомные цвета под вашу цветовую схему
    colors: {
      palette: [
        ['#2c3e50', '#34495e', '#4a5568', '#718096', '#a0aec0'], // Основные цвета
        ['#c53030', '#9b2c2c', '#fed7d7', '#c6f6d5', '#22543d'], // Акцентные
        ['#38a169', '#2f855a', '#3182ce', '#2c5282', '#1e2a36']
      ]
    },
    
    // Кнопки панели инструментов
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', 'brush', '|',
      'paragraph', 'align', '|',
      'ul', 'ol', 'outdent', 'indent', '|',
      'table', 'link', 'image', 'video', '|',
      'hr', 'eraser', 'copyformat', '|',
      'undo', 'redo', '|',
      'print', 'about'
    ],
    
    // Настройки для вставки изображений
    uploader: {
      insertImageAsBase64URI: true,
      imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'],
      url: '/api/case-documents/upload-image/',
      format: 'json',
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      }
    },
    
    // Настройки для работы с Word
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    pasteFromWordAction: 'insert',
    pasteFromWordInsert: true,
    
    // Шрифты и размеры
    style: {
      font: {
        'Arial': 'Arial, Helvetica, sans-serif',
        'Times New Roman': 'Times New Roman, Times, serif',
        'Courier New': 'Courier New, Courier, monospace',
        'Georgia': 'Georgia, serif',
        'Verdana': 'Verdana, Geneva, sans-serif',
        'Tahoma': 'Tahoma, Geneva, sans-serif'
      },
      size: {
        '8px': '8px',
        '10px': '10px',
        '12px': '12px',
        '14px': '14px',
        '16px': '16px',
        '18px': '18px',
        '20px': '20px',
        '22px': '22px',
        '24px': '24px',
        '26px': '26px',
        '28px': '28px',
        '36px': '36px',
        '48px': '48px'
      }
    },
    
    // Стили по умолчанию (как в ГОСТ для документов)
    defaultStyle: {
      fontFamily: 'Times New Roman, Times, serif',
      fontSize: '14px',
      lineHeight: '1.5',
      margin: '0 0 10px 0',
      padding: '0'
    },
    
    // Кастомные CSS стили для содержимого
    editorCssClass: 'jodit-document-editor',
    
    // Настройки для печати
    print: {
      styles: `
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14pt;
          line-height: 1.5;
          margin: 2cm;
        }
        h1 { font-size: 18pt; text-align: center; }
        h2 { font-size: 16pt; }
        p { margin: 0 0 12pt 0; }
      `
    },
    
    // Дополнительные настройки
    showXPathInStatusbar: true,
    showWordsCounter: true,
    showCharsCounter: true,
    limitWords: 0,
    limitChars: 0,
    minHeight: 400,
    maxHeight: 800,
    placeholder: 'Введите содержание документа...',
    showPlaceholder: true,
    enableDragAndDropFileToEditor: true,
    
    // Кастомные кнопки
    extraButtons: [
      {
        name: 'insertDate',
        iconURL: '📅',
        tooltip: 'Вставить текущую дату',
        exec: (editor) => {
          const date = new Date().toLocaleDateString('ru-RU');
          editor.selection.insertHTML(`<span style="color: #2c3e50; font-weight: bold;">${date}</span>`);
        }
      },
      {
        name: 'insertCaseNumber',
        iconURL: '📁',
        tooltip: 'Вставить номер дела',
        exec: (editor) => {
          editor.selection.insertHTML('<span style="color: #2c3e50; font-weight: bold;">№ ___________</span>');
        }
      }
    ]
  };

  useEffect(() => {
    if (document) {
      setFormData({
        template: document.template || '',
        title: document.title || '',
        content: document.content || '',
        ...document
      });
      
      if (document.template) {
        const template = templates.find(t => t.id === document.template);
        setSelectedTemplate(template);
      }
    }
  }, [document, templates]);

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setFormData(prev => ({ ...prev, template: templateId }));
    
    const template = templates.find(t => t.id === parseInt(templateId));
    setSelectedTemplate(template);
    
    if (errors.template) {
      setErrors(prev => ({ ...prev, template: '' }));
    }
  };

  const handleTitleChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, title: value }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.template) {
      newErrors.template = 'Выберите шаблон документа';
    }
    if (!formData.title) {
      newErrors.title = 'Введите заголовок документа';
    }
    if (!formData.content) {
      newErrors.content = 'Введите содержание документа';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dataToSend = {
      template: parseInt(formData.template, 10),
      title: formData.title,
      content: formData.content,
    };

    onSubmit(dataToSend);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/${caseType}-proceedings/${proceedingId}/documents`);
    }
  };

  const handleWordUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(doc|docx)$/i)) {
      alert('Пожалуйста, выберите файл в формате Word (.doc или .docx)');
      return;
    }

    setIsLoadingTemplate(true);
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const response = await baseService.post(
        '/case-documents/documents/convert-word/',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = response.data;
      
      // Устанавливаем контент в редактор
      if (editorRef.current) {
        editorRef.current.setEditorState(data.content);
        setFormData(prev => ({ ...prev, content: data.content }));
      }
      
      // Если в Word файле есть заголовок, используем его
      if (data.title && !formData.title) {
        setFormData(prev => ({ ...prev, title: data.title }));
      }

      event.target.value = '';
      
      alert('Документ успешно загружен! Теперь вы можете редактировать его содержимое.');

    } catch (error) {
      console.error('Error uploading Word file:', error);
      alert(`Не удалось загрузить Word файл: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handlePrint = () => {
    const printContent = formData.content;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${formData.title || 'Документ'}</title>
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
            @media print {
              body { margin: 2cm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${formData.title || ''}</h1>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const insertSpecialField = (field) => {
    if (!editorRef.current) return;
    
    let fieldHtml = '';
    const editor = editorRef.current;
    
    switch (field) {
      case 'date':
        fieldHtml = `<span style="color: #2c3e50; font-weight: bold; text-decoration: underline;">${new Date().toLocaleDateString('ru-RU')}</span>`;
        break;
      case 'case_number':
        fieldHtml = `<span style="color: #2c3e50; font-weight: bold;">№ ___________</span>`;
        break;
      case 'judge':
        fieldHtml = `<span style="color: #2c3e50; font-weight: bold;">[ФИО судьи]</span>`;
        break;
      case 'participants':
        fieldHtml = `<span style="color: #2c3e50; font-weight: bold;">[Участники дела]</span>`;
        break;
      default:
        return;
    }
    
    editor.selection.insertHTML(fieldHtml);
  };

  const handleSaveToWord = async () => {
    try {
      const response = await baseService.post(
        `/case-documents/documents/${document?.id || '0'}/export-word/`,
        {
          title: formData.title,
          content: formData.content,
        },
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.title || 'document'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error saving to Word:', error);
      alert('Не удалось сохранить документ в Word');
    }
  };

  const handleSaveToPdf = async () => {
    try {
      const response = await baseService.post(
        `/case-documents/documents/${document?.id || '0'}/export-pdf/`,
        {
          title: formData.title,
          content: formData.content,
        },
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.title || 'document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error saving to PDF:', error);
      alert('Не удалось сохранить документ в PDF');
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>{isEdit ? 'Редактирование документа' : 'Создание нового документа'}</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="template">Шаблон документа *</label>
          <select
            id="template"
            name="template"
            value={formData.template}
            onChange={handleTemplateChange}
            className={errors.template ? styles.errorInput : ''}
            disabled={isEdit}
          >
            <option value="">Выберите шаблон</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {errors.template && <span className={styles.errorMessage}>{errors.template}</span>}
        </div>

        {selectedTemplate && (
          <div className={styles.templateInfo}>
            <strong>{selectedTemplate.name}</strong>
            <p>{selectedTemplate.description}</p>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="title">Заголовок документа *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Например: Постановление о назначении экспертизы"
            className={errors.title ? styles.errorInput : ''}
          />
          {errors.title && <span className={styles.errorMessage}>{errors.title}</span>}
        </div>

        <div className={styles.editorToolbar}>
          <button 
            type="button" 
            onClick={() => insertSpecialField('date')}
            className={styles.toolbarButton}
            title="Вставить текущую дату"
          >
            📅 Дата
          </button>
          <button 
            type="button" 
            onClick={() => insertSpecialField('case_number')}
            className={styles.toolbarButton}
            title="Вставить номер дела"
          >
            📁 Номер дела
          </button>
          <button 
            type="button" 
            onClick={() => insertSpecialField('judge')}
            className={styles.toolbarButton}
            title="Вставить ФИО судьи"
          >
            👨‍⚖️ Судья
          </button>
          <button 
            type="button" 
            onClick={() => insertSpecialField('participants')}
            className={styles.toolbarButton}
            title="Вставить участников"
          >
            👥 Участники
          </button>
          
          <div className={styles.toolbarSeparator}></div>
          
          <button 
            type="button" 
            onClick={handlePrint}
            className={styles.toolbarButton}
            title="Печать"
          >
            🖨️ Печать
          </button>
          
          <button 
            type="button" 
            onClick={handleSaveToWord}
            className={styles.toolbarButton}
            title="Сохранить в Word"
          >
            📥 Word
          </button>
          
          <button 
            type="button" 
            onClick={handleSaveToPdf}
            className={styles.toolbarButton}
            title="Сохранить в PDF"
          >
            📄 PDF
          </button>
          
          <div className={styles.toolbarSeparator}></div>
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()}
            className={styles.toolbarButton}
            title="Загрузить из Word"
            disabled={isLoadingTemplate}
          >
            {isLoadingTemplate ? '⏳ Загрузка...' : '📤 Загрузить Word'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleWordUpload}
            accept=".doc,.docx"
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">Содержание документа *</label>
          <JoditEditor
            ref={editorRef}
            value={formData.content}
            config={editorConfig}
            onBlur={handleContentChange}
          />
          {errors.content && <span className={styles.errorMessage}>{errors.content}</span>}
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={handleCancel} className={styles.cancelButton}>
            Отмена
          </button>
          <button type="submit" className={styles.submitButton}>
            {isEdit ? 'Сохранить изменения' : 'Создать документ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;