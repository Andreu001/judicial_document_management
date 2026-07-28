// src/components/CaseDistribution/RuleManagement.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const RuleManagement = ({ judges, onUpdate }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    case_types: [],
    judge_ids: [],
    load_percent: 100,
    is_active: true,
    priority: 1,
    description: ''
  });
  const [caseTypeOptions] = useState([
    { value: 'criminal', label: 'Уголовные' },
    { value: 'civil', label: 'Гражданские' },
    { value: 'administrative', label: 'Административные' },
    { value: 'kas', label: 'КАС' },
    { value: 'other', label: 'Прочие' }
  ]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await CaseDistributionService.getRules();
      setRules(response.results || response);
    } catch (error) {
      console.error('Ошибка загрузки правил:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await CaseDistributionService.updateRule(editingRule.id, formData);
      } else {
        await CaseDistributionService.createRule(formData);
      }
      setShowForm(false);
      setEditingRule(null);
      setFormData({
        name: '',
        case_types: [],
        judge_ids: [],
        load_percent: 100,
        is_active: true,
        priority: 1,
        description: ''
      });
      loadRules();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Ошибка сохранения правила:', error);
      alert('Ошибка при сохранении правила');
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это правило?')) {
      return;
    }
    try {
      await CaseDistributionService.deleteRule(ruleId);
      loadRules();
    } catch (error) {
      console.error('Ошибка удаления правила:', error);
      alert('Ошибка при удалении правила');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      case_types: rule.case_types || [],
      judge_ids: rule.judge_ids || [],
      load_percent: rule.load_percent || 100,
      is_active: rule.is_active !== undefined ? rule.is_active : true,
      priority: rule.priority || 1,
      description: rule.description || ''
    });
    setShowForm(true);
  };

  const handleCaseTypeChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, case_types: selected }));
  };

  const handleJudgeChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setFormData(prev => ({ ...prev, judge_ids: selected }));
  };

  return (
    <div className={styles.ruleManagement}>
      <div className={styles.ruleHeader}>
        <h2>Правила распределения</h2>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Добавить правило
        </button>
      </div>

      <div className={styles.ruleList}>
        {loading ? (
          <div className={styles.loadingState}>Загрузка правил...</div>
        ) : rules.length === 0 ? (
          <div className={styles.emptyState}>Правила не созданы</div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <div className={styles.ruleName}>
                  {rule.name}
                  <span className={`${styles.ruleStatus} ${rule.is_active ? styles.active : styles.inactive}`}>
                    {rule.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
                <div className={styles.ruleActions}>
                  <button onClick={() => handleEdit(rule)} className={styles.editButton}>
                    ✎
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className={styles.deleteButton}>
                    ×
                  </button>
                </div>
              </div>
              <div className={styles.ruleDetails}>
                <div className={styles.ruleDetail}>
                  <span className={styles.detailLabel}>Типы дел:</span>
                  <span className={styles.detailValue}>
                    {rule.case_types && rule.case_types.length > 0
                      ? rule.case_types.map(t => 
                          caseTypeOptions.find(opt => opt.value === t)?.label || t
                        ).join(', ')
                      : 'Все типы'}
                  </span>
                </div>
                <div className={styles.ruleDetail}>
                  <span className={styles.detailLabel}>Судьи:</span>
                  <span className={styles.detailValue}>
                    {rule.judge_ids && rule.judge_ids.length > 0
                      ? rule.judge_ids.map(id => {
                          const judge = judges.find(j => j.id === id);
                          return judge?.full_name || judge?.username || id;
                        }).join(', ')
                      : 'Все судьи'}
                  </span>
                </div>
                <div className={styles.ruleDetail}>
                  <span className={styles.detailLabel}>Нагрузка:</span>
                  <span className={styles.detailValue}>{rule.load_percent}%</span>
                </div>
                <div className={styles.ruleDetail}>
                  <span className={styles.detailLabel}>Приоритет:</span>
                  <span className={styles.detailValue}>{rule.priority}</span>
                </div>
                {rule.description && (
                  <div className={styles.ruleDescription}>
                    {rule.description}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <h2>{editingRule ? 'Редактирование правила' : 'Создание правила'}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Название *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Например: Уголовная коллегия"
                  />
                </div>

                <div className={styles.field}>
                  <label>Приоритет</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="100"
                  />
                </div>

                <div className={styles.field}>
                  <label>Типы дел</label>
                  <select
                    multiple
                    value={formData.case_types}
                    onChange={handleCaseTypeChange}
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
                    onChange={handleJudgeChange}
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
                  <label>Процент нагрузки</label>
                  <input
                    type="number"
                    value={formData.load_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, load_percent: parseInt(e.target.value) || 100 }))}
                    min="0"
                    max="200"
                  />
                  <small>100% - стандартная нагрузка</small>
                </div>

                <div className={styles.field}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Правило активно
                  </label>
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label>Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="2"
                    placeholder="Дополнительная информация о правиле"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" className={styles.confirmButton}>
                  {editingRule ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleManagement;