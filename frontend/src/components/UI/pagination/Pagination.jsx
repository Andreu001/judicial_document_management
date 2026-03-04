import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ totalPages, page, changePage }) => {
  const getVisiblePages = () => {
    const delta = 2; // Количество страниц слева и справа от текущей
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

  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationButton}
        onClick={() => changePage(page - 1)}
        disabled={page === 1}
      >
        <span className={styles.paginationArrow}>←</span>
      </button>
      
      {pages.map((p, index) => (
        p === '...' ? (
          <span key={`dots-${index}`} className={styles.paginationEllipsis}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => changePage(p)}
            className={`${styles.paginationButton} ${page === p ? styles.active : ''}`}
          >
            {p}
          </button>
        )
      ))}
      
      <button
        className={styles.paginationButton}
        onClick={() => changePage(page + 1)}
        disabled={page === totalPages}
      >
        <span className={styles.paginationArrow}>→</span>
      </button>
    </div>
  );
};

export default Pagination;