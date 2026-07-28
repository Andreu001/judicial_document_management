// src/components/CaseDistribution/DistributionLogView.jsx
import React, { useState, useEffect } from 'react';
import CaseDistributionService from '../../API/CaseDistributionService';
import styles from './CaseDistribution.module.css';

const DistributionLogView = ({ onExport }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user: '',
    case_type: '',
    action_type: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    loadLogs();
  }, [filters, pagination.currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await CaseDistributionService.getDistributionLog({
        ...filters,
        page: pagination.currentPage
      });
      
      let results = [];
      let count = 0;
      
      if (Array.isArray(response)) {
        results = response;
        count = response.length;
      } else if (response && typeof response === 'object') {
        results = response.results || [];
        count = response.count || results.length;
      }
      
      setLogs(results);
      setPagination({
        currentPage: pagination.currentPage,
        totalPages: Math.ceil(count / 20) || 1,
        totalItems: count
      });
    } catch (error) {
      console.error('Ошибка загрузки журнала:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExportAll = () => {
    onExport(filters);
  };

  const handleExportSingle = async (logId) => {
    try {
      setExporting(true);
      const blob = await CaseDistributionService.exportProtocol(logId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Протокол_${logId}_${new Date().toLocaleDateString('ru-RU')}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта протокола:', error);
      alert('Ошибка при экспорте протокола');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getActionTypeLabel = (type) => {
    const map = {
      'auto': 'Автораспределение',
      'auto_distribute': 'Автораспределение',
      'manual': 'Ручное назначение',
      'manual_assign': 'Ручное назначение',
      'reassign': 'Перераспределение',
      'bulk_assign': 'Массовое назначение',
      'sanction': 'Санкционное'
    };
    return map[type] || type || 'Неизвестно';
  };

  const getStatusLabel = (status) => {
    const map = {
      'pending': 'В процессе',
      'completed': 'Завершен',
      'cancelled': 'Отменен'
    };
    return map[status] || status || 'Неизвестно';
  };

  return (
    <div className={styles.logView}>
      <div className={styles.logHeader}>
        <h2>Журнал распределения дел</h2>
        <div className={styles.logHeaderActions}>
          <button onClick={handleExportAll} className={styles.exportButton} disabled={exporting}>
            {exporting ? 'Экспорт...' : '📄 Экспорт всех (за период)'}
          </button>
        </div>
      </div>

      <div className={styles.logFilters}>
        <input
          type="date"
          name="start_date"
          value={filters.start_date}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <span>—</span>
        <input
          type="date"
          name="end_date"
          value={filters.end_date}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <select
          name="action_type"
          value={filters.action_type}
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">Все действия</option>
          <option value="auto_distribute">Автораспределение</option>
          <option value="manual_assign">Ручное назначение</option>
          <option value="reassign">Перераспределение</option>
          <option value="bulk_assign">Массовое назначение</option>
        </select>
        <button onClick={loadLogs} className={styles.filterButton}>Применить</button>
        <button onClick={() => {
          setFilters({ start_date: '', end_date: '', user: '', case_type: '', action_type: '' });
          setPagination(prev => ({ ...prev, currentPage: 1 }));
        }} className={styles.filterButton} style={{ background: '#718096' }}>
          Сбросить
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата/время</th>
              <th>Протокол</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Статус</th>
              <th>Всего дел</th>
              <th>Распределено</th>
              <th>Ошибок</th>
              <th>Экспорт</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className={styles.loadingRow}>Загрузка...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="9" className={styles.emptyRow}>Нет записей в журнале</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>{formatDate(log.started_at || log.created_at)}</td>
                  <td><strong>{log.protocol_number || '-'}</strong></td>
                  <td>{log.executed_by_name || log.executed_by || '-'}</td>
                  <td>
                    <span className={styles.actionTypeBadge}>
                      {getActionTypeLabel(log.distribution_type || log.action_type)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.statusBadge} style={{
                      backgroundColor: log.status === 'completed' ? '#68d391' : 
                                     log.status === 'pending' ? '#f6ad55' : '#fc8181'
                    }}>
                      {getStatusLabel(log.status)}
                    </span>
                  </td>
                  <td>{log.total_cases || 0}</td>
                  <td>{log.distributed_cases || 0}</td>
                  <td>{log.failed_cases || 0}</td>
                  <td>
                    {log.status === 'completed' && (
                      <button
                        onClick={() => handleExportSingle(log.id)}
                        className={styles.exportButton}
                        disabled={exporting}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        📄
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={pagination.currentPage <= 1}
          >
            ←
          </button>
          <span>Страница {pagination.currentPage} из {pagination.totalPages}</span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default DistributionLogView;