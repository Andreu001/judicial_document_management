import React, { useState, useEffect, useCallback } from 'react';
import CriminalField from './CriminalField';
import styles from './CriminalDetail.module.css';


// =================== КРИМИНАЛЬНОЕ ДЕЛО (CriminalDetail) ===================
export const BasicInfoTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>1. Основные сведения</h3>
        <CriminalField
          label="№ дела"
          name="case_number"
          value={formData.case_number}
          isEditing={isEditing}
          onChange={onChange}
        />
        <CriminalField
          label="Дата поступления дела в суд"
          name="incoming_date"
          value={formData.incoming_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        <CriminalField
          label="Число лиц по делу"
          name="number_of_persons"
          value={formData.number_of_persons}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        <CriminalField
          label="Откуда поступило"
          name="incoming_from"
          value={formData.incoming_from}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>2. Порядок поступления дела</h3>
        <CriminalField
          label="Порядок поступления"
          name="case_order"
          value={formData.case_order}
          isEditing={isEditing}
          type="select"
          options={options.caseOrder || []}
          onChange={onChange}
        />
        <CriminalField
          label="Номер дела, из которого выделено"
          name="separated_case_number"
          value={formData.separated_case_number}
          isEditing={isEditing}
          onChange={onChange}
        />
        <CriminalField
            label="Дата выделения дела"
            type="date"
            name="separated_case_date"
            value={formData.separated_case_date}
            onChange={onDateChange}
        />
        <CriminalField
            label="Код суда при повторном поступлении"
            type="text"
            name="repeated_court_code"
            value={formData.repeated_court_code}
            onChange={onChange}
        />
        <CriminalField
            label="№ производства по первичной регистрации"
            type="text"
            name="repeated_primary_reg_number"
            value={formData.repeated_primary_reg_number || ''}
            onChange={onChange}
        />
        <CriminalField
            label="Повторное поступление дела"
            name="repeat_case"
            value={formData.repeat_case}
            onChange={onChange}
        />
        <CriminalField
            label="Дата повторного поступления"
            type="date"
            name="repeat_case_date"
            value={formData.repeat_case_date || ''}
            onChange={onDateChange}
        />
      </div>
    </div>
  </div>
  );

