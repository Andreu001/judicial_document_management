// src/components/CaseDistribution/CollegiumManagement.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const CollegiumManagement = ({ judges, onUpdate }) => {
  const [collegiums, setCollegiums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCollegium, setEditingCollegium] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    case_types: [],
    judge_ids: [],
    is_active: true,
    description: ''
  });
  const [selectedCollegium, setSelectedCollegium] = useState(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [selectedJudgeForCollegium, setSelectedJudgeForCollegium] = useState('');
  const [formError, setFormError] = useState('');

  const caseTypeOptions = [
    { value: 'criminal', label: 'Уголовные' },
    { value: 'civil', label: 'Гражданские' },
    { value: 'coap', label: 'КоАП' },
    { value: 'kas', label: 'КАС' },
    { value: 'other', label: 'Прочие' }
  ];

  useEffect(() => {
    loadCollegiums();
  }, []);

  const loadCollegiums = async () => {
    try {
      setLoading(true);
      const response = await CaseDistributionService.getCollegiums();
      setCollegiums(response.results || response || []);
    } catch (error) {
      console.error('Ошибка загрузки коллегий:', error);
      setCollegiums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name.trim()) {
      setFormError('Введите название коллегии');
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        case_types: formData.case_types,
        judge_ids: formData.judge_ids,
        is_active: formData.is_active,
        description: formData.description || ''
      };
      
      let result;
      if (editingCollegium) {
        result = await CaseDistributionService.updateCollegium(editingCollegium.id, payload);
      } else {
        result = await CaseDistributionService.createCollegium(payload);
      }
      
      setShowForm(false);
      setEditingCollegium(null);
      setFormData({
        name: '',
        case_types: [],
        judge_ids: [],
        is_active: true,
        description: ''
      });
      loadCollegiums();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Ошибка сохранения коллегии:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Ошибка при сохранении коллегии';
      setFormError(errorMsg);
    }
  };

  const handleDelete = async (collegiumId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту коллегию?')) {
      return;
    }
    try {
      await CaseDistributionService.deleteCollegium(collegiumId);
      loadCollegiums();
    } catch (error) {
      console.error('Ошибка удаления коллегии:', error);
      alert('Ошибка при удалении коллегии');
    }
  };

  const handleAddJudge = async () => {
    if (!selectedCollegium || !selectedJudgeForCollegium) {
      alert('Выберите судью');
      return;
    }
    try {
      await CaseDistributionService.addJudgeToCollegium(
        selectedCollegium.id,
        parseInt(selectedJudgeForCollegium)
      );
      setShowJudgeModal(false);
      setSelectedJudgeForCollegium('');
      loadCollegiums();
    } catch (error) {
      console.error('Ошибка добавления судьи:', error);
      alert('Ошибка при добавлении судьи');
    }
  };

  const handleRemoveJudge = async (collegiumId, judgeId) => {
    if (!window.confirm('Удалить судью из коллегии?')) {
      return;
    }
    try {
      await CaseDistributionService.removeJudgeFromCollegium(collegiumId, judgeId);
      loadCollegiums();
    } catch (error) {
      console.error('Ошибка удаления судьи:', error);
      alert('Ошибка при удалении судьи');
    }
  };

  const getCollegiumJudges = (collegium) => {
    if (collegium.judges && collegium.judges.length > 0) {
      return collegium.judges;
    }
    if (collegium.judge_ids && collegium.judge_ids.length > 0) {
      return collegium.judge_ids.map(id => judges.find(j => j.id === id)).filter(Boolean);
    }
    return [];
  };

  return (
    <div className={styles.collegiumManagement}>
      <div className={styles.collegiumHeader}>
        <h2>Коллегии судей</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Создать коллегию
        </button>
      </div>

      {formError && (
        <div style={{ color: '#c53030', padding: '10px', background: '#fed7d7', borderRadius: '6px', marginBottom: '16px' }}>
          {formError}
        </div>
      )}

      <div className={styles.collegiumList}>
        {loading ? (
          <div className={styles.loadingState}>Загрузка коллегий...</div>
        ) : collegiums.length === 0 ? (
          <div className={styles.emptyState}>Коллегии не созданы</div>
        ) : (
          collegiums.map(collegium => {
            const collegiumJudges = getCollegiumJudges(collegium);
            return (
              <div key={`collegium-${collegium.id}`} className={styles.collegiumCard}>
                <div className={styles.collegiumCardHeader}>
                  <div className={styles.collegiumName}>
                    {collegium.name}
                    <span className={`${styles.collegiumStatus} ${collegium.is_active ? styles.active : styles.inactive}`}>
                      {collegium.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                  <div className={styles.collegiumActions}>
                    <button 
                      onClick={() => {
                        setSelectedCollegium(collegium);
                        setShowJudgeModal(true);
                      }} 
                      className={styles.addJudgeButton}
                    >
                      + Судья
                    </button>
                    <button 
                      onClick={() => {
                        setEditingCollegium(collegium);
                        setFormData({
                          name: collegium.name,
                          case_types: collegium.case_types || [],
                          judge_ids: collegium.judge_ids || [],
                          is_active: collegium.is_active !== undefined ? collegium.is_active : true,
                          description: collegium.description || ''
                        });
                        setShowForm(true);
                      }} 
                      className={styles.editButton}
                    >
                      ✎
                    </button>
                    <button onClick={() => handleDelete(collegium.id)} className={styles.deleteButton}>
                      ×
                    </button>
                  </div>
                </div>
                
                <div className={styles.collegiumDetails}>
                  <div className={styles.collegiumDetail}>
                    <span className={styles.detailLabel}>Специализация:</span>
                    <span className={styles.detailValue}>
                      {collegium.case_types && collegium.case_types.length > 0
                        ? collegium.case_types.map((t, idx) => (
                            <span key={`type-${collegium.id}-${idx}`}>
                              {caseTypeOptions.find(opt => opt.value === t)?.label || t}
                              {idx < collegium.case_types.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        : 'Все типы'}
                    </span>
                  </div>
                  <div className={styles.collegiumDetail}>
                    <span className={styles.detailLabel}>Судьи:</span>
                    <span className={styles.detailValue}>
                      {collegiumJudges.length > 0
                        ? collegiumJudges.map((j, idx) => (
                            <span key={`judge-${collegium.id}-${j.id}`}>
                              {j.full_name || j.username}
                              {idx < collegiumJudges.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        : 'Нет судей'}
                    </span>
                  </div>
                  {collegium.description && (
                    <div className={styles.collegiumDescription}>
                      {collegium.description}
                    </div>
                  )}
                </div>

                {collegiumJudges.length > 0 && (
                  <div className={styles.collegiumJudges}>
                    {collegiumJudges.map(judge => (
                      <div key={`judge-chip-${collegium.id}-${judge.id}`} className={styles.judgeChip}>
                        <span>{judge.full_name || judge.username}</span>
                        <button
                          onClick={() => handleRemoveJudge(collegium.id, judge.id)}
                          className={styles.removeJudgeButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Форма создания/редактирования коллегии */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <h2>{editingCollegium ? 'Редактирование коллегии' : 'Создание коллегии'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Название коллегии *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Например: Уголовная коллегия"
                  />
                </div>

                <div className={styles.field}>
                  <label>Типы дел</label>
                  <select
                    multiple
                    value={formData.case_types}
                    onChange={(e) => {
                      const options = e.target.options;
                      const selected = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) {
                          selected.push(options[i].value);
                        }
                      }
                      setFormData(prev => ({ ...prev, case_types: selected }));
                    }}
                    className={styles.multiSelect}
                    size="3"
                  >
                    {caseTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <small>Удерживайте Ctrl для выбора нескольких</small>
                </div>

                <div className={styles.field}>
                  <label>Судьи</label>
                  <select
                    multiple
                    value={formData.judge_ids.map(String)}
                    onChange={(e) => {
                      const options = e.target.options;
                      const selected = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) {
                          selected.push(parseInt(options[i].value));
                        }
                      }
                      setFormData(prev => ({ ...prev, judge_ids: selected }));
                    }}
                    className={styles.multiSelect}
                    size="4"
                  >
                    {judges.map(judge => (
                      <option key={judge.id} value={judge.id}>
                        {judge.full_name || judge.username}
                        {judge.collegium && ` (${judge.collegium})`}
                      </option>
                    ))}
                  </select>
                  <small>Удерживайте Ctrl для выбора нескольких</small>
                </div>

                <div className={styles.field}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Коллегия активна
                  </label>
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                    placeholder="Дополнительная информация о коллегии"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" className={styles.confirmButton}>
                  {editingCollegium ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка добавления судьи в коллегию */}
      {showJudgeModal && selectedCollegium && (
        <div className={styles.modalOverlay} onClick={() => setShowJudgeModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Добавление судьи в коллегию</h2>
            <div className={styles.field}>
              <label>Выберите судью</label>
              <select
                value={selectedJudgeForCollegium}
                onChange={(e) => setSelectedJudgeForCollegium(e.target.value)}
              >
                <option value="">Выберите судью</option>
                {judges
                  .filter(j => !selectedCollegium.judge_ids?.includes(j.id))
                  .map(judge => (
                    <option key={judge.id} value={judge.id}>
                      {judge.full_name || judge.username}
                      {judge.collegium && ` (${judge.collegium})`}
                    </option>
                  ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowJudgeModal(false)} className={styles.cancelButton}>
                Отмена
              </button>
              <button onClick={handleAddJudge} className={styles.confirmButton}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegiumManagement;