// SideProfile.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSideAuth } from '../../context/SideAuthContext';
import SideCaseService from '../../API/SideCaseService';
import DocumentService from '../../API/DocumentService';
import styles from './SideProfile.module.css';

const SideProfile = () => {
  const { user, syncAccess, syncing, updateProfile, logout } = useSideAuth();
  const [cases, setCases] = useState({});
  const [loadingCases, setLoadingCases] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [syncResult, setSyncResult] = useState(null);
  const [showPetitionModal, setShowPetitionModal] = useState(false);
  const [petitionText, setPetitionText] = useState('');
  const [petitionCase, setPetitionCase] = useState(null);
  const [submittingPetition, setSubmittingPetition] = useState(false);
  
  // Состояние для модального окна досылки документов
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentFormData, setDocumentFormData] = useState({
    document_type: '',
    title: '',
    description: '',
    submitter_name: '',
    submitter_role: '',
    submission_method: 'online',
    document_file: null
  });
  const [documentErrors, setDocumentErrors] = useState({});
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryFromUrl = searchParams.get('category');

  // Функция для преобразования типа дела из API в тип для маршрутов
  const mapCaseTypeToRoute = (caseType) => {
    const typeMap = {
      'criminal': 'criminal',
      'criminalproceedings': 'criminal',
      'civil': 'civil',
      'civilproceedings': 'civil',
      'kas': 'kas',
      'kasproceedings': 'kas',
      'administrative': 'admin',
      'administrativeproceedings': 'admin',
      'coap': 'admin',
      'admin_offense': 'admin',
      'admin': 'admin'
    };
    return typeMap[caseType] || caseType;
  };

  // Функция для получения content_type модели для бэкенда
  const getContentTypeModel = (caseType) => {
    const mapping = {
      criminal: 'criminalproceedings',
      civil: 'civilproceedings',
      admin: 'administrativeproceedings',
      kas: 'kasproceedings'
    };
    const routeType = mapCaseTypeToRoute(caseType);
    return mapping[routeType] || 'civilproceedings';
  };

  // Подача нового иска (создание нового дела)
  const handleNewClaim = () => {
    navigate('/civil-claim/new');
  };

  // Загрузка списка дел
  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const casesData = await SideCaseService.getUserCases();
      
      const normalizedCases = {};
      for (const [key, value] of Object.entries(casesData)) {
        const normalizedKey = key.toLowerCase();
        normalizedCases[normalizedKey] = value;
      }
      
      setCases(normalizedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSync = async () => {
    const result = await syncAccess();
    if (result.success) {
      setSyncResult(result.result);
      await loadCases();
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const handleViewCase = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/case-view/${routeType}/${caseId}`);
  };

  const handlePetitionClick = (caseType, caseId, caseNumber, sideName) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/side-petition/${routeType}/${caseId}`, {
      state: { caseNumber, caseId, caseType: routeType, sideName }
    });
  };

  const handleDecisionClick = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/documents/${routeType}/${caseId}`);
  };

  // Открытие модального окна для досылки документов с предзаполнением данных пользователя
  const openDocumentModal = (caseType, caseId, caseNumber, sideName) => {
    setPetitionCase({ 
      type: caseType, 
      id: caseId, 
      number: caseNumber,
      sideName: sideName 
    });
    
    // Предзаполняем форму данными пользователя
    setDocumentFormData({
      document_type: '',
      title: '',
      description: '',
      submitter_name: user?.full_name || '',
      submitter_role: sideName || 'Сторона',
      submission_method: 'online',
      document_file: null
    });
    setDocumentErrors({});
    setShowDocumentModal(true);
  };

  // Валидация формы документа
  const validateDocumentForm = () => {
    const errors = {};
    if (!documentFormData.document_type) {
      errors.document_type = 'Выберите тип документа';
    }
    if (!documentFormData.title.trim()) {
      errors.title = 'Введите название документа';
    }
    if (!documentFormData.submitter_name.trim()) {
      errors.submitter_name = 'Укажите имя подателя';
    }
    if (!documentFormData.document_file) {
      errors.document_file = 'Выберите файл документа';
    }
    setDocumentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Отправка документа через PartyDocument API
  const submitDocument = async () => {
    if (!validateDocumentForm()) {
      return;
    }
    
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('content_type', getContentTypeModel(petitionCase.type));
      formData.append('object_id', petitionCase.id);
      formData.append('document_type', documentFormData.document_type);
      formData.append('title', documentFormData.title);
      formData.append('description', documentFormData.description || '');
      formData.append('submitter_name', documentFormData.submitter_name);
      formData.append('submitter_role', documentFormData.submitter_role || '');
      formData.append('submission_method', documentFormData.submission_method);
      formData.append('document_file', documentFormData.document_file);

      console.log('Submitting party document:', {
        caseType: petitionCase.type,
        caseId: petitionCase.id,
        document_type: documentFormData.document_type,
        title: documentFormData.title
      });

      const result = await DocumentService.createPartyDocument(formData);
      
      console.log('Document uploaded successfully:', result);
      alert('Документ успешно загружен! Он будет рассмотрен судом.');
      
      setShowDocumentModal(false);
      setDocumentFormData({
        document_type: '',
        title: '',
        description: '',
        submitter_name: user?.full_name || '',
        submitter_role: '',
        submission_method: 'online',
        document_file: null
      });
      
    } catch (error) {
      console.error('Error uploading document:', error);
      let errorMsg = 'Ошибка при загрузке документа';
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('; ');
          errorMsg = errors;
        } else {
          errorMsg = error.response.data.error || error.response.data;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      alert('Ошибка при загрузке документа: ' + errorMsg);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Обработка изменения полей формы
  const handleDocumentFormChange = (e) => {
    const { name, value } = e.target;
    setDocumentFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля
    if (documentErrors[name]) {
      setDocumentErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024; // 20 MB
      if (file.size > maxSize) {
        setDocumentErrors(prev => ({ ...prev, document_file: 'Файл не должен превышать 20 МБ' }));
        return;
      }
      setDocumentFormData(prev => ({ ...prev, document_file: file }));
      if (documentErrors.document_file) {
        setDocumentErrors(prev => ({ ...prev, document_file: '' }));
      }
    }
  };

  const submitPetition = async () => {
    if (!petitionText.trim()) {
      alert('Введите текст ходатайства');
      return;
    }
    
    setSubmittingPetition(true);
    try {
      await SideCaseService.createPetition(
        petitionCase.type,
        petitionCase.id,
        petitionText
      );
      alert('Ходатайство успешно подано!');
      setShowPetitionModal(false);
      setPetitionText('');
      setPetitionCase(null);
    } catch (error) {
      alert('Ошибка при подаче ходатайства: ' + error.message);
    } finally {
      setSubmittingPetition(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (categoryFromUrl) {
      const categoryMap = {
        'criminal': 'criminal',
        'civil': 'civil', 
        'kas': 'kas',
        'admin-offenses': 'administrative'
      };
      setActiveCategory(categoryMap[categoryFromUrl] || 'all');
    } else {
      setActiveCategory('all');
    }
  }, [categoryFromUrl]);

  const getFilteredCases = () => {
    if (activeCategory === 'all') {
      return cases;
    }
    
    const filtered = {};
    
    switch (activeCategory) {
      case 'criminal':
        if (cases['criminal']?.length > 0) filtered['criminal'] = cases['criminal'];
        else if (cases['criminalproceedings']?.length > 0) filtered['criminalproceedings'] = cases['criminalproceedings'];
        break;
      case 'civil':
        if (cases['civil']?.length > 0) filtered['civil'] = cases['civil'];
        else if (cases['civilproceedings']?.length > 0) filtered['civilproceedings'] = cases['civilproceedings'];
        break;
      case 'kas':
        if (cases['kas']?.length > 0) filtered['kas'] = cases['kas'];
        else if (cases['kasproceedings']?.length > 0) filtered['kasproceedings'] = cases['kasproceedings'];
        break;
      case 'administrative':
        if (cases['administrative']?.length > 0) filtered['administrative'] = cases['administrative'];
        else if (cases['administrativeproceedings']?.length > 0) filtered['administrativeproceedings'] = cases['administrativeproceedings'];
        else if (cases['coap']?.length > 0) filtered['coap'] = cases['coap'];
        else if (cases['admin']?.length > 0) filtered['admin'] = cases['admin'];
        break;
      default:
        return cases;
    }
    
    return filtered;
  };

  const getCaseTypeName = (type) => {
    const names = {
      criminal: 'Уголовное дело',
      criminalproceedings: 'Уголовное дело',
      civil: 'Гражданское дело',
      civilproceedings: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      kasproceedings: 'Административное дело (КАС РФ)',
      administrative: 'Дело об АП (КоАП РФ)',
      administrativeproceedings: 'Дело об АП (КоАП РФ)',
      coap: 'Дело об АП (КоАП РФ)',
      admin: 'Дело об АП (КоАП РФ)'
    };
    return names[type] || type;
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { text: 'В производстве', className: styles.statusPending },
      'in_progress': { text: 'В производстве', className: styles.statusPending },
      'completed': { text: 'Завершено', className: styles.statusCompleted },
      'archived': { text: 'В архиве', className: styles.statusArchived },
      'suspended': { text: 'Приостановлено', className: styles.statusSuspended },
      'active': { text: 'В производстве', className: styles.statusPending }
    };
    const config = statusConfig[status] || { text: status || 'Неизвестно', className: styles.statusUnknown };
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.text}</span>;
  };

  const getDocumentTypes = () => {
    return [
      { value: 'statement_of_claim', label: 'Исковое заявление' },
      { value: 'petition', label: 'Ходатайство' },
      { value: 'motion', label: 'Заявление' },
      { value: 'objection', label: 'Возражение' },
      { value: 'appeal', label: 'Апелляционная жалоба' },
      { value: 'cassation', label: 'Кассационная жалоба' },
      { value: 'evidence', label: 'Доказательство' },
      { value: 'response', label: 'Отзыв' },
      { value: 'explanation', label: 'Пояснение' },
      { value: 'other', label: 'Иной документ' },
    ];
  };

  const showProfileSection = activeCategory === 'all';
  const filteredCases = getFilteredCases();
  const hasCases = Object.values(filteredCases).some(arr => arr && arr.length > 0);
  const documentTypes = getDocumentTypes();

  return (
    <div className={styles.container}>
      {showProfileSection && (
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.full_name?.charAt(0) || 'У'}
            </div>
            <div className={styles.userDetails}>
              <h1>{user?.full_name || 'Участник процесса'}</h1>
              <p className={styles.email}>{user?.email || 'Email не указан'}</p>
              <p className={styles.provider}>
                Вход через: {user?.social_provider === 'yandex' ? 'Яндекс ID' : user?.social_provider === 'vk' ? 'ВКонтакте' : 'Неизвестно'}
              </p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            {/* НОВАЯ КНОПКА: Подача нового иска (создание отдельного дела) */}
            <button 
              className={styles.newClaimButton}
              onClick={handleNewClaim}
            >
              📋 Подать исковое заявление
            </button>
            <button 
              className={styles.syncButton} 
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Синхронизация...' : 'Синхронизировать дела'}
            </button>
            <button 
              className={styles.logoutButton} 
              onClick={logout}
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      {showProfileSection && syncResult && (
        <div className={styles.syncResult}>
          <p>Синхронизация завершена!</p>
          <p>Найдено дел: {syncResult.cases_found}, добавлено: {syncResult.cases_added}, удалено: {syncResult.cases_removed}</p>
        </div>
      )}

      {showProfileSection && (
        <div className={styles.passportSection}>
          <div className={styles.sectionHeader}>
            <h3>Паспортные данные</h3>
          </div>
          <div className={styles.passportFields}>
            <div className={styles.field}>
              <label>Серия паспорта</label>
              <span>{user?.passport_series || 'Не указано'}</span>
            </div>
            <div className={styles.field}>
              <label>Номер паспорта</label>
              <span>{user?.passport_number || 'Не указано'}</span>
            </div>
            <div className={styles.field}>
              <label>Телефон</label>
              <span>{user?.phone || 'Не указан'}</span>
            </div>
          </div>
          <div className={styles.passportHint}>
            Укажите данные паспорта для более точной синхронизации с делами
          </div>
        </div>
      )}

      <div className={styles.casesHeader}>
        <h2>
          {activeCategory === 'all' ? 'Мои дела' : getCaseTypeName(activeCategory)}
        </h2>
        {activeCategory !== 'all' && (
          <button 
            className={styles.showAllButton}
            onClick={() => navigate('/my-cases')}
          >
            ← Показать все дела
          </button>
        )}
      </div>

      <div className={styles.casesContainer}>
        {loadingCases ? (
          <div className={styles.loadingCases}>
            <div className={styles.spinner}></div>
            <p>Загрузка ваших дел...</p>
          </div>
        ) : hasCases ? (
          Object.entries(filteredCases).map(([caseType, caseList]) => (
            caseList && caseList.length > 0 && (
              <div key={caseType} className={styles.caseCategory}>
                {activeCategory === 'all' && (
                  <h3 className={styles.categoryTitle}>
                    {getCaseTypeName(caseType)}
                    <span className={styles.categoryCount}>{caseList.length}</span>
                  </h3>
                )}
                <div className={styles.casesGrid}>
                  {caseList.map((caseItem, idx) => (
                    <div key={idx} className={styles.caseCard}>
                      <div className={styles.caseCardHeader}>
                        <div className={styles.caseNumber}>
                          <strong>Дело №</strong> {caseItem.case_number}
                        </div>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <div className={styles.caseCardBody}>
                        <div className={styles.caseInfo}>
                          <div className={styles.infoRow}>
                            <span>Ваша роль:</span>
                            <strong>{caseItem.side_name || 'Сторона'}</strong>
                          </div>
                          <div className={styles.infoRow}>
                            <span>Уровень доступа:</span>
                            <span className={styles.accessLevel}>
                              {caseItem.access_level === 'full' ? 'Полный' :
                               caseItem.access_level === 'petition' ? 'Подача ходатайств' :
                               caseItem.access_level === 'document' ? 'Досылка документов' :
                               'Просмотр'}
                            </span>
                          </div>
                          <div className={styles.infoRow}>
                            <span>Дата предоставления:</span>
                            <span>{new Date(caseItem.granted_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.caseCardActions}>
                        <button 
                          className={styles.viewButton}
                          onClick={() => handleViewCase(caseType, caseItem.case_id, caseItem.case_number)}
                        >
                          Подробнее
                        </button>
                        <button 
                          className={styles.petitionButton}
                          onClick={() => handlePetitionClick(caseType, caseItem.case_id, caseItem.case_number, caseItem.side_name)}
                          disabled={caseItem.access_level !== 'full' && caseItem.access_level !== 'petition'}
                        >
                          Ходатайство
                        </button>
                        <button 
                          className={styles.documentButton}
                          onClick={() => openDocumentModal(caseType, caseItem.case_id, caseItem.case_number, caseItem.side_name)}
                          disabled={caseItem.access_level !== 'full' && caseItem.access_level !== 'document'}
                          title={caseItem.access_level !== 'full' && caseItem.access_level !== 'document' ? 'Недостаточно прав' : ''}
                        >
                          Досылка документов
                        </button>
                        <button 
                          className={styles.decisionButton}
                          onClick={() => handleDecisionClick(caseType, caseItem.case_id, caseItem.case_number)}
                        >
                          Решения
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        ) : (
          <div className={styles.emptyCases}>            
            <h3>У вас пока нет дел</h3>
            {activeCategory === 'all' ? (
              <>
                <p>Нажмите кнопку "Синхронизировать дела", чтобы найти ваши дела по ФИО, email или паспортным данным</p>
                <p>Или подайте новое исковое заявление, чтобы создать дело</p>
              </>
            ) : (
              <p>В этой категории пока нет дел</p>
            )}
            {activeCategory === 'all' && (
              <div className={styles.emptyActions}>
                <button className={styles.syncEmptyButton} onClick={handleSync} disabled={syncing}>
                  {syncing ? 'Синхронизация...' : 'Синхронизировать дела'}
                </button>
                <button className={styles.newClaimEmptyButton} onClick={handleNewClaim}>
                  📋 Подать исковое заявление
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно ходатайства */}
      {showPetitionModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPetitionModal(false)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Подача ходатайства</h3>
              <button className={styles.modalClose} onClick={() => setShowPetitionModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.caseRef}>Дело №{petitionCase?.number}</p>
              <div className={styles.formGroup}>
                <label>Текст ходатайства *</label>
                <textarea
                  value={petitionText}
                  onChange={(e) => setPetitionText(e.target.value)}
                  rows={8}
                  placeholder="Введите текст ходатайства..."
                  className={styles.textarea}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.submitButton} 
                onClick={submitPetition}
                disabled={submittingPetition}
              >
                {submittingPetition ? 'Отправка...' : 'Отправить ходатайство'}
              </button>
              <button 
                className={styles.cancelModalButton} 
                onClick={() => setShowPetitionModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно досылки документов */}
      {showDocumentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDocumentModal(false)}>
          <div className={styles.modalDocument} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Досылка документов</h3>
              <button className={styles.modalClose} onClick={() => setShowDocumentModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.caseRef}>Дело №{petitionCase?.number}</p>
              
              <div className={styles.formGroup}>
                <label>Тип документа *</label>
                <select
                  name="document_type"
                  value={documentFormData.document_type}
                  onChange={handleDocumentFormChange}
                  className={`${styles.select} ${documentErrors.document_type ? styles.errorInput : ''}`}
                >
                  <option value="">Выберите тип документа</option>
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {documentErrors.document_type && <span className={styles.errorText}>{documentErrors.document_type}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Название документа *</label>
                <input
                  type="text"
                  name="title"
                  value={documentFormData.title}
                  onChange={handleDocumentFormChange}
                  placeholder="Например: Ходатайство о приобщении доказательств"
                  className={`${styles.input} ${documentErrors.title ? styles.errorInput : ''}`}
                />
                {documentErrors.title && <span className={styles.errorText}>{documentErrors.title}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Краткое описание</label>
                <textarea
                  name="description"
                  value={documentFormData.description}
                  onChange={handleDocumentFormChange}
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
                  value={documentFormData.submitter_name}
                  onChange={handleDocumentFormChange}
                  placeholder="Иванов Иван Иванович"
                  className={`${styles.input} ${documentErrors.submitter_name ? styles.errorInput : ''}`}
                />
                {documentErrors.submitter_name && <span className={styles.errorText}>{documentErrors.submitter_name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Роль подателя</label>
                <input
                  type="text"
                  name="submitter_role"
                  value={documentFormData.submitter_role}
                  onChange={handleDocumentFormChange}
                  placeholder="Например: Истец, Ответчик, Обвиняемый"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Файл документа *</label>
                <input
                  type="file"
                  onChange={handleDocumentFileChange}
                  className={`${styles.fileInput} ${documentErrors.document_file ? styles.errorInput : ''}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {documentErrors.document_file && <span className={styles.errorText}>{documentErrors.document_file}</span>}
                <p className={styles.fileHint}>Поддерживаемые форматы: PDF, DOC, DOCX, JPG, PNG. Максимум 20 МБ.</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.submitButton} 
                onClick={submitDocument}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? 'Загрузка...' : 'Отправить документ'}
              </button>
              <button 
                className={styles.cancelModalButton} 
                onClick={() => setShowDocumentModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideProfile;