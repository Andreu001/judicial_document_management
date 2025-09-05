import React, { useState, useEffect } from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './CriminalDecisionForm.module.css';

const CriminalDecisionForm = ({ decisionData, onDecisionDataChange, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    sentence_appealed: decisionData.sentence_appealed || '',
    appeal_date: decisionData.appeal_date || '',
    appeal_applicant: decisionData.appeal_applicant || '',
    appeal_applicant_status: decisionData.appeal_applicant_status || '',
    court_instance: decisionData.court_instance || '',
    court_sent_date: decisionData.court_sent_date || '',
    court_return_date: decisionData.court_return_date || '',
    court_return_reason: decisionData.court_return_reason || '',
    court_resend_date: decisionData.court_resend_date || '',
    court_consideration_date: decisionData.court_consideration_date || '',
    consideration_result: decisionData.consideration_result || '',
    consideration_changes: decisionData.consideration_changes || '',
    higher_court_receipt_date: decisionData.higher_court_receipt_date || '',
    sentence_effective_date: decisionData.sentence_effective_date || '',
    sentence_execution_date: decisionData.sentence_execution_date || '',
    civil_claim_result: decisionData.civil_claim_result || '',
    civil_claim_amount: decisionData.civil_claim_amount || '',
    state_duty_amount: decisionData.state_duty_amount || '',
    theft_damage_amount: decisionData.theft_damage_amount || '',
    other_damage_amount: decisionData.other_damage_amount || '',
    moral_damage_amount: decisionData.moral_damage_amount || '',
    moral_damage_article: decisionData.moral_damage_article || '',
    copy_sent_to_1: decisionData.copy_sent_to_1 || '',
    copy_sent_date_1: decisionData.copy_sent_date_1 || '',
    copy_sent_to_2: decisionData.copy_sent_to_2 || '',
    copy_sent_date_2: decisionData.copy_sent_date_2 || '',
    copy_sent_to_3: decisionData.copy_sent_to_3 || '',
    copy_sent_date_3: decisionData.copy_sent_date_3 || '',
    joined_with_case: decisionData.joined_with_case || '',
    separated_to_case: decisionData.separated_to_case || '',
    expertise_type: decisionData.expertise_type || '',
    expertise_sent_date: decisionData.expertise_sent_date || '',
    expertise_received_date: decisionData.expertise_received_date || '',
    confiscation_article: decisionData.confiscation_article || '',
    court_fine_amount: decisionData.court_fine_amount || '',
    court_fine_article: decisionData.court_fine_article || '',
    procedural_coercion: decisionData.procedural_coercion || '',
    procedural_coercion_date: decisionData.procedural_coercion_date || '',
    procedural_costs: decisionData.procedural_costs || '',
    petitions_info: decisionData.petitions_info || '',
    petitions_withdrawal_date: decisionData.petitions_withdrawal_date || '',
    other_notes: decisionData.other_notes || '',
    archive_date: decisionData.archive_date || ''
  });

  useEffect(() => {
    onDecisionDataChange(formData);
  }, [formData, onDecisionDataChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.decisionForm}>
      <h4>Решение по уголовному делу</h4>
      
      <form onSubmit={handleSubmit}>
        {/* Раздел 13. Приговор */}
        <div className={styles.section}>
          <h5>13. Приговор (постановление)</h5>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Обжалование приговора</label>
              <select name="sentence_appealed" value={formData.sentence_appealed} onChange={handleChange}>
                <option value="">Выберите вариант</option>
                <option value="1">не обжалован</option>
                <option value="2">обжалован осужденным</option>
                <option value="3">обжалован прокурором</option>
                <option value="4">обжалован др. участниками процесса</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Дата поступления апелляции</label>
              <MyInput
                type="date"
                name="appeal_date"
                value={formData.appeal_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>ФИО заявителя апелляции</label>
              <MyInput
                type="text"
                name="appeal_applicant"
                value={formData.appeal_applicant}
                onChange={handleChange}
                placeholder="ФИО заявителя"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Процессуальное положение</label>
              <MyInput
                type="text"
                name="appeal_applicant_status"
                value={formData.appeal_applicant_status}
                onChange={handleChange}
                placeholder="Процессуальное положение"
              />
            </div>
          </div>
        </div>

        {/* Раздел 14. Дело направлено в суд II инстанции */}
        <div className={styles.section}>
          <h5>14. Дело направлено в суд II инстанции</h5>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Суд II инстанции</label>
              <select name="court_instance" value={formData.court_instance} onChange={handleChange}>
                <option value="">Выберите суд</option>
                <option value="1">апелляционной</option>
                <option value="2">кассационной</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Дата направления</label>
              <MyInput
                type="date"
                name="court_sent_date"
                value={formData.court_sent_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Остальные поля раздела 14 и других разделов */}
          {/* ... аналогичная реализация для остальных полей ... */}
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