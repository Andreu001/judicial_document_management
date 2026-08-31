import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentService from '../../../API/DocumentService';
import CaseManagementService from '../../../API/CaseManagementService';
import styles from './AppointmentWizard.module.css';

// Компоненты шагов
import StepSelectDate from './StepSelectDate';
import StepSelectType from './StepSelectType';
import StepReviewDocument from './StepReviewDocument';
import StepSelectParticipants from './StepSelectParticipants';
import StepConfirm from './StepConfirm';

const AppointmentWizard = ({ 
  isOpen, 
  onClose, 
  caseId, 
  caseType = 'criminal',
  caseNumber,
  onSuccess 
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [allSides, setAllSides] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);

  const [wizardData, setWizardData] = useState({
    hearingDate: '',
    hearingTime: '',
    hearingRoom: '',
    hearingType: 'court_session',
    sessionType: 'open',
    courtComposition: 'single',
    needsLawyer: true,
    needsProsecutor: true,
    documentTemplate: null,
    documentContent: '',
    documentTitle: '',
    selectedTemplateId: null,
    selectedParticipants: [],
    participantChannels: {},
    confirmed: false,
  });

  const steps = [
    { id: 'date', title: 'Дата и время' },
    { id: 'type', title: 'Параметры заседания' },
    { id: 'document', title: 'Постановление' },
    { id: 'participants', title: 'Участники' },
    { id: 'confirm', title: 'Подтверждение' },
  ];

  // Загрузка данных дела при открытии
  useEffect(() => {
    if (isOpen && caseId) {
      loadCaseData();
    }
  }, [isOpen, caseId, caseType]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let caseDataResponse = null;
      let sidesResponse = [];
      
      if (caseType === 'criminal') {
        const CriminalCaseService = (await import('../../../API/CriminalCaseService')).default;
        caseDataResponse = await CriminalCaseService.getCriminalProceedingById(caseId);
        sidesResponse = await CriminalCaseService.getAllSides(caseId);
      } else if (caseType === 'civil') {
        const CivilCaseService = (await import('../../../API/CivilCaseService')).default;
        caseDataResponse = await CivilCaseService.getCivilProceedingById(caseId);
        sidesResponse = await CivilCaseService.getAllSides(caseId);
      } else if (caseType === 'kas') {
        const KasCaseService = (await import('../../../API/KasCaseService')).default;
        caseDataResponse = await KasCaseService.getKasProceedingById(caseId);
        sidesResponse = await KasCaseService.getAllSides(caseId);
      } else if (caseType === 'coap') {
        const AdministrativeCaseService = (await import('../../../API/AdministrativeCaseService')).default;
        caseDataResponse = await AdministrativeCaseService.getAdminProceedingById(caseId);
        sidesResponse = await AdministrativeCaseService.getAllSides(caseId);
      }
      
      setCaseData(caseDataResponse);
      
      // Получаем шаблоны документов
      const templatesResponse = await DocumentService.getTemplates(caseType, caseId);
      setTemplates(templatesResponse);
      
      // Автоматически выбираем подходящий шаблон
      const defaultTemplate = templatesResponse.find(t => 
        t.name && (
          t.name.toLowerCase().includes('назначение') || 
          t.name.toLowerCase().includes('заседания') ||
          t.name.toLowerCase().includes('слушания')
        )
      );
      
      if (defaultTemplate) {
        setWizardData(prev => ({
          ...prev,
          selectedTemplateId: defaultTemplate.id,
          documentTemplate: defaultTemplate
        }));
      }
      
      // Автоматически выбираем всех основных участников
      const defaultParticipants = sidesResponse.map(side => ({
        ...side,
        selected: true,
        channel: 'online'
      }));
      
      setWizardData(prev => ({
        ...prev,
        selectedParticipants: defaultParticipants,
        participantChannels: defaultParticipants.reduce((acc, p) => {
          acc[`${p.type}-${p.id}`] = 'online';
          return acc;
        }, {})
      }));
      
    } catch (error) {
      console.error('Error loading case data:', error);
      setError('Не удалось загрузить данные дела');
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
      alert('Выберите шаблон документа');
      return;
    }

    try {
      setLoading(true);
      
      const documentData = {
        template: wizardData.selectedTemplateId,
        title: wizardData.documentTitle || generateDocumentTitle(),
        content: wizardData.documentContent || generateDocumentContent(),
      };
      
      const response = await DocumentService.createDocument(caseType, caseId, documentData);
      
      updateWizardData({
        documentId: response.id,
        documentContent: response.content
      });
      
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Не удалось сгенерировать постановление');
    } finally {
      setLoading(false);
    }
  };

  const generateDocumentTitle = () => {
    const hearingTypeLabels = {
      'preliminary': 'предварительного слушания',
      'court_session': 'судебного заседания'
    };
    const typeLabel = hearingTypeLabels[wizardData.hearingType] || 'судебного заседания';
    return `Постановление о назначении ${typeLabel}`;
  };

  const generateDocumentContent = () => {
    const date = new Date(wizardData.hearingDate);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const judgeName = caseData?.presiding_judge_name || '[ФИО судьи]';
    const caseNumberText = caseNumber || '[Номер дела]';
    
    const hearingTypeLabels = {
      'preliminary': 'предварительного слушания',
      'court_session': 'судебного заседания'
    };
    const typeLabel = hearingTypeLabels[wizardData.hearingType] || 'судебного заседания';
    
    const sessionTypeLabel = wizardData.sessionType === 'open' ? 'открытом' : 'закрытом';
    
    const compositionLabels = {
      'single': 'единолично судьей',
      'collegium': 'коллегией судей',
      'jury': 'с участием присяжных заседателей'
    };
    const compositionLabel = compositionLabels[wizardData.courtComposition] || 'единолично судьей';
    
    const selectedNames = wizardData.selectedParticipants
      .filter(p => p.selected)
      .map(p => p.name)
      .join(', ');
    
    return `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2>ПОСТАНОВЛЕНИЕ</h2>
        <p>о назначении ${typeLabel}</p>
      </div>
      
      <p>г. Москва &nbsp;&nbsp;&nbsp;&nbsp; ${formattedDate}</p>
      
      <p>Судья ${judgeName}, рассмотрев материалы дела № ${caseNumberText},</p>
      
      <p><strong>УСТАНОВИЛ:</strong></p>
      
      <p>Дело № ${caseNumberText} поступило в производство судьи ${judgeName}.</p>
      
      <p><strong>ПОСТАНОВИЛ:</strong></p>
      
      <ol>
        <li>Назначить ${typeLabel} по делу № ${caseNumberText} на <strong>${formattedDate} в ${wizardData.hearingTime}</strong>.</li>
        <li>Судебное заседание провести в ${sessionTypeLabel} режиме.</li>
        <li>Рассмотрение дела провести ${compositionLabel}.</li>
        <li>Вызвать в судебное заседание: ${selectedNames}.</li>
        ${wizardData.needsLawyer ? '<li>Обеспечить участие защитника.</li>' : ''}
        ${wizardData.needsProsecutor ? '<li>Уведомить прокурора о дате и времени судебного заседания.</li>' : ''}
        <li>Копию постановления направить участникам процесса.</li>
      </ol>
      
      <p style="margin-top: 30px;">
        Судья: ____________________
      </p>
    `;
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
        const response = await DocumentService.createDocument(caseType, caseId, docData);
        documentId = response.id;
      }
      
      // 2. Создаем уведомления для выбранных участников
      const selectedParticipants = wizardData.selectedParticipants.filter(p => p.selected);
      
      const templates = await CaseManagementService.getNotificationTemplates(caseType);
      const templateMap = {};
      templates.forEach(t => {
        templateMap[`${t.case_category}-${t.participant_type}`] = t;
      });
      
      for (const participant of selectedParticipants) {
        const participantKey = `${participant.type}-${participant.id}`;
        const channelName = wizardData.participantChannels[participantKey] || 'online';
        
        // Находим подходящий шаблон
        const template = templateMap[`${caseType}-${participant.type}`];
        
        let messageText = '';
        if (template) {
          messageText = template.content
            .replace(/\{\{ case_number \}\}/g, caseNumber || '№ ___________')
            .replace(/\{\{ full_name \}\}/g, participant.name || 'Участник')
            .replace(/\{\{ hearing_date \}\}/g, new Date(wizardData.hearingDate).toLocaleDateString('ru-RU'))
            .replace(/\{\{ hearing_time \}\}/g, wizardData.hearingTime || '10:00')
            .replace(/\{\{ hearing_room \}\}/g, wizardData.hearingRoom || '');
        } else {
          messageText = `Уведомление о судебном заседании по делу № ${caseNumber || '...'}\n\nДата: ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')}\nВремя: ${wizardData.hearingTime}\nЗал: ${wizardData.hearingRoom || 'не указан'}\n\nУчастник: ${participant.name}`;
        }
        
        const notificationData = {
          case_type: caseType,
          case_id: parseInt(caseId),
          participant_type: participant.type,
          participant_id: parseInt(participant.id),
          hearing_date: wizardData.hearingDate,
          hearing_time: wizardData.hearingTime,
          hearing_room: wizardData.hearingRoom || '',
          channel: channelName,
          template: template ? template.id : null,
          message_text: messageText,
          participant_name: participant.name,
          participant_role: participant.role || participant.type
        };
        
        await CaseManagementService.createNotification(notificationData);
      }
      
      // 3. Добавляем запись в справочный лист
      try {
        const actionTypes = await CaseManagementService.getProgressActionTypes();
        let actionTypeId = null;
        const searchTerms = ['назначение', 'судебное заседание', 'предварительное слушание'];
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
          const progressData = {
            action_type: actionTypeId,
            description: `Назначено заседание на ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')} ${wizardData.hearingTime}`,
            action_date: wizardData.hearingDate
          };
          await CaseManagementService.createProgressEntry(caseType, caseId, progressData);
        }
      } catch (progressError) {
        console.error('Error creating progress entry:', progressError);
      }
      
      // 4. Добавляем запись в движение дела
      try {
        await addCaseMovement();
      } catch (movementError) {
        console.error('Error creating case movement:', movementError);
      }
      
      // 5. Обновляем дату рассмотрения в деле
      await updateCaseConsiderationDate();
      
      alert('Назначка успешно выполнена!');
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error executing appointment:', error);
      alert(`Не удалось выполнить назначку: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addCaseMovement = async () => {
    // Логика добавления движения дела в зависимости от типа
    const movementData = {
      date_meeting: wizardData.hearingDate,
      meeting_time: wizardData.hearingTime,
      result_court_session: `Назначено заседание на ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')}`
    };
    
    if (caseType === 'criminal') {
      const CriminalCaseService = (await import('../../../API/CriminalCaseService')).default;
      await CriminalCaseService.createCaseMovement(caseId, movementData);
    } else if (caseType === 'civil') {
      const CivilCaseService = (await import('../../../API/CivilCaseService')).default;
      await CivilCaseService.createCaseMovement(caseId, movementData);
    } else if (caseType === 'kas') {
      const KasCaseService = (await import('../../../API/KasCaseService')).default;
      await KasCaseService.createCaseMovement(caseId, movementData);
    } else if (caseType === 'coap') {
      const AdministrativeCaseService = (await import('../../../API/AdministrativeCaseService')).default;
      await AdministrativeCaseService.createCaseMovement(caseId, movementData);
    }
  };

  const updateCaseConsiderationDate = async () => {
    const updateData = { hearing_date: wizardData.hearingDate };
    
    if (caseType === 'criminal') {
      const CriminalCaseService = (await import('../../../API/CriminalCaseService')).default;
      await CriminalCaseService.updateCriminalProceedings(caseId, updateData);
    } else if (caseType === 'civil') {
      const CivilCaseService = (await import('../../../API/CivilCaseService')).default;
      await CivilCaseService.updateCivilProceedings(caseId, updateData);
    } else if (caseType === 'kas') {
      const KasCaseService = (await import('../../../API/KasCaseService')).default;
      await KasCaseService.updateKasProceedings(caseId, updateData);
    } else if (caseType === 'coap') {
      const AdministrativeCaseService = (await import('../../../API/AdministrativeCaseService')).default;
      await AdministrativeCaseService.updateAdminProceedings(caseId, updateData);
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
      caseType,
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
          <h2 className={styles.title}>Сделать назначку</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.progress}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.progressStep} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
              onClick={() => goToStep(index)}
            >
              <span className={styles.progressLabel}>{step.title}</span>
              {index < currentStep && <span className={styles.progressCheck}>✓</span>}
            </div>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            renderStep()
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}>
            Отмена
          </button>
          
          {currentStep > 0 && (
            <button className={styles.prevButton} onClick={prevStep} disabled={loading}>
              Назад
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button className={styles.nextButton} onClick={nextStep} disabled={!isStepValid() || loading}>
              Далее →
            </button>
          ) : (
            <button className={styles.executeButton} onClick={executeAppointment} disabled={!isStepValid() || loading}>
              {loading ? 'Выполняется...' : 'Выполнить назначку'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentWizard;