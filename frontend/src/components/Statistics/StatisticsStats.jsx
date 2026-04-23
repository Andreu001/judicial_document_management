// StatisticsStats.jsx
import React, { useState, useEffect } from 'react';
import styles from './Statistics.module.css';

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const StatisticsStats = ({ 
  globalStats, 
  statsLoading, 
  statsCards, 
  toggleStatsCard,
  toggleStatsSection,
  showStatsConfig,
  setShowStatsConfig,
  statsFilters, 
  setStatsFilters, 
  categories,
  loadGlobalStats
}) => {
  
  // Расширенные настройки для каждой карточки
  const [cardDetailsConfig, setCardDetailsConfig] = useState({
    criminal: { showConviction: true, showDuration: true, showDefendants: true },
    civil: { showAvgClaim: true, showMaxClaim: true, showTotalClaim: true },
    admin: { showAvgFine: true, showMaxFine: true, showTotalFine: true },
    kas: { showTotal: true },
    other: { showTotal: true }
  });
  
  const [showDetailsConfig, setShowDetailsConfig] = useState(false);
  
  // Загрузка статистики при изменении фильтров
  useEffect(() => {
    if (loadGlobalStats) {
      loadGlobalStats();
    }
  }, [statsFilters]);
  
  if (statsLoading) {
    return <div className={styles.loading}>Загрузка статистики...</div>;
  }
  
  if (!globalStats) {
    return <div className={styles.emptyState}>Нет данных для статистики</div>;
  }
  
  const handleFilterChange = (key, value) => {
    setStatsFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const updateCardDetailsConfig = (cardId, field, value) => {
    setCardDetailsConfig(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], [field]: value }
    }));
  };
  
  const periodOptions = [
    { value: '12months', label: 'Последние 12 месяцев' },
    { value: '6months', label: 'Последние 6 месяцев' },
    { value: '3months', label: 'Последние 3 месяца' },
    { value: '1month', label: 'Последний месяц' },
    { value: 'year', label: 'Текущий год' },
    { value: 'all', label: 'За все время' },
  ];
  
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
  
  const activeCards = statsCards.filter(c => c.enabled);
  
  // Получение данных по КАС из globalStats
  const kasTotal = globalStats.overview?.kas_total || 0;
  
  return (
    <div className={styles.statsPanel}>
      <div className={styles.statsHeader}>
        <h3>Общая статистика</h3>
        <div className={styles.statsHeaderActions}>
          <button 
            onClick={() => setShowStatsConfig(!showStatsConfig)} 
            className={styles.iconButton}
            title="Настроить отображение разделов"
          >
            Настройка
          </button>
          <button 
            onClick={() => setShowDetailsConfig(!showDetailsConfig)} 
            className={styles.iconButton}
            title="Настроить детализацию"
          >
            Детали
          </button>
        </div>
      </div>
      
      {/* Настройка отображения карточек */}
      {showStatsConfig && (
        <div className={styles.statsConfig}>
          <h4>Отображаемые разделы</h4>
          <div className={styles.cardsConfig}>
            {statsCards.map(card => (
              <label key={card.id} className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={card.enabled}
                  onChange={() => toggleStatsCard(card.id)}
                />
                <span>{card.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Настройка детализации карточек */}
      {showDetailsConfig && (
        <div className={styles.statsConfig}>
          <h4>Настройка детализации по разделам</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Уголовные дела:</strong>
            <div className={styles.cardsConfig}>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.criminal.showConviction}
                  onChange={(e) => updateCardDetailsConfig('criminal', 'showConviction', e.target.checked)}
                />
                <span>Показатели осуждения/оправдания</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.criminal.showDuration}
                  onChange={(e) => updateCardDetailsConfig('criminal', 'showDuration', e.target.checked)}
                />
                <span>Сроки рассмотрения</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.criminal.showDefendants}
                  onChange={(e) => updateCardDetailsConfig('criminal', 'showDefendants', e.target.checked)}
                />
                <span>Количество подсудимых</span>
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Гражданские дела:</strong>
            <div className={styles.cardsConfig}>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.civil.showAvgClaim}
                  onChange={(e) => updateCardDetailsConfig('civil', 'showAvgClaim', e.target.checked)}
                />
                <span>Средняя цена иска</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.civil.showMaxClaim}
                  onChange={(e) => updateCardDetailsConfig('civil', 'showMaxClaim', e.target.checked)}
                />
                <span>Максимальная цена иска</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.civil.showTotalClaim}
                  onChange={(e) => updateCardDetailsConfig('civil', 'showTotalClaim', e.target.checked)}
                />
                <span>Общая сумма исков</span>
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Дела об АП (КоАП):</strong>
            <div className={styles.cardsConfig}>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.admin.showAvgFine}
                  onChange={(e) => updateCardDetailsConfig('admin', 'showAvgFine', e.target.checked)}
                />
                <span>Средний штраф</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.admin.showMaxFine}
                  onChange={(e) => updateCardDetailsConfig('admin', 'showMaxFine', e.target.checked)}
                />
                <span>Максимальный штраф</span>
              </label>
              <label className={styles.configCheckbox}>
                <input
                  type="checkbox"
                  checked={cardDetailsConfig.admin.showTotalFine}
                  onChange={(e) => updateCardDetailsConfig('admin', 'showTotalFine', e.target.checked)}
                />
                <span>Общая сумма штрафов</span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.statsContent}>
        
        <div className={styles.statsFilters}>
          <div className={styles.filterGroup}>
            <label>Период:</label>
            <select 
              value={statsFilters.period} 
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className={styles.selectSmall}
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Судья:</label>
            <select 
              value={statsFilters.judgeId} 
              onChange={(e) => handleFilterChange('judgeId', e.target.value)}
              className={styles.selectSmall}
            >
              <option value="">Все судьи</option>
              {globalStats.by_judge && globalStats.by_judge.map(judge => (
                <option key={judge.id} value={judge.id}>{judge.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Категория:</label>
            <select 
              value={statsFilters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={styles.selectSmall}
            >
              <option value="">Все категории</option>
              <option value="criminal">Уголовные</option>
              <option value="civil">Гражданские</option>
              <option value="admin">Административные (КоАП)</option>
              <option value="kas">КАС</option>
              <option value="other">Иные материалы</option>
            </select>
          </div>
        </div>
        
        
        {activeCards.find(c => c.id === 'criminal') && globalStats.overview?.criminal_total !== undefined && (
          <div className={styles.statsSection}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => toggleStatsSection('criminal')}
              style={{ cursor: 'pointer' }}
            >
              <h4>Уголовные дела</h4>
              <span className={styles.expandIcon}>
                {statsCards.find(c => c.id === 'criminal')?.expanded ? '▼' : '▶'}
              </span>
            </div>
            {statsCards.find(c => c.id === 'criminal')?.expanded && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatNumber(globalStats.overview.criminal_total)}</div>
                  <div className={styles.statLabel}>Всего дел</div>
                </div>
                {cardDetailsConfig.criminal.showDefendants && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatNumber(globalStats.overview?.defendants_total || 0)}</div>
                    <div className={styles.statLabel}>Подсудимых</div>
                  </div>
                )}
                {cardDetailsConfig.criminal.showConviction && (
                  <>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {formatPercent(globalStats.criminal_stats?.conviction_rate, globalStats.overview.criminal_total)}
                      </div>
                      <div className={styles.statLabel}>Осуждено</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>
                        {formatPercent(globalStats.criminal_stats?.acquittal_rate, globalStats.overview.criminal_total)}
                      </div>
                      <div className={styles.statLabel}>Оправдано</div>
                    </div>
                  </>
                )}
                {cardDetailsConfig.criminal.showDuration && (
                  <>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{Math.round(globalStats.criminal_stats?.avg_duration_days || 0)}</div>
                      <div className={styles.statLabel}>Ср. срок рассмотрения (дней)</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{globalStats.criminal_stats?.max_duration_days || 0}</div>
                      <div className={styles.statLabel}>Макс. срок рассмотрения (дней)</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statValue}>{globalStats.criminal_stats?.min_duration_days || 0}</div>
                      <div className={styles.statLabel}>Мин. срок рассмотрения (дней)</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        
        {activeCards.find(c => c.id === 'civil') && globalStats.overview?.civil_total !== undefined && (
          <div className={styles.statsSection}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => toggleStatsSection('civil')}
              style={{ cursor: 'pointer' }}
            >
              <h4>Гражданские дела</h4>
              <span className={styles.expandIcon}>
                {statsCards.find(c => c.id === 'civil')?.expanded ? '▼' : '▶'}
              </span>
            </div>
            {statsCards.find(c => c.id === 'civil')?.expanded && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatNumber(globalStats.overview.civil_total)}</div>
                  <div className={styles.statLabel}>Всего дел</div>
                </div>
                {cardDetailsConfig.civil.showAvgClaim && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.civil_stats?.avg_claim_amount || 0)}</div>
                    <div className={styles.statLabel}>Средняя цена иска</div>
                  </div>
                )}
                {cardDetailsConfig.civil.showMaxClaim && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.civil_stats?.max_claim_amount || 0)}</div>
                    <div className={styles.statLabel}>Максимальная цена иска</div>
                  </div>
                )}
                {cardDetailsConfig.civil.showTotalClaim && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.civil_stats?.total_claim_amount || 0)}</div>
                    <div className={styles.statLabel}>Общая сумма исков</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        
        {activeCards.find(c => c.id === 'admin') && globalStats.overview?.admin_total !== undefined && (
          <div className={styles.statsSection}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => toggleStatsSection('admin')}
              style={{ cursor: 'pointer' }}
            >
              <h4>Дела об административных правонарушениях (КоАП)</h4>
              <span className={styles.expandIcon}>
                {statsCards.find(c => c.id === 'admin')?.expanded ? '▼' : '▶'}
              </span>
            </div>
            {statsCards.find(c => c.id === 'admin')?.expanded && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatNumber(globalStats.overview.admin_total)}</div>
                  <div className={styles.statLabel}>Всего дел</div>
                </div>
                {cardDetailsConfig.admin.showAvgFine && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.admin_stats?.avg_fine_amount || 0)}</div>
                    <div className={styles.statLabel}>Средний штраф</div>
                  </div>
                )}
                {cardDetailsConfig.admin.showMaxFine && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.admin_stats?.max_fine_amount || 0)}</div>
                    <div className={styles.statLabel}>Максимальный штраф</div>
                  </div>
                )}
                {cardDetailsConfig.admin.showTotalFine && (
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatCurrency(globalStats.admin_stats?.total_fine_amount || 0)}</div>
                    <div className={styles.statLabel}>Общая сумма штрафов</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        
        {activeCards.find(c => c.id === 'kas') && (
          <div className={styles.statsSection}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => toggleStatsSection('kas')}
              style={{ cursor: 'pointer' }}
            >
              <h4>Дела КАС</h4>
              <span className={styles.expandIcon}>
                {statsCards.find(c => c.id === 'kas')?.expanded ? '▼' : '▶'}
              </span>
            </div>
            {statsCards.find(c => c.id === 'kas')?.expanded && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatNumber(kasTotal)}</div>
                  <div className={styles.statLabel}>Всего дел</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        
        {activeCards.find(c => c.id === 'other') && globalStats.overview?.other_total !== undefined && (
          <div className={styles.statsSection}>
            <div 
              className={styles.sectionHeader} 
              onClick={() => toggleStatsSection('other')}
              style={{ cursor: 'pointer' }}
            >
              <h4>Иные материалы</h4>
              <span className={styles.expandIcon}>
                {statsCards.find(c => c.id === 'other')?.expanded ? '▼' : '▶'}
              </span>
            </div>
            {statsCards.find(c => c.id === 'other')?.expanded && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{formatNumber(globalStats.overview.other_total)}</div>
                  <div className={styles.statLabel}>Всего материалов</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        
        {globalStats.by_judge && globalStats.by_judge.length > 0 && (
          <div className={styles.statsSection}>
            <div className={styles.sectionHeader}>
              <h4>Нагрузка на судей</h4>
            </div>
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
          </div>
        )}
        
        
        {globalStats.timeline?.by_month && globalStats.timeline.by_month.length > 0 && (
          <div className={styles.statsSection}>
            <div className={styles.sectionHeader}>
              <h4>Поступление дел по месяцам</h4>
            </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsStats;