import React from 'react';
import styles from './CivilDetail.module.css';

export const PreTrialTab = ({
  isEditing,
  formData,
  options,
  civilData,
  handleDateChange,
  formatDate,
  card,
  handleInputChange,
  handleFieldChange,
  getOptionLabel,
  formatBoolean,
  judges
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* I. ДОСУДЕБНАЯ ПОДГОТОВКА */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>I. Досудебная подготовка</h3>
        
        <div className={styles.field}>
          <label>Номер дела (из карточки):</label>
          {isEditing ? (
            <input
              type="text"
              name="case_number"
              value={formData.case_number || card?.original_name || ''}
              onChange={handleInputChange}
              className={styles.input}
              disabled
            />
          ) : (
            <span>{civilData.case_number || card?.original_name || 'Не указан'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Заявление поступило в суд:</label>
          {isEditing ? (
            <input
              type="date"
              name="application_date"
              value={formData.application_date || ''}
              onChange={(e) => handleDateChange('application_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.application_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Количество истцов:</label>
          {isEditing ? (
            <input
              type="number"
              name="applicants_count"
              value={formData.applicants_count || 1}
              onChange={handleInputChange}
              className={styles.input}
              min="1"
            />
          ) : (
            <span>{civilData.applicants_count || 1}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Порядок поступления (код):</label>
          {isEditing ? (
            <select
              name="admission_order"
              value={formData.admission_order || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите порядок</option>
              {options.admission_order?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.admission_order, civilData.admission_order)}</span>
          )}
        </div>
        
        {/* Дополнительные поля в зависимости от порядка поступления */}
        {(formData.admission_order === '02' || civilData.admission_order === '02') && (
          <div className={styles.field}>
            <label>Номер уголовного дела:</label>
            {isEditing ? (
              <input
                type="text"
                name="criminal_case_number"
                value={formData.criminal_case_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{civilData.criminal_case_number || 'Не указан'}</span>
            )}
          </div>
        )}
        
        {(formData.admission_order === '03' || civilData.admission_order === '03') && (
          <div className={styles.field}>
            <label>Выделено из дела №:</label>
            {isEditing ? (
              <input
                type="text"
                name="separated_from_case"
                value={formData.separated_from_case || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{civilData.separated_from_case || 'Не указано'}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Государственная пошлина */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Государственная пошлина</h3>
        
        <div className={styles.field}>
          <label>Сумма госпошлины (осн. треб.):</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="duty_amount_main"
              value={formData.duty_amount_main || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.duty_amount_main ? `${civilData.duty_amount_main} руб.` : 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Кем уплачена госпошлина (осн.):</label>
          {isEditing ? (
            <input
              type="text"
              name="duty_payer_main"
              value={formData.duty_payer_main || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.duty_payer_main || 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дата уплаты (осн.):</label>
          {isEditing ? (
            <input
              type="date"
              name="duty_date_main"
              value={formData.duty_date_main || ''}
              onChange={(e) => handleDateChange('duty_date_main', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.duty_date_main)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Сумма госпошлины (доп. треб.):</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="duty_amount_additional"
              value={formData.duty_amount_additional || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.duty_amount_additional ? `${civilData.duty_amount_additional} руб.` : 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дата уплаты (доп.):</label>
          {isEditing ? (
            <input
              type="date"
              name="duty_date_additional"
              value={formData.duty_date_additional || ''}
              onChange={(e) => handleDateChange('duty_date_additional', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.duty_date_additional)}</span>
          )}
        </div>
      </div>
      
      {/* Судья */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судья</h3>
        
        <div className={styles.field}>
          <label>Ф.И.О., код судьи:</label>
          {isEditing ? (
            <select
              name="judge_name"
              value={formData.judge_name || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите судью</option>
              {judges.map(judge => (
                <option key={judge.id} value={`${judge.name} (${judge.judge_code})`}>
                  {judge.name} ({judge.judge_code})
                </option>
              ))}
            </select>
          ) : (
            <span>{civilData.judge_name || 'Не назначен'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дело принято к производству:</label>
          {isEditing ? (
            <input
              type="date"
              name="accepted_for_production"
              value={formData.accepted_for_production || ''}
              onChange={(e) => handleDateChange('accepted_for_production', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.accepted_for_production)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дело передано:</label>
          {isEditing ? (
            <input
              type="date"
              name="transferred_date"
              value={formData.transferred_date || ''}
              onChange={(e) => handleDateChange('transferred_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.transferred_date)}</span>
          )}
        </div>
        
        {civilData.transferred_date && (
          <div className={styles.field}>
            <label>Ф.И.О., код судьи (при передаче):</label>
            {isEditing ? (
              <input
                type="text"
                name="transferred_to_judge"
                value={formData.transferred_to_judge || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{civilData.transferred_to_judge || 'Не указано'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const CaseMovementTab = ({
  isEditing,
  formData,
  options,
  civilData,
  handleDateChange,
  formatDate,
  handleInputChange,
  getOptionLabel,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* II. ДВИЖЕНИЕ ГРАЖДАНСКОГО ДЕЛА */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>II. Движение гражданского дела</h3>
        
        <div className={styles.field}>
          <label>Дело назначено к рассмотрению на:</label>
          {isEditing ? (
            <input
              type="date"
              name="scheduled_date"
              value={formData.scheduled_date || ''}
              onChange={(e) => handleDateChange('scheduled_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.scheduled_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Время рассмотрения:</label>
          {isEditing ? (
            <input
              type="time"
              name="scheduled_time"
              value={formData.scheduled_time || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.scheduled_time || 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Использование ВКС:</label>
          {isEditing ? (
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                name="vks_used"
                checked={formData.vks_used || false}
                onChange={handleInputChange}
              />
              Использована видеоконференцсвязь
            </label>
          ) : (
            <span>{formatBoolean(civilData.vks_used)}</span>
          )}
        </div>
      </div>
      
      {/* Отложение дела */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Отложение дела</h3>
        
        <div className={styles.field}>
          <label>Дело отложено на:</label>
          {isEditing ? (
            <input
              type="date"
              name="postponed_date"
              value={formData.postponed_date || ''}
              onChange={(e) => handleDateChange('postponed_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.postponed_date)}</span>
          )}
        </div>
        
        {civilData.postponed_date && (
          <div className={styles.field}>
            <label>Причина отложения (код):</label>
            {isEditing ? (
              <select
                name="postponed_reason"
                value={formData.postponed_reason || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите причину</option>
                {options.postponed_reason?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.postponed_reason, civilData.postponed_reason)}</span>
            )}
          </div>
        )}
        
        <div className={styles.field}>
          <label>Дата повторного отложения:</label>
          {isEditing ? (
            <input
              type="date"
              name="postponed_date_2"
              value={formData.postponed_date_2 || ''}
              onChange={(e) => handleDateChange('postponed_date_2', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.postponed_date_2)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дата третьего отложения:</label>
          {isEditing ? (
            <input
              type="date"
              name="postponed_date_3"
              value={formData.postponed_date_3 || ''}
              onChange={(e) => handleDateChange('postponed_date_3', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.postponed_date_3)}</span>
          )}
        </div>
      </div>
      
      {/* Приостановление дела */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Приостановление дела</h3>
        
        <div className={styles.field}>
          <label>Дата приостановления:</label>
          {isEditing ? (
            <input
              type="date"
              name="suspension_date"
              value={formData.suspension_date || ''}
              onChange={(e) => handleDateChange('suspension_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.suspension_date)}</span>
          )}
        </div>
        
        {civilData.suspension_date && (
          <>
            <div className={styles.field}>
              <label>Основание приостановления (статья):</label>
              {isEditing ? (
                <input
                  type="text"
                  name="suspension_basis_code"
                  value={formData.suspension_basis_code || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{civilData.suspension_basis_code || 'Не указано'}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Основание приостановления (текст):</label>
              {isEditing ? (
                <textarea
                  name="suspension_basis_text"
                  value={formData.suspension_basis_text || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="3"
                />
              ) : (
                <span>{civilData.suspension_basis_text || 'Не указано'}</span>
              )}
            </div>
          </>
        )}
        
        <div className={styles.field}>
          <label>Дело возобновлено производством:</label>
          {isEditing ? (
            <input
              type="date"
              name="resumed_date"
              value={formData.resumed_date || ''}
              onChange={(e) => handleDateChange('resumed_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.resumed_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ReconciliationTab = ({
  isEditing,
  formData,
  civilData,
  handleDateChange,
  formatDate,
  handleInputChange,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Примирительные процедуры</h3>
        
        <div className={styles.field}>
          <label>Определение о предоставлении срока для примирения:</label>
          {isEditing ? (
            <input
              type="date"
              name="reconciliation_period_date"
              value={formData.reconciliation_period_date || ''}
              onChange={(e) => handleDateChange('reconciliation_period_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.reconciliation_period_date)}</span>
          )}
        </div>
        
        {civilData.reconciliation_period_date && (
          <div className={styles.field}>
            <label>Срок для примирения (дней):</label>
            {isEditing ? (
              <input
                type="number"
                name="reconciliation_days"
                value={formData.reconciliation_days || ''}
                onChange={handleInputChange}
                className={styles.input}
                min="1"
                max="90"
              />
            ) : (
              <span>{civilData.reconciliation_days || 'Не указано'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const DurationTab = ({
  isEditing,
  formData,
  options,
  civilData,
  handleDateChange,
  formatDate,
  handleInputChange,
  getOptionLabel,
  deadlines
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* Сроки рассмотрения */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Сроки рассмотрения дела</h3>
        
        <div className={styles.field}>
          <label>Продолжительность рассмотрения дела (мес.):</label>
          {isEditing ? (
            <input
              type="number"
              name="consideration_duration_months"
              value={formData.consideration_duration_months || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.consideration_duration_months || '0'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Продолжительность рассмотрения дела (дн.):</label>
          {isEditing ? (
            <input
              type="number"
              name="consideration_duration_days"
              value={formData.consideration_duration_days || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.consideration_duration_days || '0'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Общая продолжительность в суде (мес.):</label>
          {isEditing ? (
            <input
              type="number"
              name="total_duration_months"
              value={formData.total_duration_months || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.total_duration_months || '0'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Общая продолжительность в суде (дн.):</label>
          {isEditing ? (
            <input
              type="number"
              name="total_duration_days"
              value={formData.total_duration_days || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.total_duration_days || '0'}</span>
          )}
        </div>
      </div>
      
      {/* Установленные сроки */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Установленные сроки по ГПК</h3>
        
        <div className={styles.field}>
          <label>Срок рассмотрения по ГПК (мес.):</label>
          {isEditing ? (
            <input
              type="number"
              name="statutory_period_months"
              value={formData.statutory_period_months || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.statutory_period_months || '0'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Срок рассмотрения по ГПК (дн.):</label>
          {isEditing ? (
            <input
              type="number"
              name="statutory_period_days"
              value={formData.statutory_period_days || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{civilData.statutory_period_days || '0'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дело рассмотрено в сроки:</label>
          {isEditing ? (
            <select
              name="compliance_with_deadlines"
              value={formData.compliance_with_deadlines || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите вариант</option>
              {options.compliance_with_deadlines?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.compliance_with_deadlines, civilData.compliance_with_deadlines)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дата начала исчисления процессуальных сроков:</label>
          {isEditing ? (
            <input
              type="date"
              name="procedural_terms_start_date"
              value={formData.procedural_terms_start_date || ''}
              onChange={(e) => handleDateChange('procedural_terms_start_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.procedural_terms_start_date)}</span>
          )}
        </div>
      </div>
      
      {/* Информация о соблюдении сроков */}
      {deadlines && (
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Анализ соблюдения сроков</h3>
          
          {deadlines.acceptance && (
            <div className={styles.field}>
              <label>Срок принятия к производству:</label>
              <span className={deadlines.acceptance.violation ? styles.warning : styles.success}>
                {deadlines.acceptance.days !== null ? 
                  `${deadlines.acceptance.days} дней (макс. 5 дней)` : 
                  'Не рассчитано'}
                {deadlines.acceptance.violation && ' ⚠️ Нарушение'}
              </span>
            </div>
          )}
          
          {deadlines.consideration && (
            <div className={styles.field}>
              <label>Срок рассмотрения дела:</label>
              <span className={deadlines.consideration.violation ? styles.warning : styles.success}>
                {deadlines.consideration.days !== null ? 
                  `${deadlines.consideration.days} дней (макс. ${deadlines.consideration.statutory} дней)` : 
                  'Не рассчитано'}
                {deadlines.consideration.violation && ' ⚠️ Нарушение'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

export const OtherMarksTab = ({
  isEditing,
  formData,
  civilData,
  handleDateChange,
  formatDate,
  handleInputChange,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* VII. ДРУГИЕ ОТМЕТКИ О ДВИЖЕНИИ ДЕЛА */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>VII. Другие отметки о движении дела</h3>
        
        <div className={styles.field}>
          <label>Дело соединено с делом №:</label>
          {isEditing ? (
            <input
              type="text"
              name="combined_with_case"
              value={formData.combined_with_case || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.combined_with_case || 'Не указано'}</span>
          )}
        </div>
        
        {civilData.combined_with_case && (
          <div className={styles.field}>
            <label>Дата соединения дел:</label>
            {isEditing ? (
              <input
                type="date"
                name="combined_date"
                value={formData.combined_date || ''}
                onChange={(e) => handleDateChange('combined_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(civilData.combined_date)}</span>
            )}
          </div>
        )}
        
        <div className={styles.field}>
          <label>Дело выделенное в отдельное производство №:</label>
          {isEditing ? (
            <input
              type="text"
              name="separated_case_number"
              value={formData.separated_case_number || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.separated_case_number || 'Не указано'}</span>
          )}
        </div>
        
        {civilData.separated_case_number && (
          <div className={styles.field}>
            <label>Дата выделения дела:</label>
            {isEditing ? (
              <input
                type="date"
                name="separated_date"
                value={formData.separated_date || ''}
                onChange={(e) => handleDateChange('separated_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(civilData.separated_date)}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Дополнительная информация */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Дополнительная информация</h3>
        
        <div className={styles.field}>
          <label>Дело сложное:</label>
          {isEditing ? (
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                name="complex_case"
                checked={formData.complex_case || false}
                onChange={handleInputChange}
              />
              Отметить как сложное дело
            </label>
          ) : (
            <span>{formatBoolean(civilData.complex_case)}</span>
          )}
        </div>
        
        {civilData.complex_case && (
          <div className={styles.field}>
            <label>Продлено по сложному делу до:</label>
            {isEditing ? (
              <input
                type="date"
                name="complex_prolonged"
                value={formData.complex_prolonged || ''}
                onChange={(e) => handleDateChange('complex_prolonged', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(civilData.complex_prolonged)}</span>
            )}
          </div>
        )}
        
        <div className={styles.field}>
          <label>Дело сдано в отдел делопроизводства:</label>
          {isEditing ? (
            <input
              type="date"
              name="handed_to_office_date"
              value={formData.handed_to_office_date || ''}
              onChange={(e) => handleDateChange('handed_to_office_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.handed_to_office_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Копии судебных постановлений направлены:</label>
          {isEditing ? (
            <input
              type="date"
              name="copies_sent_date"
              value={formData.copies_sent_date || ''}
              onChange={(e) => handleDateChange('copies_sent_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.copies_sent_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);
