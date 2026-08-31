// src/components/SideAuth/SideProfile.jsx
// Полностью переработанная версия с выбором региона и суда

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
  
  // ===== СОСТОЯНИЯ ДЛЯ РЕГИОНОВ И СУДОВ =====
  const [regions, setRegions] = useState([]);
  const [courtsByRegion, setCourtsByRegion] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [selectedCourtId, setSelectedCourtId] = useState('all');
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  
  const [showArchived, setShowArchived] = useState(false);
  
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
  const [petitionCase, setPetitionCase] = useState(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryFromUrl = searchParams.get('category');

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
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

  // ===== ЗАГРУЗКА РЕГИОНОВ =====
  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const data = await SideCaseService.getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  // ===== ЗАГРУЗКА СУДОВ ПО РЕГИОНУ =====
  const loadCourtsByRegion = async (regionId) => {
    if (!regionId || regionId === 'all') {
      setCourtsByRegion([]);
      setSelectedCourtId('all');
      return;
    }
    
    try {
      setLoadingCourts(true);
      const data = await SideCaseService.getCourtsByRegion(regionId);
      setCourtsByRegion(data);
      setSelectedCourtId('all');
    } catch (error) {
      console.error('Error loading courts:', error);
      setCourtsByRegion([]);
    } finally {
      setLoadingCourts(false);
    }
  };

  // ===== ОБРАБОТЧИКИ =====
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setSelectedRegionId(regionId);
    loadCourtsByRegion(regionId);
  };

  const handleCourtChange = (e) => {
    setSelectedCourtId(e.target.value);
  };

  const handleNewClaim = () => {
    navigate('/civil-claim/new');
  };

  // ===== ЗАГРУЗКА ДЕЛ =====
  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const casesData = await SideCaseService.getUserCases();
      const normalizedCases = {};
      for (const [key, value] of Object.entries(casesData)) {
        normalizedCases[key.toLowerCase()] = value;
      }
      setCases(normalizedCases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoadingCases(false);
    }
  };

  // ===== СИНХРОНИЗАЦИЯ =====
  const handleSync = async () => {
    const result = await syncAccess();
    if (result.success) {
      setSyncResult(result.result);
      await loadCases();
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  // ===== НАВИГАЦИЯ =====
  const handleViewCase = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/case-view/${routeType}/${caseId}`);
  };

  const handleDocumentsClick = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/case-party-documents/${routeType}/${caseId}`);
  };

  const handlePetitionsClick = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/case-petitions/${routeType}/${caseId}`);
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

  const handleAudioClick = (caseType, caseId, caseNumber) => {
    const routeType = mapCaseTypeToRoute(caseType);
    navigate(`/case-audio/${routeType}/${caseId}`);
  };

  // ===== ДОКУМЕНТЫ =====
  const openDocumentModal = (caseType, caseId, caseNumber, sideName) => {
    setPetitionCase({ 
      type: caseType, 
      id: caseId, 
      number: caseNumber,
      sideName: sideName 
    });
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

  const submitDocument = async () => {
    if (!validateDocumentForm()) return;
    
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

      await DocumentService.createPartyDocument(formData);
      alert('Документ успешно загружен');
      setShowDocumentModal(false);
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
      alert('Ошибка: ' + errorMsg);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentFormChange = (e) => {
    const { name, value } = e.target;
    setDocumentFormData(prev => ({ ...prev, [name]: value }));
    if (documentErrors[name]) {
      setDocumentErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024;
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

  // ===== EFFECTS =====
  useEffect(() => {
    loadCases();
    loadRegions();
  }, []);

  useEffect(() => {
    if (categoryFromUrl === 'archived') {
      setShowArchived(true);
      setActiveCategory('all');
    } else {
      setShowArchived(false);
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
    }
  }, [categoryFromUrl]);

  // ===== ФИЛЬТРАЦИЯ ДЕЛ =====
  const getFilteredCases = () => {
    let allCases = { ...cases };
    
    // Фильтр по категории
    if (activeCategory !== 'all') {
      const filtered = {};
      const categoryMap = {
        'criminal': ['criminal', 'criminalproceedings'],
        'civil': ['civil', 'civilproceedings'],
        'kas': ['kas', 'kasproceedings'],
        'administrative': ['administrative', 'administrativeproceedings', 'coap', 'admin']
      };
      const targetKeys = categoryMap[activeCategory] || [];
      for (const key of targetKeys) {
        if (allCases[key]?.length > 0) {
          filtered[key] = allCases[key];
        }
      }
      allCases = filtered;
    }
    
    const result = {};
    for (const [type, caseList] of Object.entries(allCases)) {
      const filteredList = caseList.filter(caseItem => {
        // Фильтр по статусу (архив/активно)
        const isArchived = caseItem.status === 'archived' || caseItem.status === 'archive';
        if (showArchived ? !isArchived : isArchived) return false;
        
        // ===== ФИЛЬТР ПО СУДУ =====
        if (selectedCourtId !== 'all') {
          const courtId = caseItem.court?.id || caseItem.court_id;
          if (courtId && courtId !== parseInt(selectedCourtId)) {
            return false;
          }
        }
        
        return true;
      });
      if (filteredList.length > 0) {
        result[type] = filteredList;
      }
    }
    
    return result;
  };

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ОТОБРАЖЕНИЯ =====
  const getCaseTypeName = (type) => {
    const names = {
      criminal: 'Уголовное дело',
      criminalproceedings: 'Уголовное дело',
      civil: 'Гражданское дело',
      civilproceedings: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      kasproceedings: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении',
      administrativeproceedings: 'Дело об административном правонарушении',
      coap: 'Дело об административном правонарушении',
      admin: 'Дело об административном правонарушении'
    };
    return names[type] || type;
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { text: 'В производстве', className: styles.badgePending },
      'in_progress': { text: 'В производстве', className: styles.badgePending },
      'active': { text: 'В производстве', className: styles.badgePending },
      'completed': { text: 'Завершено', className: styles.badgeCompleted },
      'archived': { text: 'В архиве', className: styles.badgeArchived },
      'archive': { text: 'В архиве', className: styles.badgeArchived },
      'suspended': { text: 'Приостановлено', className: styles.badgeSuspended }
    };
    const config = statusConfig[status] || { text: status || 'Неизвестно', className: styles.badgeUnknown };
    return <span className={`${styles.badge} ${config.className}`}>{config.text}</span>;
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

  // ===== РЕНДЕРИНГ =====
  const showProfileSection = activeCategory === 'all' && !showArchived;
  const filteredCases = getFilteredCases();
  const hasCases = Object.values(filteredCases).some(arr => arr && arr.length > 0);
  const documentTypes = getDocumentTypes();

  return (
    <div className={styles.pageContainer}>
      {/* ===== ШАПКА ПРОФИЛЯ ===== */}
      {showProfileSection && (
        <div className={styles.profileHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user?.full_name?.charAt(0) || 'У'}
            </div>
            <div className={styles.userDetails}>
              <h1>{user?.full_name || 'Участник процесса'}</h1>
              <p className={styles.userEmail}>{user?.email || 'Email не указан'}</p>
              <p className={styles.userProvider}>
                Вход через: {user?.social_provider === 'yandex' ? 'Яндекс ID' : user?.social_provider === 'vk' ? 'ВКонтакте' : 'Неизвестно'}
              </p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleNewClaim}
            >
              Подать исковое заявление
            </button>
            <button 
              className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Синхронизация...' : 'Синхронизировать дела'}
            </button>
            <button 
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={logout}
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* ===== РЕЗУЛЬТАТ СИНХРОНИЗАЦИИ ===== */}
      {showProfileSection && syncResult && (
        <div className={styles.syncResult}>
          <p>Синхронизация завершена. Найдено дел: {syncResult.cases_found}, добавлено: {syncResult.cases_added}</p>
        </div>
      )}

      {/* ===== ПАСПОРТНЫЕ ДАННЫЕ ===== */}
      {showProfileSection && (
        <div className={styles.passportSection}>
          <div className={styles.passportHeader}>
            <h3>Паспортные данные</h3>
          </div>
          <div className={styles.passportFields}>
            <div className={styles.passportField}>
              <label>Серия паспорта</label>
              <span>{user?.passport_series || 'Не указано'}</span>
            </div>
            <div className={styles.passportField}>
              <label>Номер паспорта</label>
              <span>{user?.passport_number || 'Не указано'}</span>
            </div>
            <div className={styles.passportField}>
              <label>Телефон</label>
              <span>{user?.phone || 'Не указан'}</span>
            </div>
          </div>
          <div className={styles.passportHint}>
            Укажите данные паспорта для более точной синхронизации с делами
          </div>
        </div>
      )}

      {/* ===== ЗАГОЛОВОК ДЕЛ ===== */}
      <div className={styles.casesHeader}>
        <h2>
          {showArchived ? 'Архивные дела' : 
           activeCategory !== 'all' ? getCaseTypeName(activeCategory) : 
           'Мои дела'}
        </h2>
        {activeCategory !== 'all' && !showArchived && (
          <button 
            className={styles.btnBack}
            onClick={() => navigate('/my-cases')}
          >
            ← Показать все дела
          </button>
        )}
        {showArchived && (
          <button 
            className={styles.btnBack}
            onClick={() => navigate('/my-cases')}
          >
            ← Вернуться к активным делам
          </button>
        )}
      </div>

      {/* ===== ФИЛЬТРЫ: РЕГИОН, СУД, АРХИВ ===== */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label>Регион</label>
          <select 
            value={selectedRegionId} 
            onChange={handleRegionChange}
            className={styles.filterSelect}
            disabled={loadingRegions}
          >
            <option value="all">Все регионы</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {loadingRegions && <span className={styles.filterHint}>Загрузка...</span>}
        </div>
        
        <div className={styles.filterGroup}>
          <label>Суд</label>
          <select 
            value={selectedCourtId} 
            onChange={handleCourtChange}
            className={styles.filterSelect}
            disabled={selectedRegionId === 'all' || courtsByRegion.length === 0 || loadingCourts}
          >
            <option value="all">Все суды</option>
            {courtsByRegion.map(court => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
          {selectedRegionId !== 'all' && courtsByRegion.length === 0 && !loadingCourts && (
            <span className={styles.filterHint} style={{ color: '#e53e3e' }}>
              Нет судов в выбранном регионе
            </span>
          )}
        </div>
        
        <div className={styles.filterGroup}>
          <label>Показать</label>
          <div className={styles.filterToggleGroup}>
            <button 
              className={`${styles.filterToggle} ${!showArchived ? styles.active : ''}`}
              onClick={() => setShowArchived(false)}
            >
              Активные
            </button>
            <button 
              className={`${styles.filterToggle} ${showArchived ? styles.active : ''}`}
              onClick={() => setShowArchived(true)}
            >
              Архив
            </button>
          </div>
        </div>
      </div>

      {/* ===== СПИСОК ДЕЛ ===== */}
      <div className={styles.casesContainer}>
        {loadingCases ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Загрузка дел...</p>
          </div>
        ) : hasCases ? (
          Object.entries(filteredCases).map(([caseType, caseList]) => (
            caseList && caseList.length > 0 && (
              <div key={caseType} className={styles.caseCategory}>
                {activeCategory === 'all' && !showArchived && (
                  <h3 className={styles.categoryTitle}>
                    {getCaseTypeName(caseType)}
                    <span className={styles.categoryCount}>{caseList.length}</span>
                  </h3>
                )}
                {showArchived && (
                  <h3 className={styles.categoryTitle}>
                    Архивные дела
                    <span className={styles.categoryCount}>{caseList.length}</span>
                  </h3>
                )}
                <div className={styles.casesGrid}>
                  {caseList.map((caseItem, idx) => {
                    const isArchived = caseItem.status === 'archived' || caseItem.status === 'archive';
                    return (
                      <div key={idx} className={`${styles.caseCard} ${isArchived ? styles.archivedCard : ''}`}>
                        <div className={styles.caseCardHeader}>
                          <div className={styles.caseNumber}>
                            Дело № {caseItem.case_number}
                          </div>
                          {getStatusBadge(caseItem.status)}
                        </div>
                        <div className={styles.caseCardBody}>
                          <div className={styles.caseInfo}>
                            <div className={styles.infoRow}>
                              <span>Ваша роль</span>
                              <strong>{caseItem.side_name || 'Сторона'}</strong>
                            </div>
                            <div className={styles.infoRow}>
                              <span>Уровень доступа</span>
                              <span className={styles.accessLevel}>
                                {caseItem.access_level === 'full' ? 'Полный' :
                                 caseItem.access_level === 'petition' ? 'Подача ходатайств' :
                                 caseItem.access_level === 'document' ? 'Досылка документов' :
                                 'Просмотр'}
                              </span>
                            </div>
                            <div className={styles.infoRow}>
                              <span>Дата предоставления</span>
                              <span>{new Date(caseItem.granted_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            {caseItem.court && (
                              <div className={styles.infoRow}>
                                <span>Суд</span>
                                <span>{caseItem.court.name_short || caseItem.court.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.caseCardActions}>
                          <button 
                            className={`${styles.btn} ${styles.btnOutline}`}
                            onClick={() => handleViewCase(caseType, caseItem.case_id, caseItem.case_number)}
                          >
                            Подробнее
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => handleDocumentsClick(caseType, caseItem.case_id, caseItem.case_number)}
                          >
                            Документы
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnSuccess}`}
                            onClick={() => handlePetitionsClick(caseType, caseItem.case_id, caseItem.case_number)}
                          >
                            Ходатайства
                          </button>
                          {!isArchived && (
                            <>
                              <button 
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => handlePetitionClick(caseType, caseItem.case_id, caseItem.case_number, caseItem.side_name)}
                                disabled={caseItem.access_level !== 'full' && caseItem.access_level !== 'petition'}
                              >
                                Подать ходатайство
                              </button>
                              <button 
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => openDocumentModal(caseType, caseItem.case_id, caseItem.case_number, caseItem.side_name)}
                                disabled={caseItem.access_level !== 'full' && caseItem.access_level !== 'document'}
                              >
                                Досылка документов
                              </button>
                            </>
                          )}
                          <button 
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => handleDecisionClick(caseType, caseItem.case_id, caseItem.case_number)}
                          >
                            Решения
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            onClick={() => handleAudioClick(caseType, caseItem.case_id, caseItem.case_number)}
                          >
                            Аудио-протокол
                          </button>
                        </div>
                        {isArchived && (
                          <div className={styles.archivedLabel}>
                            Дело находится в архиве
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))
        ) : (
          <div className={styles.emptyState}>
            <h3>{showArchived ? 'Нет архивных дел' : 'У вас пока нет дел'}</h3>
            {!showArchived && activeCategory === 'all' && (
              <>
                <p>Нажмите кнопку синхронизации, чтобы найти ваши дела по ФИО, email или паспортным данным</p>
                <div className={styles.emptyActions}>
                  <button 
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleSync} 
                    disabled={syncing}
                  >
                    {syncing ? 'Синхронизация...' : 'Синхронизировать дела'}
                  </button>
                  <button 
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleNewClaim}
                  >
                    Подать исковое заявление
                  </button>
                </div>
              </>
            )}
            {showArchived && (
              <button 
                className={styles.btnBack}
                onClick={() => navigate('/my-cases')}
              >
                ← Вернуться к активным делам
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== МОДАЛЬНОЕ ОКНО ДОСЫЛКИ ДОКУМЕНТОВ ===== */}
      {showDocumentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDocumentModal(false)}>
          <div className={styles.modalDocument} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Досылка документов</h3>
              <button className={styles.modalClose} onClick={() => setShowDocumentModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.caseRef}>Дело № {petitionCase?.number}</p>
              
              <div className={styles.formGroup}>
                <label>Тип документа</label>
                <select
                  name="document_type"
                  value={documentFormData.document_type}
                  onChange={handleDocumentFormChange}
                  className={`${styles.formSelect} ${documentErrors.document_type ? styles.errorInput : ''}`}
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
                <label>Название документа</label>
                <input
                  type="text"
                  name="title"
                  value={documentFormData.title}
                  onChange={handleDocumentFormChange}
                  placeholder="Например: Ходатайство о приобщении доказательств"
                  className={`${styles.formInput} ${documentErrors.title ? styles.errorInput : ''}`}
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
                  className={styles.formTextarea}
                  placeholder="Краткое содержание документа"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Податель (ФИО)</label>
                <input
                  type="text"
                  name="submitter_name"
                  value={documentFormData.submitter_name}
                  onChange={handleDocumentFormChange}
                  className={`${styles.formInput} ${documentErrors.submitter_name ? styles.errorInput : ''}`}
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
                  className={styles.formInput}
                  placeholder="Например: Истец, Ответчик, Обвиняемый"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Файл документа</label>
                <input
                  type="file"
                  onChange={handleDocumentFileChange}
                  className={`${styles.formFile} ${documentErrors.document_file ? styles.errorInput : ''}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {documentErrors.document_file && <span className={styles.errorText}>{documentErrors.document_file}</span>}
                <p className={styles.fileHint}>Поддерживаемые форматы: PDF, DOC, DOCX, JPG, PNG. Максимум 20 МБ.</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={submitDocument}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? 'Загрузка...' : 'Отправить документ'}
              </button>
              <button 
                className={`${styles.btn} ${styles.btnSecondary}`}
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