export const EvidenceTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Вещественные доказательства</h3>
        <CriminalField
          label="Наличие вещдоков"
          name="evidence_present"
          value={formData.evidence_present}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />
        <CriminalField
          label="Рег. номер вещдока"
          name="evidence_reg_number"
          value={formData.evidence_reg_number}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const CaseCategoryTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>3. Категория дела</h3>
        
        <CriminalField
          label="Категория дела"
          name="case_category"
          value={formData.case_category || ''}
          isEditing={isEditing}
          type="select"
          options={options.caseCategory}
          onChange={onChange}
        />

        <CriminalField
          label="ФИО судьи"
          name="judge_name"
          value={formData.judge_name || ''}
          isEditing={isEditing}
          onChange={onChange}
        />

        <CriminalField
          label="Код судьи"
          name="judge_code"
          value={formData.judge_code || ''}
          isEditing={isEditing}
          onChange={onChange}
        />

        <CriminalField
          label="Дата принятия дела судьей"
          name="judge_acceptance_date"
          value={formData.judge_acceptance_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>5. Решение судьи при назначении дела</h3>
        
        {/* Кнопка формирования постановления */}
        <div className={styles.rulingSection}>
          <button 
            className={styles.generateRulingButton}
          >
            Сформировать постановление о назначении дела
          </button>
        </div>

        <CriminalField
          label="Решение судьи"
          name="judge_decision"
          value={formData.judge_decision || ''}
          isEditing={isEditing}
          type="select"
          options={options.judgeDecision}
          onChange={onChange}
        />

        {/* Поле оснований предварительного слушания */}
          <CriminalField
            label="Основания проведения предварительного слушания"
            name="preliminary_hearing"
            value={formData.preliminary_hearing || ''}
            isEditing={isEditing}
            type="select"
            options={options.preliminaryHearingGrounds}
            onChange={onChange}
          />

        <CriminalField
          label="Дата предварительного слушания"
          name="case_transfer_date"
          value={formData.case_transfer_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />

        <CriminalField
          label="Куда направлено дело"
          name="case_transfer_destination"
          value={formData.case_transfer_destination || ''}
          isEditing={isEditing}
          onChange={onChange}
        />

        <CriminalField
          label="С использованием ВКС"
          name="vks_used"
          value={formData.vks_used}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />

        <CriminalField
          label="Дата направления дела"
          name="preliminary_hearing_date"
          value={formData.preliminary_hearing_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

export const HearingTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>6. Результат предварительного слушания</h3>
        
        <CriminalField
          label="Результат слушания"
          name="preliminary_hearing_result"
          value={formData.preliminary_hearing_result || ''}
          isEditing={isEditing}
          type="select"
          options={options.preliminaryHearingResult}
          onChange={onChange}
        />

        <CriminalField
          label="Дата первого заседания"
          name="first_hearing_date"
          value={formData.first_hearing_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>7. Соблюдение сроков</h3>
        
        <CriminalField
          label="Соблюдение сроков"
          name="hearing_compliance"
          value={formData.hearing_compliance || ''}
          isEditing={isEditing}
          type="select"
          options={options.hearingCompliance}
          onChange={onChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>8. Причины отложения дела</h3>
        
        <CriminalField
          label="Причина отложения"
          name="hearing_postponed_reason"
          value={formData.hearing_postponed_reason || ''}
          isEditing={isEditing}
          type="select"
          options={options.hearingPostponedReason}
          onChange={onChange}
        />

        <CriminalField
          label="Текст причины отложения"
          name="hearing_postponed_reason_text"
          value={formData.hearing_postponed_reason_text || ''}
          isEditing={isEditing}
          type="textarea"
          rows={2}
          onChange={onChange}
        />

        <CriminalField
          label="Дата приостановления производства"
          name="suspension_date"
          value={formData.suspension_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />

        <CriminalField
          label="Причина приостановления"
          name="suspension_reason"
          value={formData.suspension_reason || ''}
          isEditing={isEditing}
          type="select"
          options={options.suspensionReason}
          onChange={onChange}
        />

        <CriminalField
          label="Дата возобновления производства"
          name="resumption_date"
          value={formData.resumption_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

export const ResultTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>9. Результат рассмотрения дела</h3>
        
        <CriminalField
          label="Результат рассмотрения"
          name="case_result"
          value={formData.case_result || ''}
          isEditing={isEditing}
          type="select"
          options={options.caseResult}
          onChange={onChange}
        />

        <CriminalField
          label="Общая продолжительность (дни)"
          name="total_duration_days"
          value={formData.total_duration_days || ''}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />

        <CriminalField
          label="Категория длительности рассмотрения"
          name="case_duration_category"
          value={formData.case_duration_category || ''}
          isEditing={isEditing}
          type="select"
          options={options.caseDurationCategory}
          onChange={onChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>10. Состав суда</h3>
        
        <CriminalField
          label="Состав суда"
          name="composition_court"
          value={formData.composition_court || ''}
          isEditing={isEditing}
          type="select"
          options={options.compositionCourt}
          onChange={onChange}
        />

        <CriminalField
          label="Без участия подсудимого"
          name="absence_defendant"
          value={formData.absence_defendant}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />

        <CriminalField
          label="Закрытое заседание"
          name="closed_hearing"
          value={formData.closed_hearing}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />

        <CriminalField
          label="Использование ВКС"
          name="vks_technology"
          value={formData.vks_technology}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />

        <CriminalField
          label="Особый порядок при согласии обвиняемого"
          name="special_procedure_consent"
          value={formData.special_procedure_consent}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />

        <CriminalField
          label="Особый порядок при досудебном соглашении"
          name="special_procedure_agreement"
          value={formData.special_procedure_agreement}
          isEditing={isEditing}
          type="boolean"
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const AdditionalTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>11. Частные определения</h3>
        
        <CriminalField
          label="Количество частных определений"
          name="private_rulings_count"
          value={formData.private_rulings_count || ''}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />

        <CriminalField
          label="Дата вынесения частного определения"
          name="private_ruling_date"
          value={formData.private_ruling_date || ''}
          isEditing={isEditing}
          type="date"
          onChange={onDateChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>12. Дополнительные сведения</h3>
        
        <CriminalField
          label="Примечание"
          name="note"
          value={formData.note || ''}
          isEditing={isEditing}
          type="textarea"
          rows={3}
          onChange={onChange}
        />

        <div className={styles.field}>
          <label>Дата создания записи</label>
          <span>{(formData.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата последнего обновления</label>
          <span>{(formData.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);

export const DefendantsTab = ({ isEditing, defendants, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.defendantsSection}>
      <h3 className={styles.subsectionTitle}>Б. Стороны по делу</h3>
      
      {defendants.length > 0 ? (
        <div className={styles.defendantsGrid}>
          {defendants.map(defendant => (
            <div key={defendant.id} className={styles.defendantCard}>
              <h4>{defendant.full_name}</h4>
              <div className={styles.defendantInfo}>
                <CriminalField
                  label="Статус"
                  name={`defendant_${defendant.id}_status`}
                  value={defendant.side_case_name}
                  isEditing={isEditing}
                  showLabelInline={true}
                  onChange={(name, value) => onChange(name, value, defendant.id)}
                />
                
                <CriminalField
                  label="Дата рождения"
                  name={`defendant_${defendant.id}_birth_date`}
                  value={defendant.birth_date}
                  isEditing={isEditing}
                  type="date"
                  showLabelInline={true}
                  onChange={(name, value) => onDateChange(name, value, defendant.id)}
                />
                
                <CriminalField
                  label="ИНН"
                  name={`defendant_${defendant.id}_inn`}
                  value={defendant.inn}
                  isEditing={isEditing}
                  showLabelInline={true}
                  onChange={(name, value) => onChange(name, value, defendant.id)}
                />
                
                <CriminalField
                  label="Адрес"
                  name={`defendant_${defendant.id}_address`}
                  value={defendant.address}
                  isEditing={isEditing}
                  showLabelInline={true}
                  onChange={(name, value) => onChange(name, value, defendant.id)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noData}>Нет данных о сторонах по делу</p>
      )}
    </div>
  </div>
);

// =================== СУДЕБНОЕ РЕШЕНИЕ (CriminalDecisionDetail) ===================
export const AppealTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>13. Обжалование приговора</h3>
        <CriminalField
          label="Обжалование приговора"
          name="appeal_present"
          value={formData.appeal_present}
          isEditing={isEditing}
          type="select"
          options={options.appeal_present || []}
          onChange={onChange}
        />
        <CriminalField
          label="Дата поступления апелляции"
          name="appeal_date"
          value={formData.appeal_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        <CriminalField
          label="ФИО заявителя апелляции"
          name="appeal_applicant"
          value={formData.appeal_date}
          isEditing={isEditing}
          type="text"
          onDateChange={onDateChange}
        />
        <CriminalField
          label="Процессуальное положение заявителя"
          name="appeal_applicant_status"
          value={formData.appeal_date}
          isEditing={isEditing}
          type="text"
          onDateChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

export const CourtInstanceTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>14. Направление в суд II инстанции</h3>
        
        <CriminalField
          label="Суд II инстанции"
          name="court_instance"
          value={formData.court_instance}
          isEditing={isEditing}
          type="select"
          options={options.court_instance || []}
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата направления в суд II инстанции"
          name="court_sent_date"
          value={formData.court_sent_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Дата возвращения из суда II инстанции"
          name="court_return_date"
          value={formData.court_return_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Причина возвращения"
          name="court_return_reason"
          value={formData.court_return_reason}
          isEditing={isEditing}
          type="textarea"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата повторного направления"
          name="court_resend_date"
          value={formData.court_resend_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

export const ConsiderationTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>15. Рассмотрение во II инстанции</h3>
        
        <CriminalField
          label="Дата рассмотрения во II инстанции"
          name="court_consideration_date"
          value={formData.court_consideration_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Результат рассмотрения во II инстанции"
          name="appeal_consideration_result"
          value={formData.appeal_consideration_result}
          isEditing={isEditing}
          type="select"
          options={options.appeal_consideration_result || []}
          onChange={onChange}
        />
        
        <CriminalField
          label="Сущность изменений"
          name="consideration_changes"
          value={formData.consideration_changes}
          isEditing={isEditing}
          type="textarea"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата поступления из вышестоящего суда"
          name="higher_court_receipt_date"
          value={formData.higher_court_receipt_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

export const ExecutionTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>16-17. Вступление в силу и исполнение</h3>
        
        <CriminalField
          label="Дата вступления в силу"
          name="sentence_effective_date"
          value={formData.sentence_effective_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Дата обращения к исполнению"
          name="sentence_execution_date"
          value={formData.sentence_execution_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>15.1. Результаты гражданского иска</h3>
        
        <CriminalField
          label="Результат гражданского иска"
          name="civil_claim_result"
          value={formData.civil_claim_result}
          isEditing={isEditing}
          type="select"
          options={options.civil_claim_result || []}
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма иска"
          name="civil_claim_amount"
          value={formData.civil_claim_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма госпошлины"
          name="state_duty_amount"
          value={formData.state_duty_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма ущерба от хищения"
          name="theft_damage_amount"
          value={formData.theft_damage_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма ущерба от др. преступлений"
          name="other_damage_amount"
          value={formData.other_damage_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма морального вреда"
          name="moral_damage_amount"
          value={formData.moral_damage_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Статья УК РФ по моральному вреду"
          name="moral_damage_article"
          value={formData.moral_damage_article}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const SpecialMarksTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>18-20. Особые отметки</h3>
        
        <CriminalField
          label="Копия направлена"
          name="copy_sent_to_1"
          value={formData.copy_sent_to_1}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата направления 1"
          name="copy_sent_date_1"
          value={formData.copy_sent_date_1}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Соединено с делом №"
          name="joined_with_case"
          value={formData.joined_with_case}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Выделено в дело №"
          name="separated_to_case"
          value={formData.separated_to_case}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Вид экспертизы"
          name="expertise_type"
          value={formData.expertise_type}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата направления экспертизы"
          name="expertise_sent_date"
          value={formData.expertise_sent_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Дата поступления экспертизы"
          name="expertise_received_date"
          value={formData.expertise_received_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Статья УК РФ о конфискации"
          name="confiscation_article"
          value={formData.confiscation_article}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма судебного штрафа"
          name="court_fine_amount"
          value={formData.court_fine_amount}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Статья УК РФ о штрафе"
          name="court_fine_article"
          value={formData.court_fine_article}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Меры процессуального принуждения"
          name="procedural_coercion"
          value={formData.procedural_coercion}
          isEditing={isEditing}
          type="textarea"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата применения мер"
          name="procedural_coercion_date"
          value={formData.procedural_coercion_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Процессуальные издержки"
          name="procedural_costs"
          value={formData.procedural_costs}
          isEditing={isEditing}
          type="number"
          onChange={onChange}
        />
        
        <CriminalField
          label="Информация о ходатайствах"
          name="petitions_info"
          value={formData.petitions_info}
          isEditing={isEditing}
          type="textarea"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата отзыва ходатайства"
          name="petitions_withdrawal_date"
          value={formData.petitions_withdrawal_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Другие отметки"
          name="other_notes"
          value={formData.other_notes}
          isEditing={isEditing}
          type="textarea"
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата сдачи в архив"
          name="archive_date"
          value={formData.archive_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <CriminalField
          label="Дата создания записи"
          name="created_at"
          value={formData.created_at}
          isEditing={false}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Дата последнего обновления"
          name="updated_at"
          value={formData.updated_at}
          isEditing={false}
          type="date"
          onDateChange={onDateChange}
        />
      </div>
    </div>
  </div>
);

// =================== ПОДСУДИМЫЙ (DefendantDetail) ===================
export const DefendantBasicInfoTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>1. Основные сведения</h3>
        <CriminalField
          label="Статья"
          name="article"
          value={formData.article}
          isEditing={isEditing}
          onChange={onChange}
        />
        <CriminalField
          label="ФИО подсудимого"
          name="full_name"
          value={formData.full_name}
          isEditing={isEditing}
          onChange={onChange}
        />
        <CriminalField
          label="Дата рождения"
          name="birth_date"
          value={formData.birth_date}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        <CriminalField
            label="Пол"
            name="sex"
            value={formData.sex}
            onChange={onChange}
        />
        <CriminalField
            label="Гражданство"
            type="text"
            name="citizenship"
            value={formData.citizenship}
            onChange={onChange}
        />
        <CriminalField
            label="Гражданство"
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            />
      </div>
    </div>
  </div>
);

export const DefendantRestraintTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>2. Меры пресечения</h3>
        
        <CriminalField
          label="Мера пресечения"
          name="restraint_measure"
          value={formData.restraint_measure || ''}
          isEditing={isEditing}
          type="select"
          options={options.restraintMeasure}
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата избрания меры пресечения"
          name="restraint_date"
          value={formData.restraint_date || ''}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Мера пресечения применена"
          name="restraint_application"
          value={formData.restraint_application || ''}
          isEditing={isEditing}
          type="select"
          options={options.restraintApplication}
          onChange={onChange}
        />
        
        <CriminalField
          label="Изменение меры пресечения"
          name="restraint_change"
          value={formData.restraint_change || ''}
          isEditing={isEditing}
          type="select"
          options={options.restraintChange}
          onChange={onChange}
        />
        
        <CriminalField
          label="Дата изменения меры пресечения"
          name="restraint_change_date"
          value={formData.restraint_change_date || ''}
          isEditing={isEditing}
          type="date"
          onDateChange={onDateChange}
        />
        
        <CriminalField
          label="Изменена на меру"
          name="restraint_change_to"
          value={formData.restraint_change_to || ''}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const DefendantDamageTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>4. Ущерб и взыскания</h3>
        
        <CriminalField
          label="Сумма ущерба"
          name="property_damage"
          value={formData.property_damage || ''}
          isEditing={isEditing}
          type="number"
          step="0.01"
          onChange={onChange}
        />
        
        <CriminalField
          label="Сумма морального вреда"
          name="moral_damage"
          value={formData.moral_damage || ''}
          isEditing={isEditing}
          type="number"
          step="0.01"
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const DefendantDetentionTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>5. Место содержания</h3>
        
        <CriminalField
          label="Содержится в учреждении"
          name="detention_institution"
          value={formData.detention_institution || ''}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Адрес учреждения"
          name="detention_address"
          value={formData.detention_address || ''}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
      </div>
    </div>
  </div>
);

export const DefendantAdditionalTab = ({ isEditing, formData, options, onChange, onDateChange }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>6. Дополнительные сведения</h3>
        
        <CriminalField
          label="Результат рассмотрения по данному лицу"
          name="trial_result"
          value={formData.trial_result || ''}
          isEditing={isEditing}
          type="text"
          onChange={onChange}
        />
        
        <CriminalField
          label="Особые отметки по лицу"
          name="special_notes"
          value={formData.special_notes || ''}
          isEditing={isEditing}
          type="textarea"
          rows={3}
          onChange={onChange}
        />
        
        <div className={styles.field}>
          <label>Дата создания записи</label>
          <span>{(formData.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата последнего обновления</label>
          <span>{(formData.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);
