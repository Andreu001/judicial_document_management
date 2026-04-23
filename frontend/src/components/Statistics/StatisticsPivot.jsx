// StatisticsPivot.jsx - ПОЛНОСТЬЮ ЗАМЕНИТЬ ФАЙЛ

import React, { useMemo, useState } from 'react';
import styles from './Statistics.module.css';

const StatisticsPivot = ({ fullResults, loading, pivotConfig, currentFields, selectedFields }) => {
  const [pivotRowsExpanded, setPivotRowsExpanded] = useState(new Set());
  
  const formatValue = (value) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      if (value.id !== undefined) {
        return value.str || value.__str__ || `${value.id}`;
      }
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    if (typeof value === 'number') return value.toLocaleString('ru-RU');
    return String(value);
  };
  
  const getFieldVerboseName = (fieldName) => {
    const field = currentFields.find(f => f.name === fieldName);
    return field?.verbose_name || fieldName.replace(/_/g, ' ');
  };
  
  // Получение отображаемого значения для поля со списком
  const getDisplayValue = (fieldName, rawValue) => {
    if (rawValue === null || rawValue === undefined) return 'не указано';
    
    const field = currentFields.find(f => f.name === fieldName);
    if (field && field.choices && field.choices.length > 0) {
      const choice = field.choices.find(c => c.value == rawValue);
      if (choice) return choice.label;
    }
    
    if (typeof rawValue === 'object') {
      return rawValue.str || rawValue.__str__ || rawValue.id || 'не указано';
    }
    
    return String(rawValue);
  };
  
  const pivotData = useMemo(() => {
    if (pivotConfig.rows.length === 0) {
      return null;
    }
    
    // Определяем, нужно ли показывать количество
    const showCount = pivotConfig.countEnabled === true;
    const valueFields = pivotConfig.values || [];
    
    const groups = new Map();
    const rowValuesSet = new Set();
    const colValuesSet = new Set();
    
    fullResults.forEach(row => {
      // Формируем ключ строки с отображаемыми значениями
      const rowKeyParts = pivotConfig.rows.map(f => {
        const rawVal = row[f];
        return getDisplayValue(f, rawVal);
      });
      const rowKey = rowKeyParts.join(' | ');
      
      // Формируем ключ столбца
      let colKey = 'ИТОГО';
      if (pivotConfig.columns.length > 0) {
        const colKeyParts = pivotConfig.columns.map(f => {
          const rawVal = row[f];
          return getDisplayValue(f, rawVal);
        });
        colKey = colKeyParts.join(' | ');
      }
      
      rowValuesSet.add(rowKey);
      colValuesSet.add(colKey);
      
      if (!groups.has(rowKey)) {
        groups.set(rowKey, new Map());
      }
      
      const rowGroup = groups.get(rowKey);
      if (!rowGroup.has(colKey)) {
        rowGroup.set(colKey, { 
          count: 0, 
          values: [], 
          sums: {},
          items: []  // Сохраняем список ID для детализации
        });
      }
      
      const cell = rowGroup.get(colKey);
      cell.count++;
      if (row.id) cell.items.push(row.id);
      
      // Агрегация по выбранным полям значений
      valueFields.forEach(v => {
        let val = row[v.field];
        if (val && typeof val === 'object') {
          if (val.id !== undefined) {
            val = val.id;
          } else {
            val = null;
          }
        }
        
        // Для полей со списками считаем количество вхождений каждого значения
        const field = currentFields.find(f => f.name === v.field);
        if (field && field.choices && field.choices.length > 0) {
          // Для полей со списками - считаем количество записей с этим значением
          const choiceKey = getDisplayValue(v.field, val);
          if (!cell.sums[v.field]) {
            cell.sums[v.field] = {};
          }
          cell.sums[v.field][choiceKey] = (cell.sums[v.field][choiceKey] || 0) + 1;
        } else {
          // Для числовых полей - стандартные агрегации
          const numVal = parseFloat(val);
          if (!isNaN(numVal)) {
            if (v.aggregation === 'sum') {
              cell.sums[v.field] = (cell.sums[v.field] || 0) + numVal;
            } else if (v.aggregation === 'avg') {
              cell.values.push(numVal);
            } else if (v.aggregation === 'count') {
              cell.sums[v.field] = (cell.sums[v.field] || 0) + 1;
            } else if (v.aggregation === 'min') {
              if (cell.sums[v.field] === undefined || numVal < cell.sums[v.field]) {
                cell.sums[v.field] = numVal;
              }
            } else if (v.aggregation === 'max') {
              if (cell.sums[v.field] === undefined || numVal > cell.sums[v.field]) {
                cell.sums[v.field] = numVal;
              }
            }
          }
        }
      });
    });
    
    // Вычисляем средние значения
    for (const rowGroup of groups.values()) {
      for (const cell of rowGroup.values()) {
        valueFields.forEach(v => {
          const field = currentFields.find(f => f.name === v.field);
          if (field && field.choices && field.choices.length > 0) {
            // Для полей со списками ничего не делаем дополнительно
          } else if (v.aggregation === 'avg' && cell.values.length > 0) {
            cell.sums[v.field] = cell.values.reduce((a, b) => a + b, 0) / cell.values.length;
            delete cell.values;
          }
        });
      }
    }
    
    const sortedRows = Array.from(rowValuesSet).sort();
    const sortedCols = Array.from(colValuesSet).sort();
    
    return { groups, rows: sortedRows, cols: sortedCols };
  }, [fullResults, pivotConfig, currentFields]);
  
  const getCellValue = (colMap, colKey, valueConfig, showCount = false) => {
    const cell = colMap?.get(colKey);
    if (!cell) return null;
    
    if (showCount) {
      return cell.count;
    }
    
    if (!valueConfig) return null;
    
    const field = currentFields.find(f => f.name === valueConfig.field);
    
    // Для полей со списками
    if (field && field.choices && field.choices.length > 0) {
      if (valueConfig.aggregation === 'count') {
        // Суммируем все подсчитанные значения
        const sums = cell.sums[valueConfig.field] || {};
        return Object.values(sums).reduce((a, b) => a + b, 0);
      }
      return null;
    }
    
    // Для числовых полей
    if (valueConfig.aggregation === 'count') {
      return cell.count;
    } else if (valueConfig.aggregation === 'sum') {
      return cell.sums[valueConfig.field] || 0;
    } else if (valueConfig.aggregation === 'avg') {
      return cell.sums[valueConfig.field] ? cell.sums[valueConfig.field].toFixed(2) : 0;
    } else if (valueConfig.aggregation === 'min') {
      return cell.sums[valueConfig.field] !== undefined ? cell.sums[valueConfig.field] : 0;
    } else if (valueConfig.aggregation === 'max') {
      return cell.sums[valueConfig.field] !== undefined ? cell.sums[valueConfig.field] : 0;
    }
    return null;
  };
  
  const togglePivotRowExpand = (rowKey) => {
    if (pivotRowsExpanded.has(rowKey)) {
      pivotRowsExpanded.delete(rowKey);
    } else {
      pivotRowsExpanded.add(rowKey);
    }
    setPivotRowsExpanded(new Set(pivotRowsExpanded));
  };
  
  if (loading) {
    return <div className={styles.loading}>Загрузка данных для сводной таблицы...</div>;
  }
  
  if (!pivotData || pivotData.rows.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Нет данных для сводной таблицы</p>
        <p>Настройте строки, столбцы и значения в левой панели</p>
      </div>
    );
  }
  
  const columnHeaders = pivotData.cols;
  const showCount = pivotConfig.countEnabled === true;
  const primaryValueConfig = (pivotConfig.values || [])[0];
  const hasValues = showCount || (primaryValueConfig && primaryValueConfig.aggregation);
  
  // Получение заголовка для колонки значений
  const getValueColumnLabel = () => {
    if (showCount) return 'Количество';
    if (primaryValueConfig) {
      const field = currentFields.find(f => f.name === primaryValueConfig.field);
      const aggLabels = {
        count: 'Количество',
        sum: 'Сумма',
        avg: 'Среднее',
        min: 'Минимум',
        max: 'Максимум'
      };
      const aggLabel = aggLabels[primaryValueConfig.aggregation] || primaryValueConfig.aggregation;
      return `${field?.verbose_name || primaryValueConfig.field} (${aggLabel})`;
    }
    return 'Значение';
  };
  
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th className={styles.pivotRowHeader}>
              {pivotConfig.rows.map(r => getFieldVerboseName(r)).join(' / ')}
            </th>
            {columnHeaders.map(colKey => (
              <th key={colKey} className={styles.tableHeader}>
                {colKey}
              </th>
            ))}
            {hasValues && columnHeaders.length > 0 && (
              <th className={styles.tableHeader}>{getValueColumnLabel()}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {pivotData.rows.map(rowKey => {
            const colMap = pivotData.groups.get(rowKey);
            const isExpanded = pivotRowsExpanded.has(rowKey);
            const hasSubRows = rowKey.includes(' | ');
            
            let displayRowKey = rowKey;
            if (hasSubRows && isExpanded) {
              displayRowKey = rowKey.split(' | ')[0];
            }
            
            return (
              <React.Fragment key={rowKey}>
                <tr 
                  className={styles.tableRow}
                  onClick={() => hasSubRows && togglePivotRowExpand(rowKey)}
                  style={{ cursor: hasSubRows ? 'pointer' : 'default' }}
                >
                  <td className={styles.pivotRowCell}>
                    {hasSubRows && (
                      <span className={styles.expandIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                    {displayRowKey}
                  </td>
                  
                  {columnHeaders.map(colKey => {
                    if (hasValues) {
                      return (
                        <td key={colKey} className={styles.tableCell}>
                          {formatValue(getCellValue(colMap, colKey, primaryValueConfig, showCount) || '—')}
                        </td>
                      );
                    }
                    const value = getCellValue(colMap, colKey, primaryValueConfig, showCount);
                    return (
                      <td key={colKey} className={styles.tableCell}>
                        {value !== null ? formatValue(value) : '—'}
                      </td>
                    );
                  })}
                </tr>
                
                {isExpanded && hasSubRows && (
                  <tr className={styles.expandedRow}>
                    <td colSpan={columnHeaders.length + (hasValues ? 2 : 1)}>
                      <div className={styles.expandedContent}>
                        <table className={styles.subTable}>
                          <thead>
                            <tr>
                              <th>Детализация</th>
                              {columnHeaders.map(colKey => (
                                <th key={colKey}>{colKey}</th>
                              ))}
                              {hasValues && <th>{getValueColumnLabel()}</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(pivotData.groups.entries())
                              .filter(([key]) => key.startsWith(rowKey.split(' | ')[0] + ' | ') && key !== rowKey)
                              .map(([subRowKey, subColMap]) => (
                                <tr key={subRowKey}>
                                  <td className={styles.subRowCell}>
                                    {subRowKey.split(' | ').slice(1).join(' | ')}
                                  </td>
                                  {columnHeaders.map(colKey => {
                                    if (hasValues) {
                                      return (
                                        <td key={colKey} className={styles.tableCell}>
                                          {formatValue(getCellValue(subColMap, colKey, primaryValueConfig, showCount) || '—')}
                                        </td>
                                      );
                                    }
                                    const value = getCellValue(subColMap, colKey, primaryValueConfig, showCount);
                                    return (
                                      <td key={colKey} className={styles.tableCell}>
                                        {value !== null ? formatValue(value) : '—'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Строка итогов */}
          {columnHeaders.length > 0 && (
            <tr className={styles.totalRow}>
              <td className={styles.totalCell}><strong>ИТОГО</strong></td>
              {columnHeaders.map(colKey => {
                let total = 0;
                for (const [_, colMap] of pivotData.groups) {
                  const cell = colMap.get(colKey);
                  if (cell) {
                    if (showCount) {
                      total += cell.count;
                    } else if (primaryValueConfig && primaryValueConfig.aggregation === 'sum') {
                      total += cell.sums[primaryValueConfig.field] || 0;
                    } else if (primaryValueConfig && primaryValueConfig.aggregation === 'count') {
                      total += cell.count;
                    }
                  }
                }
                return (
                  <td key={colKey} className={styles.totalCell}>
                    <strong>{formatValue(total)}</strong>
                  </td>
                );
              })}
              {hasValues && (
                <td className={styles.totalCell}>
                  <strong>
                    {formatValue(Array.from(pivotData.groups.values()).reduce((sum, colMap) => {
                      let total = 0;
                      for (const cell of colMap.values()) {
                        if (showCount) {
                          total += cell.count;
                        } else if (primaryValueConfig && primaryValueConfig.aggregation === 'sum') {
                          total += cell.sums[primaryValueConfig.field] || 0;
                        } else if (primaryValueConfig && primaryValueConfig.aggregation === 'count') {
                          total += cell.count;
                        }
                      }
                      return sum + total;
                    }, 0))}
                  </strong>
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StatisticsPivot;