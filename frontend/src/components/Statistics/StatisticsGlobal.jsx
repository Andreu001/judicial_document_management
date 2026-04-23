// StatisticsGlobal.jsx
import React, { useState, useEffect } from 'react';
import styles from './Statistics.module.css';

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const StatisticsGlobal = ({ globalStats, statsLoading, onRefresh }) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    criminal: true,
    civil: true,
    admin: true,
    kas: true,
    other: true,
    judges: true,
    timeline: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (statsLoading) {
    return <div className={styles.loading}>Загрузка статистики...</div>;
  }

  if (!globalStats) {
    return <div className={styles.emptyState}>Нет данных для статистики</div>;
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '0 руб.';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(num);
  };

  const formatPercent = (part, total) => {
    if (!total || total === 0) return '0%';
    return Math.round((part / total) * 100) + '%';
  };

  const maxTimelineValue = globalStats.timeline?.by_month 
    ? Math.max(...globalStats.timeline.by_month.map(m => (m.criminal || 0) + (m.civil || 0) + (m.admin || 0) + (m.kas || 0)))
    : 100;

  return (
    <div className={styles.globalStatsContainer}>
      {/* Кнопка обновления */}
      <div className={styles.globalStatsHeader}>
        <h3>Общая статистика по всем категориям</h3>
        <button onClick={onRefresh} className={styles.refreshButton} disabled={statsLoading}>
          Обновить
        </button>
      </div>

      {/* Общий обзор */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('overview')}
        >
          <h4>Общий обзор</h4>
          <span className={styles.expandIcon}>
            {expandedSections.overview ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.overview && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.criminal_total || 0)}</div>
              <div className={styles.statLabel}>Уголовные дела</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.civil_total || 0)}</div>
              <div className={styles.statLabel}>Гражданские дела</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.admin_total || 0)}</div>
              <div className={styles.statLabel}>Дела об АП (КоАП)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.kas_total || 0)}</div>
              <div className={styles.statLabel}>Дела КАС</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.other_total || 0)}</div>
              <div className={styles.statLabel}>Иные материалы</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.defendants_total || 0)}</div>
              <div className={styles.statLabel}>Всего подсудимых</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.criminal_decisions_total || 0)}</div>
              <div className={styles.statLabel}>Судебных решений</div>
            </div>
          </div>
        )}
      </div>

      {/* Уголовные дела */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('criminal')}
        >
          <h4>Уголовные дела - детализация</h4>
          <span className={styles.expandIcon}>
            {expandedSections.criminal ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.criminal && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.criminal_total || 0)}</div>
              <div className={styles.statLabel}>Всего дел</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.defendants_total || 0)}</div>
              <div className={styles.statLabel}>Подсудимых</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {formatPercent(globalStats.criminal_stats?.conviction_rate, globalStats.overview?.criminal_total)}
              </div>
              <div className={styles.statLabel}>Осуждено</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {formatPercent(globalStats.criminal_stats?.acquittal_rate, globalStats.overview?.criminal_total)}
              </div>
              <div className={styles.statLabel}>Оправдано</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{Math.round(globalStats.criminal_stats?.avg_duration_days || 0)}</div>
              <div className={styles.statLabel}>Ср. срок рассмотрения (дней)</div>
            </div>
          </div>
        )}
      </div>

      {/* Гражданские дела */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('civil')}
        >
          <h4>Гражданские дела - детализация</h4>
          <span className={styles.expandIcon}>
            {expandedSections.civil ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.civil && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.civil_total || 0)}</div>
              <div className={styles.statLabel}>Всего дел</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatCurrency(globalStats.civil_stats?.avg_claim_amount || 0)}</div>
              <div className={styles.statLabel}>Средняя цена иска</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatCurrency(globalStats.civil_stats?.total_claim_amount || 0)}</div>
              <div className={styles.statLabel}>Общая сумма исков</div>
            </div>
          </div>
        )}
      </div>

      {/* Дела об АП (КоАП) */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('admin')}
        >
          <h4>Дела об АП (КоАП) - детализация</h4>
          <span className={styles.expandIcon}>
            {expandedSections.admin ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.admin && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.admin_total || 0)}</div>
              <div className={styles.statLabel}>Всего дел</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatCurrency(globalStats.admin_stats?.avg_fine_amount || 0)}</div>
              <div className={styles.statLabel}>Средний штраф</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatCurrency(globalStats.admin_stats?.total_fine_amount || 0)}</div>
              <div className={styles.statLabel}>Общая сумма штрафов</div>
            </div>
          </div>
        )}
      </div>

      {/* Дела КАС */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('kas')}
        >
          <h4>Дела КАС - детализация</h4>
          <span className={styles.expandIcon}>
            {expandedSections.kas ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.kas && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.kas_total || 0)}</div>
              <div className={styles.statLabel}>Всего дел</div>
            </div>
          </div>
        )}
      </div>

      {/* Иные материалы */}
      <div className={styles.globalStatsSection}>
        <div 
          className={styles.globalStatsSectionHeader}
          onClick={() => toggleSection('other')}
        >
          <h4>Иные материалы - детализация</h4>
          <span className={styles.expandIcon}>
            {expandedSections.other ? '▼' : '▶'}
          </span>
        </div>
        {expandedSections.other && (
          <div className={styles.globalStatsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatNumber(globalStats.overview?.other_total || 0)}</div>
              <div className={styles.statLabel}>Всего материалов</div>
            </div>
          </div>
        )}
      </div>

      {/* Нагрузка на судей */}
      {globalStats.by_judge && globalStats.by_judge.length > 0 && (
        <div className={styles.globalStatsSection}>
          <div 
            className={styles.globalStatsSectionHeader}
            onClick={() => toggleSection('judges')}
          >
            <h4>Нагрузка на судей</h4>
            <span className={styles.expandIcon}>
              {expandedSections.judges ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.judges && (
            <div className={styles.judgeStats}>
              <div className={styles.judgeTable}>
                <div className={styles.judgeHeader}>
                  <span>Судья</span>
                  <span>Уголовных</span>
                  <span>Гражданских</span>
                  <span>Административных</span>
                  <span>КАС</span>
                  <span>Всего</span>
                </div>
                {globalStats.by_judge.map(judge => (
                  <div key={judge.id} className={styles.judgeRow}>
                    <span className={styles.judgeName}>{judge.full_name}</span>
                    <span className={styles.judgeCount}>{judge.criminal_count || 0}</span>
                    <span className={styles.judgeCount}>{judge.civil_count || 0}</span>
                    <span className={styles.judgeCount}>{judge.admin_count || 0}</span>
                    <span className={styles.judgeCount}>{judge.kas_count || 0}</span>
                    <span className={styles.judgeTotal}>
                      {(judge.criminal_count || 0) + (judge.civil_count || 0) + (judge.admin_count || 0) + (judge.kas_count || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Временная шкала */}
      {globalStats.timeline?.by_month && globalStats.timeline.by_month.length > 0 && (
        <div className={styles.globalStatsSection}>
          <div 
            className={styles.globalStatsSectionHeader}
            onClick={() => toggleSection('timeline')}
          >
            <h4>Поступление дел по месяцам</h4>
            <span className={styles.expandIcon}>
              {expandedSections.timeline ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.timeline && (
            <div className={styles.timelineChart}>
              {globalStats.timeline.by_month.slice(-12).map((month, idx) => {
                const total = (month.criminal || 0) + (month.civil || 0) + (month.admin || 0) + (month.kas || 0);
                const criminalPercent = maxTimelineValue > 0 ? (month.criminal || 0) / maxTimelineValue * 100 : 0;
                const civilPercent = maxTimelineValue > 0 ? (month.civil || 0) / maxTimelineValue * 100 : 0;
                const adminPercent = maxTimelineValue > 0 ? (month.admin || 0) / maxTimelineValue * 100 : 0;
                const kasPercent = maxTimelineValue > 0 ? (month.kas || 0) / maxTimelineValue * 100 : 0;

                return (
                  <div key={idx} className={styles.timelineBar}>
                    <div className={styles.timelineLabel}>
                      {monthNames[month.month - 1]} {month.year}
                    </div>
                    <div className={styles.timelineBars}>
                      {(month.criminal || 0) > 0 && (
                        <div 
                          className={styles.timelineBarCriminal} 
                          style={{ width: `${Math.max(2, criminalPercent)}%` }}
                          title={`Уголовные: ${month.criminal}`}
                        >
                          <span>{month.criminal}</span>
                        </div>
                      )}
                      {(month.civil || 0) > 0 && (
                        <div 
                          className={styles.timelineBarCivil} 
                          style={{ width: `${Math.max(2, civilPercent)}%` }}
                          title={`Гражданские: ${month.civil}`}
                        >
                          <span>{month.civil}</span>
                        </div>
                      )}
                      {(month.admin || 0) > 0 && (
                        <div 
                          className={styles.timelineBarAdmin} 
                          style={{ width: `${Math.max(2, adminPercent)}%` }}
                          title={`Административные: ${month.admin}`}
                        >
                          <span>{month.admin}</span>
                        </div>
                      )}
                      {(month.kas || 0) > 0 && (
                        <div 
                          className={styles.timelineBarKas} 
                          style={{ width: `${Math.max(2, kasPercent)}%` }}
                          title={`КАС: ${month.kas}`}
                        >
                          <span>{month.kas}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.timelineTotal}>
                      {total}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatisticsGlobal;