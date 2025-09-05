import React from 'react';
import styles from './CriminalCaseTab.module.css';

const CriminalCaseTab = ({ criminalCase, defendants }) => {
  if (!criminalCase) {
    return <div>Уголовное производство не создано</div>;
  }

  return (
    <div className={styles.criminalCase}>
      <h3>Уголовное производство</h3>
      
      <div className={styles.section}>
        <h4>Раздел А. Сведения по делу</h4>
        <p>Число лиц: {criminalCase.number_of_persons || 'Не указано'}</p>
        <p>Дата поступления: {criminalCase.incoming_date || 'Не указана'}</p>
        <p>Судья: {criminalCase.judge_name || 'Не указан'}</p>
      </div>

      <div className={styles.section}>
        <h4>Раздел Б. Обвиняемые</h4>
        {defendants.map(defendant => (
          <div key={defendant.id} className={styles.defendant}>
            <p><strong>ФИО:</strong> {defendant.full_name}</p>
            <p><strong>Мера пресечения:</strong> {defendant.restraint_measure || 'Не указана'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriminalCaseTab;