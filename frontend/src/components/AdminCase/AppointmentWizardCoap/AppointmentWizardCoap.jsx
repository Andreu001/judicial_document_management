// src/components/Coap/AppointmentWizardCoap/AppointmentWizardCoap.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentService from '../../../API/DocumentService';
import CaseManagementService from '../../../API/CaseManagementService';
import AdministrativeCaseService from '../../../API/AdministrativeCaseService';
import useModalDialog from '../../../hooks/useModalDialog';
import styles from './AppointmentWizardCoap.module.css';

// Компоненты шагов
import StepSelectDate from './StepSelectDate';
import StepSelectType from './StepSelectType';
import StepReviewDocument from './StepReviewDocument';
import StepSelectParticipants from './StepSelectParticipants';
import StepConfirm from './StepConfirm';

const AppointmentWizardCoap = ({ 
  isOpen, 
  onClose, 
  caseId, 
  caseNumber,
  onSuccess 
}) => {
  const navigate = useNavigate();
  const { showInfo, showError } = useModalDialog();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [allSides, setAllSides] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  const [wizardData, setWizardData] = useState({
    // Шаг 1: Дата и время
    hearingDate: '',
    hearingTime: '',
    hearingRoom: '',
    
    // Шаг 2: Тип заседания (по КоАП)
    hearingType: 'preparation', // 'preparation' | 'trial'
    sessionType: 'open',
    
    // Шаг 3: Документ
    documentTemplate: null,
    documentContent: '',
    documentTitle: '',
    selectedTemplateId: null,
    
    // Шаг 4: Участники
    selectedParticipants: [],
    participantChannels: {},
    
    // Шаг 5: Подтверждение
    confirmed: false,
  });

  const steps = [
    { id: 'date', title: 'Дата и время', icon: '📅' },
    { id: 'type', title: 'Параметры', icon: '⚖️' },
    { id: 'document', title: 'Постановление', icon: '📄' },
    { id: 'participants', title: 'Участники', icon: '👥' },
    { id: 'confirm', title: 'Подтверждение', icon: '✅' },
  ];

  useEffect(() => {
    if (isOpen && caseId) {
      loadCaseData();
    }
  }, [isOpen, caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      
      const caseDataResponse = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
      setCaseData(caseDataResponse);
      
      const sidesResponse = await AdministrativeCaseService.getAllSides(caseId);
      setAllSides(sidesResponse);
      
      const templatesResponse = await DocumentService.getAdminDocumentTemplates(caseId);
      setTemplates(templatesResponse);
      
      const defaultTemplate = templatesResponse.find(t => 
        t.name.includes('назначение') || 
        t.name.includes('рассмотрение') ||
        t.name.includes('подготовка')
      );
      
      if (defaultTemplate) {
        setWizardData(prev => ({
          ...prev,
          selectedTemplateId: defaultTemplate.id,
          documentTemplate: defaultTemplate
        }));
      }
      
      const defaultParticipants = sidesResponse.map(side => ({
        ...side,
        selected: true,
        channel: 'online'
      }));
      
      setWizardData(prev => ({
        ...prev,
        selectedParticipants: defaultParticipants,
        participantChannels: defaultParticipants.reduce((acc, p) => {
          acc[p.id] = 'online';
          return acc;
        }, {})
      }));
      
    } catch (error) {
      console.error('Error loading case data:', error);
      showError('Ошибка', 'Не удалось загрузить данные дела');
    } finally {
      setLoading(false);
    }
  };

  const updateWizardData = (newData) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  const goToStep = (step) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return wizardData.hearingDate && wizardData.hearingTime;
      case 1:
        return wizardData.hearingType;
      case 2:
        return wizardData.selectedTemplateId && wizardData.documentContent;
      case 3:
        return wizardData.selectedParticipants.some(p => p.selected);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const generateDocument = async () => {
    if (!wizardData.selectedTemplateId) {
      showError('Ошибка', 'Выберите шаблон документа');
      return;
    }

    try {
      setLoading(true);
      
      const documentData = {
        template: wizardData.selectedTemplateId,
        title: wizardData.documentTitle || generateDocumentTitle(),
        content: wizardData.documentContent || generateDocumentContent(),
      };
      
      const response = await DocumentService.createAdminDocument(caseId, documentData);
      
      updateWizardData({
        documentId: response.id,
        documentContent: response.content
      });
      
      showInfo('Успешно', 'Постановление сформировано');
    } catch (error) {
      console.error('Error generating document:', error);
      showError('Ошибка', 'Не удалось сгенерировать постановление');
    } finally {
      setLoading(false);
    }
  };

  const generateDocumentTitle = () => {
    const typeLabels = {
      'preparation': 'о подготовке к рассмотрению дела об административном правонарушении',
      'trial': 'о назначении рассмотрения дела об административном правонарушении'
    };
    return `Определение ${typeLabels[wizardData.hearingType] || 'о назначении'}`;
  };

  const generateDocumentContent = () => {
    const date = new Date(wizardData.hearingDate);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const judgeName = caseData?.presiding_judge_full_name || '[ФИО судьи]';
    const caseNumberText = caseData?.case_number_admin || '[Номер дела]';
    const articleNumber = caseData?.article_number || '[Статья]';
    const articlePart = caseData?.article_part ? ` ч. ${caseData.article_part}` : '';
    
    const typeLabels = {
      'preparation': 'подготовку к рассмотрению дела об административном правонарушении',
      'trial': 'рассмотрение дела об административном правонарушении'
    };
    
    const typeArticles = {
      'preparation': 'ст. 29.1-29.2 КоАП РФ',
      'trial': 'ст. 29.7-29.11 КоАП РФ'
    };
    
    let content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2>ОПРЕДЕЛЕНИЕ</h2>
        <p>о назначении ${typeLabels[wizardData.hearingType] || 'заседания'}</p>
      </div>
      
      <p>г. Москва &nbsp;&nbsp;&nbsp;&nbsp; ${formattedDate}</p>
      
      <p>Судья ${judgeName}, рассмотрев материалы дела об административном правонарушении № ${caseNumberText},</p>
      
      <p><strong>УСТАНОВИЛ:</strong></p>
      
      <p>В производство судьи ${judgeName} поступило дело об административном правонарушении № ${caseNumberText} в отношении лица, привлекаемого к ответственности по ст. ${articleNumber}${articlePart} КоАП РФ.</p>
      
      <p>Руководствуясь ${typeArticles[wizardData.hearingType] || 'КоАП РФ'},</p>
      
      <p><strong>ОПРЕДЕЛИЛ:</strong></p>
      
      <ol>
        <li>Назначить ${typeLabels[wizardData.hearingType] || 'заседание'} по делу об административном правонарушении № ${caseNumberText} на <strong>${formattedDate} в ${wizardData.hearingTime}</strong>.</li>
        <li>Рассмотрение дела провести в ${wizardData.sessionType === 'open' ? 'открытом' : 'закрытом'} судебном заседании.</li>
        <li>Вызвать в судебное заседание: ${wizardData.selectedParticipants.filter(p => p.selected).map(p => p.name).join(', ')}.</li>
        <li>Направить копии определения участникам производства по делу об административном правонарушении.</li>
      </ol>
      
      <p style="margin-top: 30px;">
        Судья: ____________________
      </p>
    `;
    
    return content;
  };

  const executeAppointment = async () => {
    try {
      setLoading(true);
      
      // 1. Сохраняем постановление
      let documentId = wizardData.documentId;
      if (!documentId) {
        const docData = {
          template: wizardData.selectedTemplateId,
          title: wizardData.documentTitle || generateDocumentTitle(),
          content: wizardData.documentContent || generateDocumentContent(),
        };
        const response = await DocumentService.createAdminDocument(caseId, docData);
        documentId = response.id;
      }
      
      // 2. Создаем уведомления для участников
      const selectedParticipants = wizardData.selectedParticipants.filter(p => p.selected);
      
      const channels = await CaseManagementService.getNotificationChannels();
      const channelMap = {};
      channels.forEach(ch => {
        channelMap[ch.name?.toLowerCase()] = ch.id;
        channelMap[ch.code?.toLowerCase()] = ch.id;
      });
      
      const templates = await CaseManagementService.getNotificationTemplates('administrative');
      const templateMap = {};
      templates.forEach(t => {
        templateMap[`${t.case_category}-${t.participant_type}`] = t;
      });
      
      const participantTypeMap = {
        'side': 'side',
        'lawyer': 'lawyer',
        'defendant': 'defendant'
      };
      
      const channelNameToId = (channelName) => {
        const map = {
          'online': 'online',
          'email': 'email',
          'paper': 'paper',
          'phone': 'phone',
          'mail': 'mail'
        };
        const mappedName = map[channelName] || 'online';
        return channelMap[mappedName] || channelMap['online'];
      };
      
      for (const participant of selectedParticipants) {
        const participantKey = `${participant.type}-${participant.id}`;
        const channelName = wizardData.participantChannels[participantKey] || 'online';
        const channelId = channelNameToId(channelName);
        
        const templateType = participantTypeMap[participant.type] || 'side';
        const templateKey = `administrative-${templateType}`;
        const template = templateMap[templateKey];
        
        let messageText = '';
        if (template) {
          messageText = template.content
            .replace(/\{\{ case_number \}\}/g, caseNumber || '№ ___________')
            .replace(/\{\{ full_name \}\}/g, participant.name || 'Участник')
            .replace(/\{\{ hearing_date \}\}/g, new Date(wizardData.hearingDate).toLocaleDateString('ru-RU'))
            .replace(/\{\{ hearing_time \}\}/g, wizardData.hearingTime || '10:00')
            .replace(/\{\{ hearing_room \}\}/g, wizardData.hearingRoom || '')
            .replace(/\{\{ court_name \}\}/g, 'Районный суд')
            .replace(/\{\{ address \}\}/g, 'г. Москва, ул. Примерная, д. 1');
        } else {
          messageText = `Уведомление о рассмотрении дела об административном правонарушении № ${caseNumber || '...'}\n\nДата: ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')}\nВремя: ${wizardData.hearingTime}\nЗал: ${wizardData.hearingRoom || 'не указан'}\n\nУчастник: ${participant.name}`;
        }
        
        const notificationData = {
          case_type: 'administrative',
          case_id: parseInt(caseId),
          participant_type: participant.type,
          participant_id: parseInt(participant.id),
          hearing_date: wizardData.hearingDate,
          hearing_time: wizardData.hearingTime,
          hearing_room: wizardData.hearingRoom || '',
          channel: channelId,
          template: template ? template.id : null,
          message_text: messageText,
          participant_name: participant.name,
          participant_role: participant.role || participant.type
        };
        
        try {
          await CaseManagementService.createNotification(notificationData);
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }
      
      // 3. Добавляем запись в справочный лист
      try {
        const actionTypes = await CaseManagementService.getProgressActionTypes();
        
        let actionTypeId = null;
        const searchTerms = ['назначение', 'рассмотрение', 'подготовка'];
        
        for (const term of searchTerms) {
          const found = actionTypes.find(t => 
            t.name && t.name.toLowerCase().includes(term.toLowerCase())
          );
          if (found) {
            actionTypeId = found.id;
            break;
          }
        }
        
        if (!actionTypeId && actionTypes.length > 0) {
          actionTypeId = actionTypes[0].id;
        }
        
        if (actionTypeId) {
          const typeLabels = {
            'preparation': 'подготовку к рассмотрению',
            'trial': 'рассмотрение'
          };
          
          const progressData = {
            action_type: actionTypeId,
            description: `Назначено ${typeLabels[wizardData.hearingType] || 'заседание'} на ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')} ${wizardData.hearingTime}`,
            action_date: wizardData.hearingDate
          };
          
          await CaseManagementService.createProgressEntry('administrative', caseId, progressData);
        }
      } catch (progressError) {
        console.error('Error creating progress entry:', progressError);
      }
      
      // 4. Создаем движение дела
      try {
        const movementData = {
          date_meeting: wizardData.hearingDate,
          meeting_time: wizardData.hearingTime,
          result_court_session: `Назначено ${wizardData.hearingType === 'preparation' ? 'подготовка к рассмотрению' : 'рассмотрение'} дела об АП`
        };
        
        await AdministrativeCaseService.createMovement(caseId, movementData);
        console.log('Case movement created successfully');
      } catch (movementError) {
        console.error('Error creating case movement:', movementError);
      }
      
      // 5. Обновляем дату рассмотрения
      await AdministrativeCaseService.updateAdministrativeProceedings(caseId, {
        hearing_date: wizardData.hearingDate
      });
      
      showInfo('Успешно', 'Назначка успешно выполнена!');
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error executing appointment:', error);
      showError('Ошибка', `Не удалось выполнить назначку: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const stepProps = {
      wizardData,
      updateWizardData,
      caseData,
      allSides,
      templates,
      loading,
      generateDocument,
    };

    switch (currentStep) {
      case 0:
        return <StepSelectDate {...stepProps} />;
      case 1:
        return <StepSelectType {...stepProps} />;
      case 2:
        return <StepReviewDocument {...stepProps} />;
      case 3:
        return <StepSelectParticipants {...stepProps} />;
      case 4:
        return <StepConfirm {...stepProps} onExecute={executeAppointment} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>⚖️</span>
            Сделать назначку (КоАП)
          </h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.progress}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.progressStep} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
              onClick={() => goToStep(index)}
            >
              <span className={styles.progressIcon}>{step.icon}</span>
              <span className={styles.progressLabel}>{step.title}</span>
              {index < currentStep && <span className={styles.progressCheck}>✓</span>}
            </div>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : (
            renderStep()
          )}
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={loading}
          >
            Отмена
          </button>
          
          {currentStep > 0 && (
            <button 
              className={styles.prevButton} 
              onClick={prevStep}
              disabled={loading}
            >
              Назад
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button 
              className={styles.nextButton} 
              onClick={nextStep}
              disabled={!isStepValid() || loading}
            >
              Далее →
            </button>
          ) : (
            <button 
              className={styles.executeButton} 
              onClick={executeAppointment}
              disabled={!isStepValid() || loading}
            >
              {loading ? 'Выполняется...' : '✅ Выполнить назначку'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentWizardCoap;