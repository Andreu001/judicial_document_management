import React, { useState, useEffect } from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './CriminalDecisionForm.module.css';
import baseService from '../../API/baseService';

const CriminalDecisionForm = ({ decisionData, onDecisionDataChange, onCancel, onSubmit }) => {
  const [decisionsList, setDecisionsList] = useState([]);
  const [appealsList, setAppealsList] = useState([]);

  useEffect(() => {
    // Загружаем список решений
    baseService
      .get('http://localhost:8000/business_card/decisions/')
      .then((response) => {
        setDecisionsList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching decisions list:', error);
      });

    // Загружаем список апелляций
    baseService
      .get('http://localhost:8000/business_card/appeal/')
      .then((response) => {
        setAppealsList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching appeals list:', error);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const fieldValue = type === 'checkbox' ? checked : value;
    
    onDecisionDataChange({
      ...decisionData,
      [name]: fieldValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(decisionData);
  };

  return (
    <div className={styles.decisionForm}>
      <h4>Данные по решению</h4>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Решение по поступившему делу *</label>
            <select 
              name="name_case" 
              value={decisionData.name_case || ''} 
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Выберите решение</option>
              {decisionsList.map((decision, index) => (
                <option key={index} value={decision.id}>
                  {decision.name_case}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Дата поступления апелляции</label>
            <MyInput
              type="date"
              name="appeal_date"
              value={decisionData.appeal_date || ''}
              onChange={handleChange}
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>ФИО заявителя апелляции</label>
            <MyInput
              type="text"
              name="appeal_applicant"
              value={decisionData.appeal_applicant || ''}
              onChange={handleChange}
              placeholder="ФИО заявителя"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Процессуальное положение заявителя</label>
            <MyInput
              type="text"
              name="appeal_applicant_status"
              value={decisionData.appeal_applicant_status || ''}
              onChange={handleChange}
              placeholder="Процессуальное положение"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Суд II инстанции</label>
            <select 
              name="court_instance" 
              value={decisionData.court_instance || ''} 
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Выберите суд</option>
              <option value="1">Апелляционной</option>
              <option value="2">Кассационной</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Дата направления в суд II инстанции</label>
            <MyInput
              type="date"
              name="court_sent_date"
              value={decisionData.court_sent_date || ''}
              onChange={handleChange}
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата возвращения из суда II инстанции</label>
            <MyInput
              type="date"
              name="court_return_date"
              value={decisionData.court_return_date || ''}
              onChange={handleChange}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Причина возвращения</label>
            <MyInput
              type="text"
              name="court_return_reason"
              value={decisionData.court_return_reason || ''}
              onChange={handleChange}
              placeholder="Причина возвращения"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата повторного направления</label>
            <MyInput
              type="date"
              name="court_resend_date"
              value={decisionData.court_resend_date || ''}
              onChange={handleChange}
              className={styles.dateInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата рассмотрения во II инстанции</label>
            <MyInput
              type="date"
              name="court_consideration_date"
              value={decisionData.court_consideration_date || ''}
              onChange={handleChange}
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Результат рассмотрения во II инстанции</label>
            <select 
              name="decision_appeal" 
              value={decisionData.decision_appeal || ''} 
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {appealsList.map((appeal, index) => (
                <option key={index} value={appeal.id}>
                  {appeal.decision_appeal}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Сущность изменений</label>
            <textarea
              name="consideration_changes"
              value={decisionData.consideration_changes || ''}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Сущность изменений"
              rows={3}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            Сохранить
          </button>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Отменить
          </button>
        </div>
      </form>
    </div>
  );
};

export default CriminalDecisionForm;