// StatisticsTable.jsx - с drag-and-drop перетаскиванием колонок

import React, { useState } from 'react';
import styles from './Statistics.module.css';

const StatisticsTable = ({ 
  results, 
  loading, 
  selectedFields, 
  setSelectedFields,  // ДОБАВЛЯЕМ эту пропсу!
  currentFields, 
  meta, 
  executeQuery,
  totalCount,
  pageSize,
  currentPage,
  setCurrentPage
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  const formatValue = (value, fieldName = null) => {
    if (value === null || value === undefined) return '—';
    
    if (typeof value === 'object') {
      if (value.id !== undefined) {
        if (value.str || value.__str__) {
          return value.str || value.__str__;
        }
        const displayName = value.name || value.full_name || value.title || '';
        if (displayName) {
          return `${displayName} (ID: ${value.id})`;
        }
        return `ID: ${value.id}`;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return '—';
        return value.map(v => formatValue(v)).join(', ');
      }
      return JSON.stringify(value);
    }
    
    if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
    
    if (typeof value === 'number') {
      if (fieldName && (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('sum') || fieldName.toLowerCase().includes('fine'))) {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(value);
      }
      return new Intl.NumberFormat('ru-RU').format(value);
    }
    
    if (fieldName && (fieldName.includes('date') || fieldName.includes('Date')) && typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('ru-RU');
      }
    }
    
    return String(value);
  };
  
  const getFieldVerboseName = (fieldName) => {
    const field = currentFields.find(f => f.name === fieldName);
    return field?.verbose_name || fieldName.replace(/_/g, ' ');
  };
  
  // Drag and Drop handlers для колонок
  const handleDragStart = (e, index, fieldName) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumn({ index, fieldName });
    e.target.style.opacity = '0.5';
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== index) {
      setDragOverColumn(index);
    }
  };
  
  const handleDragLeave = (e) => {
    setDragOverColumn(null);
  };
  
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedColumn && draggedColumn.index !== targetIndex) {
      const newFields = [...selectedFields];
      const [removed] = newFields.splice(draggedColumn.index, 1);
      newFields.splice(targetIndex, 0, removed);
      setSelectedFields(newFields);
      // Перезагружаем данные с новым порядком колонок
      executeQuery(currentPage);
    }
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };
  
  const getAllObjectFields = (obj, prefix = '', depth = 0) => {
    if (depth > 2) return [];
    
    const fields = [];
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'id') continue;
      
      const fieldName = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && value.id !== undefined) {
        const nestedFields = getAllObjectFields(value, fieldName, depth + 1);
        fields.push(...nestedFields);
      } else if (!Array.isArray(value) && typeof value !== 'object') {
        fields.push({
          name: fieldName,
          label: getFieldVerboseName(fieldName),
          value: value
        });
      }
    }
    return fields;
  };
  
  const getRowDetails = (row) => {
    const details = [];
    
    for (const [key, value] of Object.entries(row)) {
      if (selectedFields.includes(key)) continue;
      
      if (value && typeof value === 'object' && value.id !== undefined) {
        const objFields = getAllObjectFields(value, key);
        details.push(...objFields);
      } else if (!Array.isArray(value) && typeof value !== 'object' && value !== null && value !== undefined && value !== '') {
        const fieldInfo = currentFields.find(f => f.name === key);
        details.push({
          name: key,
          label: fieldInfo?.verbose_name || key.replace(/_/g, ' '),
          value: value
        });
      }
    }
    
    return details;
  };
  
  const toggleRowExpand = (row, index) => {
    const rowKey = `${index}`;
    if (expandedRows.has(rowKey)) {
      expandedRows.delete(rowKey);
    } else {
      expandedRows.add(rowKey);
    }
    setExpandedRows(new Set(expandedRows));
  };
  
  const goToPage = (page) => {
    setCurrentPage(page);
    executeQuery(page);
  };
  
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Нет данных для отображения</p>
        <p className={styles.emptyHint}>Выберите поля и нажмите "Выполнить"</p>
      </div>
    );
  }
  
  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th className={styles.expandColumn}></th>
              {selectedFields.map((field, index) => (
                <th 
                  key={field} 
                  className={`${styles.tableHeader} ${dragOverColumn === index ? styles.dragOver : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, index, field)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  title="Перетащите для изменения порядка колонок"
                >
                  <div className={styles.columnHeader}>
                    <span className={styles.columnDragHandle}>⋮⋮</span>
                    <span>{getFieldVerboseName(field)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, rowIndex) => {
              const rowDetails = getRowDetails(row);
              const hasDetails = rowDetails.length > 0;
              const isExpanded = expandedRows.has(`${rowIndex}`);
              
              return (
                <React.Fragment key={rowIndex}>
                  <tr 
                    className={styles.tableRow}
                    onClick={() => hasDetails && toggleRowExpand(row, rowIndex)}
                    style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                  >
                    <td className={styles.expandCell}>
                      {hasDetails && (
                        <span className={styles.expandIcon}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </td>
                    {selectedFields.map(field => (
                      <td key={field} className={styles.tableCell}>
                        {formatValue(row[field], field)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && hasDetails && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={selectedFields.length + 1}>
                        <div className={styles.expandedContent}>
                          <h4>Детальная информация</h4>
                          <div className={styles.detailFields}>
                            {rowDetails.map((detail, idx) => (
                              <div key={idx} className={styles.detailField}>
                                <span className={styles.detailLabel}>{detail.label}:</span>
                                <span className={styles.detailValue}>{formatValue(detail.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {meta && meta.total_pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            ← Предыдущая
          </button>
          
          <div className={styles.paginationPages}>
            {currentPage > 3 && (
              <>
                <button onClick={() => goToPage(1)} className={styles.paginationPage}>1</button>
                <span className={styles.paginationDots}>...</span>
              </>
            )}
            
            {[...Array(Math.min(5, meta.total_pages))].map((_, i) => {
              let pageNum;
              if (meta.total_pages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= meta.total_pages - 2) {
                pageNum = meta.total_pages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              if (pageNum >= 1 && pageNum <= meta.total_pages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`${styles.paginationPage} ${currentPage === pageNum ? styles.activePage : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}
            
            {currentPage < meta.total_pages - 2 && (
              <>
                <span className={styles.paginationDots}>...</span>
                <button onClick={() => goToPage(meta.total_pages)} className={styles.paginationPage}>
                  {meta.total_pages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === meta.total_pages}
            className={styles.paginationButton}
          >
            Следующая →
          </button>
          
          <div className={styles.paginationInfo}>
            {((currentPage - 1) * pageSize + 1)} - {Math.min(currentPage * pageSize, totalCount)} из {totalCount}
          </div>
        </div>
      )}
    </>
  );
};

export default StatisticsTable;