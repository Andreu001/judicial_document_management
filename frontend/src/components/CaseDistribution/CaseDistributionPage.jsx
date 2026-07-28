// src/components/CaseDistribution/CaseDistributionPage.jsx
// Полностью исправленная версия

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';
import ModalDialog from '../UI/Modal/ModalDialog';

// Компоненты
import DistributionList from './DistributionList';
import DistributionLogView from './DistributionLogView';
import RuleManagement from './RuleManagement';
import CollegiumManagement from './CollegiumManagement';
import JudgeAvailability from './JudgeAvailability';
import ComplexitySettings from './ComplexitySettings';
import DistributionStats from './DistributionStats';

const CaseDistributionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('distribution');
  const [cases, setCases] = useState([]);
  const [judges, setJudges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    case_type: '',
    collegium: '',
    status: ''
  });
  const [stats, setStats] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedCaseForReassign, setSelectedCaseForReassign] = useState(null);
  const [collegiums, setCollegiums] = useState([]);
  const [rules, setRules] = useState([]);
  
  // Состояния для модальных окон
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Да',
    cancelText: 'Отмена'
  });
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    loadCollegiums();
    loadRules();
  }, []);

  const loadCollegiums = async () => {
    try {
      const response = await CaseDistributionService.getCollegiums();
      setCollegiums(response.results || response || []);
    } catch (error) {
      console.error('Ошибка загрузки коллегий:', error);
      setCollegiums([]);
    }
  };

  const loadRules = async () => {
    try {
      const response = await CaseDistributionService.getRules();
      setRules(response.results || response || []);
    } catch (error) {
      console.error('Ошибка загрузки правил:', error);
      setRules([]);
    }
  };

  const handleDistributeWithRules = async (caseIds, ruleId) => {
    try {
      setLoading(true);
      const result = await CaseDistributionService.distributeWithRules({
        case_ids: caseIds,
        rule_id: ruleId
      });
      // Обработка результата...
      showResultModal({
        title: 'Распределение с правилами завершено',
        message: `Распределено: ${result.distributed || 0} дел`,
        type: 'success'
      });
      loadCases();
      loadStats();
      setSelectedCases([]);
    } catch (error) {
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при распределении',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeByCollegium = async (caseIds, collegiumId) => {
    try {
      setLoading(true);
      const result = await CaseDistributionService.distributeByCollegium({
        case_ids: caseIds,
        collegium_id: collegiumId
      });
      showResultModal({
        title: 'Распределение по коллегии завершено',
        message: `Распределено: ${result.distributed || 0} дел`,
        type: 'success'
      });
      loadCases();
      loadStats();
      setSelectedCases([]);
    } catch (error) {
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при распределении',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  // Загрузка данных с учетом фильтров
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.case_type) params.case_type = filters.case_type;
        
        const response = await CaseDistributionService.getCasesForDistribution(params);
        let allCases = response.results || response;
        
        // Показываем ТОЛЬКО дела, где assigned_judge === null
        const casesWithoutJudge = allCases.filter(c => !c.assigned_judge);
        
        setCases(casesWithoutJudge);
      } catch (error) {
        console.error('Ошибка загрузки дел:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    loadJudges();
    loadStats();
  }, [filters]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await CaseDistributionService.getCasesForDistribution(filters);
      setCases(response.results || response);
    } catch (error) {
      console.error('Ошибка загрузки дел:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJudges = async () => {
    try {
      const response = await CaseDistributionService.getAvailableJudges();
      setJudges(response || []);
    } catch (error) {
      console.error('Ошибка загрузки судей:', error);
      setJudges([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await CaseDistributionService.getDistributionStats();
      setStats(response);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setStats(null);
    }
  };

  // Показ модального окна
  const showModal = (options) => {
    setModal({
      isOpen: true,
      type: options.type || 'confirm',
      title: options.title || 'Подтверждение',
      message: options.message || '',
      onConfirm: options.onConfirm || null,
      confirmText: options.confirmText || 'Да',
      cancelText: options.cancelText || 'Отмена'
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const showResultModal = (options) => {
    setResultModal({
      isOpen: true,
      title: options.title || 'Результат',
      message: options.message || '',
      type: options.type || 'info'
    });
  };

  const closeResultModal = () => {
    setResultModal({ ...resultModal, isOpen: false });
  };

  // Получение ID дел без судьи
  const getPendingCaseIds = () => {
    return cases
      .filter(c => c.status === 'pending' || !c.assigned_judge)
      .map(c => c.id);
  };

  // Автоматическое распределение
  const handleAutoDistribute = async (specificCaseIds = null) => {
    let casesToDistribute = specificCaseIds;
    
    if (!casesToDistribute || (Array.isArray(casesToDistribute) && casesToDistribute.length === 0)) {
      casesToDistribute = cases
        .filter(c => !c.assigned_judge)
        .map(c => c.id);
    }
    
    if (!Array.isArray(casesToDistribute)) {
      showResultModal({
        title: 'Ошибка',
        message: 'Неверный формат данных для распределения',
        type: 'error'
      });
      return;
    }
    
    if (casesToDistribute.length === 0) {
      showResultModal({
        title: 'Информация',
        message: 'Нет дел для распределения. Все дела уже назначены судьям.',
        type: 'info'
      });
      return;
    }

    showModal({
      title: 'Подтверждение распределения',
      message: `Вы уверены, что хотите автоматически распределить ${casesToDistribute.length} дел?`,
      onConfirm: async () => {
        await doDistribute(casesToDistribute);
      }
    });
  };

  const handleCaseClick = (caseId) => {
    const caseData = cases.find(c => c.id === caseId);
    if (!caseData) {
      // Если дело не найдено в списке, пробуем получить через API
      CaseDistributionService.getCaseView(caseId)
        .then(data => {
          navigateToCase(data);
        })
        .catch(() => {
          // Если не удалось, пробуем через детали
          CaseDistributionService.getCaseDetails(caseId)
            .then(data => {
              navigateToCase(data);
            })
            .catch(err => {
              console.error('Ошибка загрузки дела:', err);
              // Показываем сообщение пользователю
              showResultModal({
                title: 'Ошибка',
                message: 'Не удалось загрузить данные дела',
                type: 'error'
              });
            });
        });
      return;
    }
    navigateToCase(caseData);
  };

  const navigateToCase = (caseData) => {
    const caseObjId = caseData.case_object_id || caseData.case_id || caseData.id;
    const caseType = caseData.case_category || caseData.case_type || 'other';

    const routeMap = {
      'criminal': `/criminal-proceedings/${caseObjId}`,
      'civil': `/civil-proceedings/${caseObjId}`,
      'coap': `/admin-proceedings/${caseObjId}`,
      'kas': `/kas-proceedings/${caseObjId}`,
      'other': `/other-materials/${caseObjId}`,
    };

    const path = routeMap[caseType];
    if (path) {
      navigate(path);
    } else {
      // Если тип неизвестен, пробуем определить по номеру дела
      const caseNumber = caseData.case_number || '';
      if (caseNumber.includes('угол') || caseNumber.includes('Угол')) {
        navigate(`/criminal-proceedings/${caseObjId}`);
      } else if (caseNumber.includes('гражд') || caseNumber.includes('Гражд')) {
        navigate(`/civil-proceedings/${caseObjId}`);
      } else if (caseNumber.includes('АП') || caseNumber.includes('админ')) {
        navigate(`/admin-proceedings/${caseObjId}`);
      } else if (caseNumber.includes('КАС') || caseNumber.includes('кас')) {
        navigate(`/kas-proceedings/${caseObjId}`);
      } else {
        // Показываем сообщение, что не можем определить тип
        showResultModal({
          title: 'Информация',
          message: `Дело №${caseNumber || caseObjId} не найдено в системе`,
          type: 'info'
        });
      }
    }
  };

  const doDistribute = async (caseIds) => {
    try {
      setLoading(true);
      const result = await CaseDistributionService.autoDistribute({
        case_ids: caseIds
      });
      
      if (result && result.result) {
        const r = result.result;
        const distributed = r.distributed || 0;
        const failed = r.failed || 0;
        
        let message = `Распределено: ${distributed} дел`;
        if (failed > 0) {
          message += `\nНе удалось: ${failed} дел`;
        }
        
        showResultModal({
          title: 'Распределение завершено',
          message: message,
          type: distributed > 0 ? 'success' : 'warning'
        });
        
        loadCases();
        loadStats();
        setSelectedCases([]);
      } else if (result && result.error) {
        showResultModal({
          title: 'Ошибка',
          message: result.error,
          type: 'error'
        });
      } else {
        showResultModal({
          title: 'Ошибка',
          message: 'Неизвестная ошибка при распределении дел',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Ошибка распределения:', error);
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при распределении дел',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Ручное назначение судьи
  const handleManualAssign = async (caseId, judgeId, reason = '') => {
    try {
      await CaseDistributionService.assignJudgeManually(caseId, {
        judge_id: judgeId,
        reason: reason || 'Ручное назначение'
      });
      loadCases();
      loadStats();
      showResultModal({
        title: 'Успешно',
        message: 'Судья назначен на дело',
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка назначения:', error);
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при назначении судьи',
        type: 'error'
      });
      throw error;
    }
  };

  // Перераспределение
  const handleReassign = async (data) => {
    try {
      await CaseDistributionService.reassignCase(data.case_id, {
        new_judge_id: data.judge_id,
        reason: data.reason,
        comment: data.comment
      });
      loadCases();
      loadStats();
      setShowReassignModal(false);
      setSelectedCaseForReassign(null);
      showResultModal({
        title: 'Успешно',
        message: 'Дело перераспределено',
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка перераспределения:', error);
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при перераспределении дела',
        type: 'error'
      });
      throw error;
    }
  };

  // Установка сложности
  const handleSetComplexity = async (caseId, complexity) => {
    try {
      await CaseDistributionService.setCaseComplexity(caseId, complexity);
      loadCases();
      showResultModal({
        title: 'Успешно',
        message: `Сложность дела обновлена на ${complexity}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Ошибка установки сложности:', error);
      showResultModal({
        title: 'Ошибка',
        message: error.message || 'Ошибка при установке сложности',
        type: 'error'
      });
    }
  };

  // Экспорт журнала
  const handleExportLog = async (params) => {
    try {
      const blob = await CaseDistributionService.exportLogToWord(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Журнал_распределения_${new Date().toLocaleDateString('ru-RU')}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      showResultModal({
        title: 'Ошибка',
        message: 'Ошибка при экспорте журнала',
        type: 'error'
      });
    }
  };

  // Рендер табов
  const renderTabContent = () => {
    switch (activeTab) {
      case 'distribution':
        return (
          <DistributionList
            cases={cases}
            judges={judges}
            collegiums={collegiums}
            rules={rules}
            loading={loading}
            selectedCases={selectedCases}
            setSelectedCases={setSelectedCases}
            filters={filters}
            setFilters={setFilters}
            onAutoDistribute={handleAutoDistribute}
            onManualAssign={handleManualAssign}
            onReassign={(caseId) => {
              setSelectedCaseForReassign(caseId);
              setShowReassignModal(true);
            }}
            onSetComplexity={handleSetComplexity}
            onCaseClick={handleCaseClick}
            onDistributeWithRules={handleDistributeWithRules}
            onDistributeByCollegium={handleDistributeByCollegium}
          />
        );
      
      case 'log':
        return (
          <DistributionLogView
            onExport={handleExportLog}
          />
        );
      
      case 'stats':
        return (
          <DistributionStats
            stats={stats}
            onRefresh={loadStats}
          />
        );
      
      case 'rules':
        return (
          <RuleManagement
            judges={judges}
            onUpdate={loadCases}
          />
        );
      
      case 'collegiums':
        return (
          <CollegiumManagement
            judges={judges}
            onUpdate={loadCases}
          />
        );
      
      case 'availability':
        return (
          <JudgeAvailability
            judges={judges}
            onUpdate={loadJudges}
          />
        );
      
      case 'complexity':
        return (
          <ComplexitySettings
            cases={cases}
            onUpdate={loadCases}
          />
        );
      
      default:
        return <div>Выберите вкладку</div>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1>Распределение дел</h1>
        <div className={styles.headerActions}>
          <button 
            className={styles.autoDistributeButton}
            onClick={() => handleAutoDistribute()}
            disabled={loading || cases.filter(c => !c.assigned_judge).length === 0}
          >
            {loading ? 'Распределение...' : `⚡ Распределить все дела (${getPendingCaseIds().length})`}
          </button>
          <button 
            className={styles.logButton}
            onClick={() => setActiveTab('log')}
          >
            📋 Журнал
          </button>
          <button 
            className={styles.settingsButton}
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.total_cases || 0}</span>
            <span className={styles.statLabel}>Всего дел</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.without_judge || 0}</span>
            <span className={styles.statLabel}>Без судьи</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.distributed || 0}</span>
            <span className={styles.statLabel}>Распределено</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.active_judges || 0}</span>
            <span className={styles.statLabel}>Активных судей</span>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'distribution' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('distribution')}
        >
          📋 Список дел
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'log' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('log')}
        >
          📄 Журнал
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Статистика
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'rules' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚖️ Правила
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'collegiums' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('collegiums')}
        >
          🏛️ Коллегии
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'availability' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          📅 Доступность
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'complexity' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('complexity')}
        >
          📐 Сложность
        </button>
      </div>

      {/* Контент */}
      <div className={styles.content}>
        {renderTabContent()}
      </div>

      {/* Модалка перераспределения */}
      {showReassignModal && (
        <ReassignModal
          caseId={selectedCaseForReassign}
          judges={judges}
          onClose={() => {
            setShowReassignModal(false);
            setSelectedCaseForReassign(null);
          }}
          onConfirm={handleReassign}
        />
      )}

      {/* Модальное окно подтверждения */}
      <ModalDialog
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={() => {
          if (modal.onConfirm) {
            modal.onConfirm();
          }
          closeModal();
        }}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        type={modal.type}
      />

      {/* Модальное окно результата */}
      <ModalDialog
        isOpen={resultModal.isOpen}
        onClose={closeResultModal}
        onConfirm={closeResultModal}
        title={resultModal.title}
        message={resultModal.message}
        confirmText="OK"
        cancelText=""
        type={resultModal.type === 'error' ? 'error' : 'info'}
      />
    </div>
  );
};

// Модалка перераспределения
const ReassignModal = ({ caseId, judges, onClose, onConfirm }) => {
  const [selectedJudge, setSelectedJudge] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedJudge || !reason) {
      alert('Пожалуйста, выберите судью и укажите причину');
      return;
    }
    
    setLoading(true);
    try {
      await onConfirm({
        case_id: caseId,
        judge_id: selectedJudge,
        reason,
        comment
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Перераспределение дела</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Выберите судью *</label>
            <select 
              value={selectedJudge} 
              onChange={(e) => setSelectedJudge(e.target.value)}
              required
            >
              <option value="">Выберите судью</option>
              {judges.map(judge => (
                <option key={judge.id} value={judge.id}>
                  {judge.full_name || judge.username} 
                  {judge.collegium && ` (${judge.collegium})`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Причина перераспределения *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: Отвод судьи, нагрузка и т.д."
              required
            />
          </div>

          <div className={styles.field}>
            <label>Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительная информация"
              rows="3"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.confirmButton} disabled={loading}>
              {loading ? 'Сохранение...' : 'Перераспределить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseDistributionPage;