// components/CivilCase/CivilCaseForm.jsx
import React from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './CivilCaseForm.module.css';

const CivilCaseForm = ({ civilData, onCivilDataChange }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onCivilDataChange({
      ...civilData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className={styles.civilForm}>
      <h3>Данные гражданского судопроизводства</h3>
      
      <div className={styles.section}>
        <h4>Раздел I. Досудебная подготовка</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата поступления заявления</label>
            <MyInput
              type="date"
              name="application_date"
              value={civilData.application_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Количество истцов</label>
            <MyInput
              type="number"
              name="applicants_count"
              value={civilData.applicants_count || ''}
              onChange={handleChange}
              placeholder="Количество"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Порядок поступления (код)</label>
            <MyInput
              type="text"
              name="admission_order"
              value={civilData.admission_order || ''}
              onChange={handleChange}
              placeholder="Код порядка"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Номер уголовного дела</label>
            <MyInput
              type="text"
              name="criminal_case_number"
              value={civilData.criminal_case_number || ''}
              onChange={handleChange}
              placeholder="Номер уголовного дела"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Выделено из дела №</label>
            <MyInput
              type="text"
              name="separated_from_case"
              value={civilData.separated_from_case || ''}
              onChange={handleChange}
              placeholder="Номер дела"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Код суда при повторном поступлении</label>
            <MyInput
              type="text"
              name="previous_court_code"
              value={civilData.previous_court_code || ''}
              onChange={handleChange}
              placeholder="Код суда"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата первичного поступления</label>
            <MyInput
              type="date"
              name="previous_application_date"
              value={civilData.previous_application_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>№ производства по первичной регистрации</label>
            <MyInput
              type="text"
              name="previous_registration_number"
              value={civilData.previous_registration_number || ''}
              onChange={handleChange}
              placeholder="Номер регистрации"
            />
          </div>

          <div className={styles.formGroup}>
            <label>ФИО, код судьи</label>
            <MyInput
              type="text"
              name="judge_name"
              value={civilData.judge_name || ''}
              onChange={handleChange}
              placeholder="ФИО и код судьи"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дело принято к производству</label>
            <MyInput
              type="date"
              name="accepted_for_production"
              value={civilData.accepted_for_production || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Сумма госпошлины (осн. треб.)</label>
            <MyInput
              type="number"
              step="0.01"
              name="duty_amount_main"
              value={civilData.duty_amount_main || ''}
              onChange={handleChange}
              placeholder="Сумма"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата уплаты госпошлины (осн.)</label>
            <MyInput
              type="date"
              name="duty_date_main"
              value={civilData.duty_date_main || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Кем уплачена госпошлина (осн.)</label>
            <MyInput
              type="text"
              name="duty_payer_main"
              value={civilData.duty_payer_main || ''}
              onChange={handleChange}
              placeholder="Плательщик"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Сумма госпошлины (доп. треб.)</label>
            <MyInput
              type="number"
              step="0.01"
              name="duty_amount_additional"
              value={civilData.duty_amount_additional || ''}
              onChange={handleChange}
              placeholder="Сумма"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата уплаты госпошлины (доп.)</label>
            <MyInput
              type="date"
              name="duty_date_additional"
              value={civilData.duty_date_additional || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Раздел II. Движение гражданского дела</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дело назначено к рассмотрению на</label>
            <MyInput
              type="date"
              name="scheduled_date"
              value={civilData.scheduled_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Время рассмотрения</label>
            <MyInput
              type="time"
              name="scheduled_time"
              value={civilData.scheduled_time || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="vks_used"
                checked={civilData.vks_used || false}
                onChange={handleChange}
              />
              Использование ВКС
            </label>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дело отложено на</label>
            <MyInput
              type="date"
              name="postponed_date"
              value={civilData.postponed_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Причина отложения (код)</label>
            <MyInput
              type="text"
              name="postponed_reason"
              value={civilData.postponed_reason || ''}
              onChange={handleChange}
              placeholder="Код причины"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дата приостановления</label>
            <MyInput
              type="date"
              name="suspension_date"
              value={civilData.suspension_date || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Основание приостановления</label>
            <MyInput
              type="text"
              name="suspension_basis_code"
              value={civilData.suspension_basis_code || ''}
              onChange={handleChange}
              placeholder="Статья"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дело возобновлено производством</label>
            <MyInput
              type="date"
              name="resumed_date"
              value={civilData.resumed_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дело соединено с делом №</label>
            <MyInput
              type="text"
              name="combined_with_case"
              value={civilData.combined_with_case || ''}
              onChange={handleChange}
              placeholder="Номер дела"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дело сдано в отдел делопроизводства</label>
            <MyInput
              type="date"
              name="handed_to_office_date"
              value={civilData.handed_to_office_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Копии судебных постановлений направлены</label>
            <MyInput
              type="date"
              name="copies_sent_date"
              value={civilData.copies_sent_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="complex_case"
                checked={civilData.complex_case || false}
                onChange={handleChange}
              />
              Дело сложное
            </label>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Раздел VII. Особые отметки</h4>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Продолжительность рассмотрения дела (мес.)</label>
            <MyInput
              type="number"
              name="consideration_duration_months"
              value={civilData.consideration_duration_months || ''}
              onChange={handleChange}
              placeholder="Количество месяцев"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Продолжительность рассмотрения дела (дн.)</label>
            <MyInput
              type="number"
              name="consideration_duration_days"
              value={civilData.consideration_duration_days || ''}
              onChange={handleChange}
              placeholder="Количество дней"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Дело рассмотрено в сроки</label>
            <MyInput
              type="text"
              name="compliance_with_deadlines"
              value={civilData.compliance_with_deadlines || ''}
              onChange={handleChange}
              placeholder="Статус соблюдения сроков"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Особые отметки</label>
            <textarea
              name="special_notes"
              value={civilData.special_notes || ''}
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

export default CivilCaseForm;