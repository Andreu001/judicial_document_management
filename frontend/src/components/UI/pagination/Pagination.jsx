// Pagination.jsx (полностью обновленная версия)
import React, { useState } from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ totalPages, page, changePage, compact = false }) => {
  const [jumpPage, setJumpPage] = useState('');

  const getVisiblePages = () => {
    const delta = compact ? 1 : 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const pages = getVisiblePages();

  const goToFirst = () => changePage(1);
  const goToLast = () => changePage(totalPages);

  const handleJumpPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      changePage(pageNum);
      setJumpPage('');
    }
  };

  // Если всего страниц 1, не показываем пагинацию
  if (totalPages <= 1) return null;

  return (
    <div className={`${styles.pagination} ${compact ? styles.compact : ''}`}>
      {/* Кнопка "В начало" */}
      <button
        className={styles.paginationButton}
        onClick={goToFirst}
        disabled={page === 1}
        title="Первая страница"
      >
        <span className={styles.paginationArrow}>«</span>
      </button>
      
      {/* Кнопка "Назад" */}
      <button
        className={styles.paginationButton}
        onClick={() => changePage(page - 1)}
        disabled={page === 1}
        title="Предыдущая страница"
      >
        <span className={styles.paginationArrow}>←</span>
      </button>
      
      {/* Номера страниц */}
      <div className={styles.paginationNumbers}>
        {pages.map((p, index) => (
          p === '...' ? (
            <span key={`dots-${index}`} className={styles.paginationEllipsis}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => changePage(p)}
              className={`${styles.paginationButton} ${page === p ? styles.active : ''}`}
              title={`Страница ${p}`}
            >
              {p}
            </button>
          )
        ))}
      </div>
      
      {/* Кнопка "Вперед" */}
      <button
        className={styles.paginationButton}
        onClick={() => changePage(page + 1)}
        disabled={page === totalPages}
        title="Следующая страница"
      >
        <span className={styles.paginationArrow}>→</span>
      </button>
      
      {/* Кнопка "В конец" */}
      <button
        className={styles.paginationButton}
        onClick={goToLast}
        disabled={page === totalPages}
        title="Последняя страница"
      >
        <span className={styles.paginationArrow}>»</span>
      </button>

      {/* Быстрый переход на страницу (только для десктопа) */}
      {!compact && totalPages > 10 && (
        <form onSubmit={handleJumpPage} className={styles.paginationJump}>
          <span className={styles.paginationSeparator}>|</span>
          <input
            type="number"
            className={styles.paginationJumpInput}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            placeholder={`1-${totalPages}`}
            min="1"
            max={totalPages}
          />
          <button type="submit" className={styles.paginationJumpButton}>
            Перейти
          </button>
        </form>
      )}
    </div>
  );
};

export default Pagination;