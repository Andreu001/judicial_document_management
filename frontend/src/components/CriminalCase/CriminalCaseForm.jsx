// components/CriminalCase/CriminalCaseForm.jsx
import React from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './CriminalCaseForm.module.css';

const CriminalCaseForm = ({ criminalData, onCriminalDataChange }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onCriminalDataChange({
      ...criminalData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className={styles.criminalForm}>
      <h3>Данные уголовного производства</h3>
      
      <div className={styles.section}>
        <h4>Раздел А. Сведения по делу</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Число лиц по делу</label>
            <MyInput
              type="number"
              name="number_of_persons"
              value={criminalData.number_of_persons || ''}
              onChange={handleChange}
              placeholder="Количество лиц"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="evidence_present"
                checked={criminalData.evidence_present || false}
                onChange={handleChange}
              />
              Наличие вещдоков
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Рег. номер вещдока</label>
            <MyInput
              type="text"
              name="evidence_reg_number"
              value={criminalData.evidence_reg_number || ''}
              onChange={handleChange}
              placeholder="Номер вещественного доказательства"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата поступления дела в суд</label>
            <MyInput
              type="date"
              name="incoming_date"
              value={criminalData.incoming_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Откуда поступило</label>
            <MyInput
              type="text"
              name="incoming_from"
              value={criminalData.incoming_from || ''}
              onChange={handleChange}
              placeholder="Источник поступления дела"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Порядок поступления дела</label>
            <MyInput
              type="text"
              name="case_order"
              value={criminalData.case_order || ''}
              onChange={handleChange}
              placeholder="Порядок поступления"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>ФИО судьи</label>
            <MyInput
              type="text"
              name="judge_name"
              value={criminalData.judge_name || ''}
              onChange={handleChange}
              placeholder="ФИО судьи"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Код судьи</label>
            <MyInput
              type="text"
              name="judge_code"
              value={criminalData.judge_code || ''}
              onChange={handleChange}
              placeholder="Код судьи"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата предварительного слушания</label>
            <MyInput
              type="date"
              name="preliminary_hearing_date"
              value={criminalData.preliminary_hearing_date || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Результат слушания</label>
            <MyInput
              type="text"
              name="preliminary_hearing_result"
              value={criminalData.preliminary_hearing_result || ''}
              onChange={handleChange}
              placeholder="Результат предварительного слушания"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Раздел C. Приговор и исполнение</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата вынесения приговора</label>
            <MyInput
              type="date"
              name="sentence_date"
              value={criminalData.sentence_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Результат рассмотрения</label>
            <MyInput
              type="text"
              name="sentence_result"
              value={criminalData.sentence_result || ''}
              onChange={handleChange}
              placeholder="Результат рассмотрения дела"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата обжалования</label>
            <MyInput
              type="date"
              name="appeal_date"
              value={criminalData.appeal_date || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Результат обжалования</label>
            <MyInput
              type="text"
              name="appeal_result"
              value={criminalData.appeal_result || ''}
              onChange={handleChange}
              placeholder="Результат обжалования"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Особые отметки</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Особые отметки</label>
            <textarea
              name="special_notes"
              value={criminalData.special_notes || ''}
              onChange={handleChange}
              placeholder="Дополнительная информация"
              rows={4}
              className={styles.textarea}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalCaseForm;