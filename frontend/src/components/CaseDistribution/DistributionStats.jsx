// src/components/CaseDistribution/DistributionStats.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const DistributionStats = ({ stats, onRefresh }) => {
  const [judgeLoad, setJudgeLoad] = useState([]);
  const [period, setPeriod] = useState('year');
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [judgeStats, setJudgeStats] = useState(null);
  const [judges, setJudges] = useState([]);

  useEffect(() => {
    loadJudges();
    loadJudgeLoad();
  }, [period, selectedYear]);

  const loadJudges = async () => {
    try {
      const response = await CaseDistributionService.getAvailableJudges();
      setJudges(response || []);
    } catch (error) {
      console.error('Ошибка загрузки судей:', error);
    }
  };

  const loadJudgeLoad = async () => {
    try {
      setLoading(true);
      const params = { period, year: selectedYear };
      
      if (selectedJudgeId) {
        params.judge_id = selectedJudgeId;
      }
      
      const response = await CaseDistributionService.getJudgeLoad(params);
      
      if (Array.isArray(response)) {
        setJudgeLoad(response);
      } else if (response && typeof response === 'object') {
        const data = response.results || response.data || response.judges || [];
        setJudgeLoad(Array.isArray(data) ? data : []);
      } else {
        setJudgeLoad([]);
      }
      
      // Если выбран конкретный судья, загружаем его детальную статистику
      if (selectedJudgeId) {
        const statsResponse = await CaseDistributionService.getJudgeStats(selectedJudgeId, { year: selectedYear });
        setJudgeStats(statsResponse);
      } else {
        setJudgeStats(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки нагрузки судей:', error);
      setJudgeLoad([]);
    } finally {
      setLoading(false);
    }
  };

  const getLoadColor = (load) => {
    if (load < 50) return '#68d391';
    if (load < 80) return '#f6ad55';
    if (load < 100) return '#fc8181';
    return '#c53030';
  };

  const formatPeriodLabel = () => {
    if (period === 'year') return `${selectedYear} год`;
    if (period === 'quarter') return `${selectedYear}, ${Math.ceil(new Date().getMonth() / 3)} квартал`;
    if (period === 'month') return `${selectedYear}, ${new Date().toLocaleString('ru', { month: 'long' })}`;
    return 'За все время';
  };

  const handleJudgeChange = (e) => {
    setSelectedJudgeId(e.target.value);
  };

  const handleRefresh = () => {
    onRefresh();
    loadJudgeLoad();
  };

  // Подготовка данных для графика (простая таблица)
  const renderJudgeDetail = () => {
    if (!judgeStats) return null;
    
    return (
      <div className={styles.judgeDetailStats}>
        <h4>Детальная статистика судьи</h4>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{judgeStats.total_cases || 0}</div>
            <div className={styles.statCardLabel}>Всего дел</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{judgeStats.pending_cases || 0}</div>
            <div className={styles.statCardLabel}>В производстве</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{judgeStats.completed_cases || 0}</div>
            <div className={styles.statCardLabel}>Рассмотрено</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{judgeStats.total_complexity || 0}</div>
            <div className={styles.statCardLabel}>Общая сложность</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.distributionStats}>
      <div className={styles.statsHeader}>
        <h2>Статистика распределения</h2>
        <div className={styles.statsControls}>
          <select
            value={selectedJudgeId}
            onChange={handleJudgeChange}
            className={styles.filterSelect}
          >
            <option value="">Все судьи</option>
            {judges.map(judge => (
              <option key={judge.id} value={judge.id}>
                {judge.full_name || judge.username}
              </option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="year">За год</option>
            <option value="quarter">За квартал</option>
            <option value="month">За месяц</option>
            <option value="all">За все время</option>
          </select>
          {period !== 'all' && (
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
              className={styles.yearInput}
              min="2000"
              max={new Date().getFullYear()}
            />
          )}
          <button onClick={handleRefresh} className={styles.refreshButton}>
            Обновить
          </button>
        </div>
      </div>

      {/* Общая статистика */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{stats.total_cases || 0}</div>
            <div className={styles.statCardLabel}>Всего дел</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{stats.without_judge || 0}</div>
            <div className={styles.statCardLabel}>Ожидают распределения</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{stats.distributed || 0}</div>
            <div className={styles.statCardLabel}>Распределено</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCardValue}>{stats.active_judges || 0}</div>
            <div className={styles.statCardLabel}>Активных судей</div>
          </div>
        </div>
      )}

      {/* Детальная статистика выбранного судьи */}
      {selectedJudgeId && renderJudgeDetail()}

      {/* Нагрузка судей */}
      <div className={styles.judgeLoadSection}>
        <h3>Нагрузка судей ({formatPeriodLabel()})</h3>
        {loading ? (
          <div className={styles.loadingState}>Загрузка...</div>
        ) : judgeLoad.length === 0 ? (
          <div className={styles.emptyState}>Нет данных о нагрузке</div>
        ) : (
          <div className={styles.judgeLoadGrid}>
            {judgeLoad.map(item => (
              <div key={item.judge_id || item.id} className={styles.judgeLoadCard}>
                <div className={styles.judgeLoadHeader}>
                  <span className={styles.judgeName}>{item.judge_name || item.full_name || 'Без имени'}</span>
                  <span className={styles.judgeCases}>{item.total_cases || 0} дел</span>
                </div>
                <div className={styles.judgeLoadBar}>
                  <div 
                    className={styles.judgeLoadFill}
                    style={{ 
                      width: `${Math.min(item.load_percent || 0, 200)}%`,
                      backgroundColor: getLoadColor(item.load_percent || 0)
                    }}
                  />
                </div>
                <div className={styles.judgeLoadDetails}>
                  <span>Нагрузка: {item.load_percent || 0}%</span>
                  <span>Сложность: {item.total_complexity || 0}</span>
                  <span>Средняя: {item.average_complexity || 0}</span>
                </div>
                {item.availability_reason && (
                  <div className={styles.judgeAvailabilityNote}>
                    ⚠️ {item.availability_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Распределение по типам дел */}
      {stats && stats.by_case_type && (
        <div className={styles.caseTypeSection}>
          <h3>Распределение по типам дел</h3>
          <div className={styles.caseTypeGrid}>
            {Object.entries(stats.by_case_type).map(([type, count]) => (
              <div key={type} className={styles.caseTypeCard}>
                <span className={styles.caseTypeName}>{type}</span>
                <span className={styles.caseTypeCount}>{count} дел</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionStats;