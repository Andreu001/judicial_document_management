// src/components/Criminal/AppointmentWizard/AppointmentWizard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentService from '../../../API/DocumentService';
import CaseManagementService from '../../../API/CaseManagementService';
import CriminalCaseService from '../../../API/CriminalCaseService';
import useModalDialog from '../../../hooks/useModalDialog';
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
  caseNumber,
  onSuccess 
}) => {
  const navigate = useNavigate();
  const { showInfo, showError } = useModalDialog();
  
  // Состояние мастера
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [allSides, setAllSides] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Данные формы
  const [wizardData, setWizardData] = useState({
    // Шаг 1: Дата и время
    hearingDate: '',
    hearingTime: '',
    hearingRoom: '',
    
    // Шаг 2: Тип заседания
    hearingType: 'court_session', // 'preliminary' | 'court_session'
    sessionType: 'open', // 'open' | 'closed'
    courtComposition: 'single', // 'single' | 'collegium' | 'jury'
    needsLawyer: true,
    needsProsecutor: true,
    
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
    { id: 'type', title: 'Параметры заседания', icon: '⚖️' },
    { id: 'document', title: 'Постановление', icon: '📄' },
    { id: 'participants', title: 'Участники и повестки', icon: '👥' },
    { id: 'confirm', title: 'Подтверждение', icon: '✅' },
  ];

  // Загрузка данных дела при открытии
  useEffect(() => {
    if (isOpen && caseId) {
      loadCaseData();
    }
  }, [isOpen, caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      
      // Получаем данные дела
      const caseDataResponse = await CriminalCaseService.getCriminalProceedingById(caseId);
      setCaseData(caseDataResponse);
      
      // Получаем всех участников
      const sidesResponse = await CriminalCaseService.getAllSides(caseId);
      setAllSides(sidesResponse);
      
      // Получаем шаблоны документов для уголовных дел
      const templatesResponse = await DocumentService.getCriminalDocumentTemplates(caseId);
      setTemplates(templatesResponse);
      
      // Автоматически выбираем подходящий шаблон
      const defaultTemplate = templatesResponse.find(t => 
        t.name.includes('назначение') || 
        t.name.includes('судебного заседания') ||
        t.name.includes('предварительного слушания')
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

  // Обновление данных мастера
  const updateWizardData = (newData) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  // Навигация по шагам
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

  // Проверка валидности текущего шага
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Дата
        return wizardData.hearingDate && wizardData.hearingTime;
      case 1: // Тип
        return wizardData.hearingType;
      case 2: // Документ
        return wizardData.selectedTemplateId && wizardData.documentContent;
      case 3: // Участники
        return wizardData.selectedParticipants.some(p => p.selected);
      case 4: // Подтверждение
        return true;
      default:
        return false;
    }
  };

  // Генерация постановления
  const generateDocument = async () => {
    if (!wizardData.selectedTemplateId) {
      showError('Ошибка', 'Выберите шаблон документа');
      return;
    }

    try {
      setLoading(true);
      
      // Здесь будет логика генерации документа на основе шаблона и данных
      // Используем существующий метод для создания документа
      const documentData = {
        template: wizardData.selectedTemplateId,
        title: wizardData.documentTitle || `Постановление о назначении ${wizardData.hearingType === 'preliminary' ? 'предварительного слушания' : 'судебного заседания'}`,
        content: wizardData.documentContent || generateDocumentContent(),
      };
      
      // Создаем документ через существующий сервис
      const response = await DocumentService.createCriminalDocument(caseId, documentData);
      
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

  // Генерация содержимого документа
  const generateDocumentContent = () => {
    const date = new Date(wizardData.hearingDate);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const judgeName = caseData?.presiding_judge_name || '[ФИО судьи]';
    const caseNumberText = caseData?.case_number_criminal || '[Номер дела]';
    
    let content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2>ПОСТАНОВЛЕНИЕ</h2>
        <p>о назначении ${wizardData.hearingType === 'preliminary' ? 'предварительного слушания' : 'судебного заседания'}</p>
      </div>
      
      <p>г. Москва &nbsp;&nbsp;&nbsp;&nbsp; ${formattedDate}</p>
      
      <p>Судья ${judgeName}, рассмотрев материалы уголовного дела № ${caseNumberText},</p>
      
      <p><strong>УСТАНОВИЛ:</strong></p>
      
      <p>Уголовное дело № ${caseNumberText} поступило в производство судьи ${judgeName}.</p>
      
      <p>На основании ст. ${wizardData.hearingType === 'preliminary' ? '227, 229' : '231'} УПК РФ,</p>
      
      <p><strong>ПОСТАНОВИЛ:</strong></p>
      
      <ol>
        <li>Назначить ${wizardData.hearingType === 'preliminary' ? 'предварительное слушание' : 'судебное заседание'} по уголовному делу № ${caseNumberText} на <strong>${formattedDate} в ${wizardData.hearingTime}</strong>.</li>
        <li>Судебное заседание провести в ${wizardData.sessionType === 'open' ? 'открытом' : 'закрытом'} режиме.</li>
        ${wizardData.courtComposition === 'single' ? '<li>Рассмотрение дела провести единолично судьей.</li>' : ''}
        ${wizardData.courtComposition === 'collegium' ? '<li>Рассмотрение дела провести коллегией судей.</li>' : ''}
        ${wizardData.courtComposition === 'jury' ? '<li>Рассмотрение дела провести с участием присяжных заседателей.</li>' : ''}
        <li>Вызвать в судебное заседание: ${wizardData.selectedParticipants.filter(p => p.selected).map(p => p.name).join(', ')}.</li>
        ${wizardData.needsLawyer ? '<li>Обеспечить участие защитника в соответствии со ст. 51 УПК РФ.</li>' : ''}
        ${wizardData.needsProsecutor ? '<li>Уведомить прокурора о дате и времени судебного заседания.</li>' : ''}
        <li>Копию постановления направить участникам процесса.</li>
      </ol>
      
      <p style="margin-top: 30px;">
        Судья: ____________________
      </p>
    `;
    
    return content;
  };

  // Основная функция выполнения назначки
  const executeAppointment = async () => {
    try {
      setLoading(true);
      
      // 1. Сохраняем постановление (если еще не сохранено)
      let documentId = wizardData.documentId;
      if (!documentId) {
        const docData = {
          template: wizardData.selectedTemplateId,
          title: wizardData.documentTitle || `Постановление о назначении ${wizardData.hearingType === 'preliminary' ? 'предварительного слушания' : 'судебного заседания'}`,
          content: wizardData.documentContent || generateDocumentContent(),
        };
        const response = await DocumentService.createCriminalDocument(caseId, docData);
        documentId = response.id;
      }
      
      // 2. Создаем уведомления для выбранных участников с использованием шаблонов
      const selectedParticipants = wizardData.selectedParticipants.filter(p => p.selected);
      
      // Получаем список доступных каналов
      const channels = await CaseManagementService.getNotificationChannels();
      const channelMap = {};
      channels.forEach(ch => {
        channelMap[ch.name?.toLowerCase()] = ch.id;
        channelMap[ch.code?.toLowerCase()] = ch.id;
      });
      
      // Получаем шаблоны уведомлений для уголовных дел
      const templates = await CaseManagementService.getNotificationTemplates('criminal');
      const templateMap = {};
      templates.forEach(t => {
        templateMap[`${t.case_category}-${t.participant_type}`] = t;
      });
      
      // Сопоставление типов участников с типами в шаблонах
      const participantTypeMap = {
        'defendant': 'defendant',
        'side': 'side',
        'lawyer': 'lawyer'
      };
      
      // Сопоставление строковых названий каналов с ID
      const channelNameToId = (channelName) => {
        const map = {
          'online': 'online',
          'email': 'email',
          'paper': 'paper',
          'phone': 'phone',
          'mail': 'mail',
          'through_court': 'through_court'
        };
        const mappedName = map[channelName] || 'online';
        return channelMap[mappedName] || channelMap['online'];
      };
      
      for (const participant of selectedParticipants) {
        const participantKey = `${participant.type}-${participant.id}`;
        const channelName = wizardData.participantChannels[participantKey] || 'online';
        const channelId = channelNameToId(channelName);
        
        // Находим подходящий шаблон для участника
        const templateType = participantTypeMap[participant.type] || 'side';
        const templateKey = `criminal-${templateType}`;
        const template = templateMap[templateKey];
        
        // Формируем текст уведомления на основе шаблона
        let messageText = '';
        if (template) {
          // Подставляем переменные в шаблон
          messageText = template.content
            .replace(/\{\{ case_number \}\}/g, caseNumber || '№ ___________')
            .replace(/\{\{ full_name \}\}/g, participant.name || 'Участник')
            .replace(/\{\{ hearing_date \}\}/g, new Date(wizardData.hearingDate).toLocaleDateString('ru-RU'))
            .replace(/\{\{ hearing_time \}\}/g, wizardData.hearingTime || '10:00')
            .replace(/\{\{ hearing_room \}\}/g, wizardData.hearingRoom || '')
            .replace(/\{\{ court_name \}\}/g, 'Районный суд')
            .replace(/\{\{ address \}\}/g, 'г. Москва, ул. Примерная, д. 1');
        } else {
          // Если шаблон не найден, используем стандартный текст
          messageText = `Уведомление о судебном заседании по уголовному делу № ${caseNumber || '...'}\n\nДата: ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')}\nВремя: ${wizardData.hearingTime}\nЗал: ${wizardData.hearingRoom || 'не указан'}\n\nУчастник: ${participant.name}`;
        }
        
        // Создаем уведомление с использованием шаблона
        const notificationData = {
          case_type: 'criminal',
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
        
        console.log('Creating notification for participant:', notificationData);
        
        try {
          await CaseManagementService.createNotification(notificationData);
        } catch (notifError) {
          console.error('Error creating notification for participant:', participant, notifError);
        }
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
            description: `Назначено ${wizardData.hearingType === 'preliminary' ? 'предварительное слушание' : 'судебное заседание'} на ${new Date(wizardData.hearingDate).toLocaleDateString('ru-RU')} ${wizardData.hearingTime}`,
            action_date: wizardData.hearingDate
          };
          
          console.log('Creating progress entry with data:', progressData);
          await CaseManagementService.createProgressEntry('criminal', caseId, progressData);
        } else {
          console.warn('No action type found for progress entry');
        }
      } catch (progressError) {
        console.error('Error creating progress entry:', progressError);
      }
      
      // 4. ДОБАВЛЯЕМ ЗАПИСЬ В ДВИЖЕНИЕ ДЕЛА
      try {
        // Получаем список решений для выпадающего списка
        const decisionsList = await CriminalCaseService.getCriminalDecisionsList();
        
        // Находим решение "Назначено судебное заседание" или используем первое
        let decisionCaseIds = [];
        const appointmentDecision = decisionsList.find(d => 
          d.name_case && (
            d.name_case.toLowerCase().includes('назначение') ||
            d.name_case.toLowerCase().includes('назначен')
          )
        );
        
        if (appointmentDecision) {
          decisionCaseIds = [appointmentDecision.id];
        }
        
        // Создаем движение дела
        const movementData = {
          date_meeting: wizardData.hearingDate,
          meeting_time: wizardData.hearingTime,
          decision_case: decisionCaseIds,
          composition_colleges: '',
          result_court_session: `Назначено ${wizardData.hearingType === 'preliminary' ? 'предварительное слушание' : 'судебное заседание'}`,
          reason_deposition: ''
        };
        
        console.log('Creating case movement with data:', movementData);
        await CriminalCaseService.createCaseMovement(caseId, movementData);
        console.log('Case movement created successfully');
      } catch (movementError) {
        console.error('Error creating case movement:', movementError);
        // Не прерываем выполнение, если не удалось создать движение
      }
      
      // 5. Обновляем дату рассмотрения в деле
      await CriminalCaseService.updateCriminalProceedings(caseId, {
        consideration_date: wizardData.hearingDate
      });
      
      showInfo('Успешно', 'Назначка успешно выполнена!');
      
      // Закрываем мастер и обновляем данные
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error executing appointment:', error);
      showError('Ошибка', `Не удалось выполнить назначку: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Рендер шага
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
            Сделать назначку
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

export default AppointmentWizard;