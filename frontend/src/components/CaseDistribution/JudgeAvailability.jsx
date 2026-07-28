// src/components/CaseDistribution/JudgeAvailability.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const JudgeAvailability = ({ judges, onUpdate }) => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);
  const [formData, setFormData] = useState({
    is_available: true,
    reason: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      const response = await CaseDistributionService.getJudgeAvailabilities();
      setAvailabilities(response.results || response);
    } catch (error) {
      console.error('Ошибка загрузки доступности судей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await CaseDistributionService.updateJudgeAvailability(editingJudge, formData);
      setEditingJudge(null);
      setFormData({
        is_available: true,
        reason: '',
        start_date: '',
        end_date: '',
        notes: ''
      });
      loadAvailabilities();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Ошибка обновления доступности:', error);
      alert('Ошибка при обновлении доступности');
    }
  };

  const openEdit = (judgeId) => {
    const availability = availabilities.find(a => a.judge_id === judgeId);
    setEditingJudge(judgeId);
    setFormData({
      is_available: availability?.is_available !== undefined ? availability.is_available : true,
      reason: availability?.reason || '',
      start_date: availability?.start_date || '',
      end_date: availability?.end_date || '',
      notes: availability?.notes || ''
    });
  };

  const getAvailabilityStatus = (judgeId) => {
    const availability = availabilities.find(a => a.judge_id === judgeId);
    if (!availability) return { status: 'available', label: 'Доступен', color: '#68d391' };
    if (!availability.is_available) {
      return { 
        status: 'unavailable', 
        label: `Недоступен (${availability.reason || 'причина не указана'})`,
        color: '#fc8181'
      };
    }
    return { status: 'available', label: 'Доступен', color: '#68d391' };
  };

  return (
    <div className={styles.judgeAvailability}>
      <h2>Доступность судей</h2>
      
      <div className={styles.availabilityList}>
        {loading ? (
          <div className={styles.loadingState}>Загрузка...</div>
        ) : judges.length === 0 ? (
          <div className={styles.emptyState}>Нет данных о судьях</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Судья</th>
                  <th>Коллегия</th>
                  <th>Статус</th>
                  <th>Причина</th>
                  <th>Период</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {judges.map(judge => {
                  const status = getAvailabilityStatus(judge.id);
                  const availability = availabilities.find(a => a.judge_id === judge.id);
                  return (
                    <tr key={judge.id}>
                      <td>{judge.full_name || judge.username}</td>
                      <td>{judge.collegium || '-'}</td>
                      <td>
                        <span 
                          className={styles.statusBadge}
                          style={{ backgroundColor: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>{availability?.reason || '-'}</td>
                      <td>
                        {availability?.start_date && availability?.end_date
                          ? `${new Date(availability.start_date).toLocaleDateString('ru-RU')} — ${new Date(availability.end_date).toLocaleDateString('ru-RU')}`
                          : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => openEdit(judge.id)}
                          className={styles.editButton}
                        >
                          {availability?.is_available === false ? 'Восстановить' : 'Изменить'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка редактирования доступности */}
      {editingJudge && (
        <div className={styles.modalOverlay} onClick={() => setEditingJudge(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Изменение доступности судьи</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                  />
                  Судья доступен для распределения
                </label>
              </div>

              {!formData.is_available && (
                <>
                  <div className={styles.field}>
                    <label>Причина недоступности *</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      required
                      placeholder="Отпуск, командировка, больничный и т.д."
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Дата начала</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Дата окончания</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className={styles.field}>
                <label>Примечание</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="2"
                  placeholder="Дополнительная информация"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setEditingJudge(null)} className={styles.cancelButton}>
                  Отмена
                </button>
                <button type="submit" className={styles.confirmButton}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeAvailability;