import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MovementService from '../../API/MovementService';
import KasCaseService from '../../API/KasCaseService';
import OtherMaterialService from '../../API/OtherMaterialService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './MovementDetail.module.css';

const MovementDetail = () => {
  const { proceedingId, movementId, materialId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const caseType =
    location.pathname.includes('/admin-proceedings/') ? 'admin' :
    location.pathname.includes('/kas-proceedings/') ? 'kas' :
    location.pathname.includes('/other-materials/') ? 'other' :
    location.pathname.includes('/criminal-proceedings/') ? 'criminal' : 'civil';

  const effectiveProceedingId = caseType === 'other' ? materialId : proceedingId;
  const isEditMode = movementId && movementId !== 'create';

  const [movementData, setMovementData] = useState(null);
  const [isEditing, setIsEditing] = useState(!isEditMode);
  const [activeTab, setActiveTab] = useState('main');
  const [formData, setFormData] = useState({
    date_meeting: '',
    meeting_time: '',
    court_session_result: '',
    reason_deposition: '',
  });
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courtSessionResults, setCourtSessionResults] = useState([]);
  const [reasonDepositions, setReasonDepositions] = useState([]);

  useEffect(() => {
    loadDictionaries();
  }, []);

  useEffect(() => {
    if (isEditMode && effectiveProceedingId) {
      fetchMovementDetails();
    }
  }, [effectiveProceedingId, movementId, isEditMode, caseType]);

  const loadDictionaries = async () => {
    try {
      const [resCourt, resReason] = await Promise.all([
        MovementService.getCourtSessionResults(),
        MovementService.getReasonDepositions(),
      ]);
      setCourtSessionResults(resCourt.data || resCourt || []);
      setReasonDepositions(resReason.data || resReason || []);
    } catch (err) {
      console.error('Ошибка загрузки справочников:', err);
    }
  };

  const fetchMovementDetails = async () => {
    try {
      setLoading(true);
      let movement;
      if (caseType === 'criminal') {
        movement = await CriminalCaseService.getCaseMovementById(effectiveProceedingId, movementId);
      } else if (caseType === 'kas') {
        movement = await KasCaseService.getMovementById(effectiveProceedingId, movementId);
      } else if (caseType === 'other') {
        movement = await OtherMaterialService.getMovementById(effectiveProceedingId, movementId);
      } else {
        const response = await MovementService.getMovement(effectiveProceedingId, movementId, caseType);
        movement = response.data || response;
      }

      setMovementData(movement);

      const details = movement.business_movement_detail || movement;

      setFormData({
        date_meeting: details.date_meeting || '',
        meeting_time: details.meeting_time || '',
        court_session_result: details.court_session_result || '',
        reason_deposition: details.reason_deposition || '',
      });
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки движения:', err);
      setError('Не удалось загрузить данные движения по делу');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.date_meeting) errors.push('Дата заседания обязательна');
    if (!formData.meeting_time) errors.push('Время заседания обязательно');
    if (errors.length) {
      setError(`Заполните обязательные поля: ${errors.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        date_meeting: formData.date_meeting,
        meeting_time: formData.meeting_time,
        court_session_result: formData.court_session_result || null,
        reason_deposition: formData.reason_deposition || null,
      };

      if (isEditMode) {
        if (caseType === 'criminal') {
          await CriminalCaseService.updateCaseMovement(effectiveProceedingId, movementId, payload);
        } else if (caseType === 'kas') {
          await KasCaseService.updateMovement(effectiveProceedingId, movementId, payload);
        } else if (caseType === 'other') {
          await OtherMaterialService.updateMovement(effectiveProceedingId, movementId, payload);
        } else {
          await MovementService.updateMovement(effectiveProceedingId, movementId, payload, caseType);
        }
      } else {
        if (caseType === 'criminal') {
          await CriminalCaseService.createCaseMovement(effectiveProceedingId, payload);
        } else if (caseType === 'kas') {
          await KasCaseService.createMovement(effectiveProceedingId, payload);
        } else if (caseType === 'other') {
          await OtherMaterialService.createMovement(effectiveProceedingId, payload);
        } else {
          await MovementService.createMovement(effectiveProceedingId, payload, caseType);
        }
      }

      if (!isEditMode) {
        navigate(-1);
      } else {
        await fetchMovementDetails();
        setIsEditing(false);
      }
      setSaving(false);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      let msg = 'Не удалось сохранить данные:\n';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          Object.entries(err.response.data).forEach(([k, v]) => {
            msg += `\n${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`;
          });
        } else {
          msg += `\n${err.response.data}`;
        }
      } else if (err.request) {
        msg = 'Сервер не отвечает. Проверьте подключение.';
      } else {
        msg = `Ошибка: ${err.message}`;
      }
      setError(msg);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      if (movementData) {
        setIsEditing(false);
        setError(null);
      }
    } else {
      navigate(-1);
    }
  };

  const formatDate = (v) => v ? new Date(v).toLocaleDateString('ru-RU') : 'Не указано';
  const formatTime = (v) => v ? v.slice(0, 5) : 'Не указано';

  const getCourtSessionResultName = () => {
    const item = courtSessionResults.find(r => r.id === Number(formData.court_session_result));
    return item?.name || 'Не выбрано';
  };

  const getReasonDepositionName = () => {
    const item = reasonDepositions.find(r => r.id === Number(formData.reason_deposition));
    return item?.name || 'Не выбрано';
  };

  const getTitle = () => {
    const action = isEditMode ? 'Движение по делу' : 'Новое движение по делу';
    const map = {
      admin: '(административное правонарушение)',
      kas: '(административное дело, КАС РФ)',
      other: '(иные материалы)',
      criminal: '(уголовное дело)',
      civil: '(гражданское)',
    };
    return `${action} ${map[caseType] || map.civil}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          Загрузка данных движения по делу...
        </div>
      </div>
    );
  }

  if (error && !saving) {
    return (
      <div className={styles.container}>
        <div className={styles.error} style={{ whiteSpace: 'pre-line' }}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>← Назад</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>← Назад</button>
          <h1 className={styles.title}>{getTitle()}</h1>
          {caseType === 'admin' && <span className={styles.caseTypeBadge}>Административное правонарушение</span>}
          {caseType === 'kas' && <span className={styles.caseTypeBadge}>Административное дело (КАС РФ)</span>}
          {caseType === 'other' && <span className={styles.caseTypeBadge}>Иные материалы</span>}
          {caseType === 'criminal' && <span className={styles.caseTypeBadge}>Уголовное дело</span>}
        </div>

        <div className={styles.headerRight}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>Редактировать</button>
          ) : (
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button onClick={handleCancel} className={styles.cancelButton}>Отмена</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'main' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('main')}
              >
                Основная информация
              </button>
              {isEditMode && (
                <button
                  className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Служебная информация
                </button>
              )}
            </div>

            <div className={styles.tabContentWrapper}>
              {activeTab === 'main' && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Дата и время заседания</h3>

                    <div className={styles.field}>
                      <label>Дата заседания *</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="date_meeting"
                          value={formData.date_meeting || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                      ) : (
                        <span>{formatDate(formData.date_meeting)}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Время заседания *</label>
                      {isEditing ? (
                        <input
                          type="time"
                          name="meeting_time"
                          value={formData.meeting_time || ''}
                          onChange={handleInputChange}
                          className={styles.input}
                          required
                        />
                      ) : (
                        <span>{formatTime(formData.meeting_time)}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Ход дела и причина отложения</h3>

                    <div className={styles.field}>
                      <label>Ход дела</label>
                      {isEditing ? (
                        <select
                          name="court_session_result"
                          value={formData.court_session_result || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">— не выбрано —</option>
                          {courtSessionResults.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{getCourtSessionResultName()}</span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label>Причина отложения</label>
                      {isEditing ? (
                        <select
                          name="reason_deposition"
                          value={formData.reason_deposition || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                        >
                          <option value="">— не выбрано —</option>
                          {reasonDepositions.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{getReasonDepositionName()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'info' && isEditMode && movementData && (
                <div className={styles.tabContent}>
                  <div className={styles.fieldGroup}>
                    <h3 className={styles.subsectionTitle}>Идентификаторы</h3>
                    <div className={styles.field}>
                      <label>ID движения</label>
                      <span className={styles.valueReadonly}>{movementData.id}</span>
                    </div>
                    <div className={styles.field}>
                      <label>ID дела</label>
                      <span className={styles.valueReadonly}>{effectiveProceedingId}</span>
                    </div>
                    <div className={styles.field}>
                      <label>Тип дела</label>
                      <span className={styles.valueReadonly}>
                        {caseType === 'admin' ? 'Административное правонарушение' :
                         caseType === 'kas' ? 'Административное дело (КАС РФ)' :
                         caseType === 'other' ? 'Иные материалы' :
                         caseType === 'criminal' ? 'Уголовное' : 'Гражданское'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetail;