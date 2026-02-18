import React from 'react';
import styles from './CivilDetail.module.css';

export const BasicInfoTab = ({ 
  isEditing, 
  formData, 
  options, 
  civilData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived,
  judges = [] 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Основные сведения</h3>
        
        <div className={styles.field}>
          <label>Номер дела</label>
          {isEditing ? (
            <input
              type="text"
              name="case_number_civil"
              value={formData.case_number_civil || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.case_number_civil || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата поступления</label>
          {isEditing ? (
            <input
              type="date"
              name="incoming_date"
              value={formData.incoming_date || ''}
              onChange={(e) => handleDateChange('incoming_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.incoming_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Откуда поступило</label>
          {isEditing ? (
            <input
              type="text"
              name="incoming_from"
              value={formData.incoming_from || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.incoming_from || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Категория дела</label>
          {isEditing ? (
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.category?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.category, civilData.category)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Вид производства</label>
          {isEditing ? (
            <select
              name="case_type"
              value={formData.case_type || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.case_type?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.case_type, civilData.case_type)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судья</h3>
        
        <div className={styles.field}>
          <label>Председательствующий судья</label>
          {isEditing ? (
            <select
              name="presiding_judge"
              value={formData.presiding_judge || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите судью</option>
              {judges.map(judge => (
                <option key={judge.id} value={judge.id}>
                  {judge.full_name} {judge.judge_code ? `(${judge.judge_code})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {civilData.presiding_judge_full_name || 
               (civilData.presiding_judge ? `Судья ID: ${civilData.presiding_judge}` : 'Не указано')}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label>Код судьи</label>
          {isEditing ? (
            <input
              type="text"
              name="judge_code"
              value={formData.judge_code || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Введите код судьи"
            />
          ) : (
            <span>{civilData.judge_code || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата принятия дела судьёй</label>
          {isEditing ? (
            <input
              type="date"
              name="judge_acceptance_date"
              value={formData.judge_acceptance_date || ''}
              onChange={(e) => handleDateChange('judge_acceptance_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.judge_acceptance_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Исковые требования</h3>
        
        <div className={styles.field}>
          <label>Цена иска (руб.)</label>
          {isEditing ? (
            <input
              type="number"
              name="claim_amount"
              value={formData.claim_amount || ''}
              onChange={handleInputChange}
              className={styles.input}
              step="0.01"
            />
          ) : (
            <span>{civilData.claim_amount ? `${civilData.claim_amount} ₽` : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Предмет иска</label>
          {isEditing ? (
            <textarea
              name="claim_subject"
              value={formData.claim_subject || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{civilData.claim_subject || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Основание иска</label>
          {isEditing ? (
            <textarea
              name="claim_basis"
              value={formData.claim_basis || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{civilData.claim_basis || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата предъявления иска</label>
          {isEditing ? (
            <input
              type="date"
              name="claim_date"
              value={formData.claim_date || ''}
              onChange={(e) => handleDateChange('claim_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.claim_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Государственная пошлина (руб.)</label>
          {isEditing ? (
            <input
              type="number"
              name="state_duty"
              value={formData.state_duty || ''}
              onChange={handleInputChange}
              className={styles.input}
              step="0.01"
            />
          ) : (
            <span>{civilData.state_duty ? `${civilData.state_duty} ₽` : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Госпошлина уплачена</label>
          {isEditing ? (
            <select
              name="state_duty_paid"
              value={formData.state_duty_paid === true ? 'true' : formData.state_duty_paid === false ? 'false' : ''}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'state_duty_paid',
                  value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null
                }
              })}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{civilData.state_duty_paid ? 'Да' : civilData.state_duty_paid === false ? 'Нет' : 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const MovementTab = ({ 
  isEditing, 
  formData, 
  options, 
  civilData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Рассмотрение дела</h3>
        
        <div className={styles.field}>
          <label>Дата предварительного заседания</label>
          {isEditing ? (
            <input
              type="date"
              name="preliminary_hearing_date"
              value={formData.preliminary_hearing_date || ''}
              onChange={(e) => handleDateChange('preliminary_hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.preliminary_hearing_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Результат предварительного заседания</label>
          {isEditing ? (
            <select
              name="preliminary_hearing_result"
              value={formData.preliminary_hearing_result || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.preliminary_hearing_result?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.preliminary_hearing_result, civilData.preliminary_hearing_result)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата первого судебного заседания</label>
          {isEditing ? (
            <input
              type="date"
              name="first_hearing_date"
              value={formData.first_hearing_date || ''}
              onChange={(e) => handleDateChange('first_hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.first_hearing_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата рассмотрения</label>
          {isEditing ? (
            <input
              type="date"
              name="hearing_date"
              value={formData.hearing_date || ''}
              onChange={(e) => handleDateChange('hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.hearing_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Соблюдение сроков рассмотрения</label>
          {isEditing ? (
            <select
              name="hearing_compliance"
              value={formData.hearing_compliance || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.hearing_compliance?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.hearing_compliance, civilData.hearing_compliance)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дело откладывалось</label>
          {isEditing ? (
            <select
              name="hearing_postponed"
              value={formData.hearing_postponed === true ? 'true' : formData.hearing_postponed === false ? 'false' : ''}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'hearing_postponed',
                  value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null
                }
              })}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{civilData.hearing_postponed ? 'Да' : civilData.hearing_postponed === false ? 'Нет' : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Причины отложения</label>
          {isEditing ? (
            <textarea
              name="postponement_reason"
              value={formData.postponement_reason || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{civilData.postponement_reason || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Приостановление производства</h3>
        
        <div className={styles.field}>
          <label>Производство приостанавливалось</label>
          {isEditing ? (
            <select
              name="case_suspended"
              value={formData.case_suspended === true ? 'true' : formData.case_suspended === false ? 'false' : ''}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'case_suspended',
                  value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null
                }
              })}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{civilData.case_suspended ? 'Да' : civilData.case_suspended === false ? 'Нет' : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Основание приостановления</label>
          {isEditing ? (
            <select
              name="suspension_reason"
              value={formData.suspension_reason || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.suspension_reason?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.suspension_reason, civilData.suspension_reason)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата приостановления</label>
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

        <div className={styles.field}>
          <label>Дата возобновления</label>
          {isEditing ? (
            <input
              type="date"
              name="resumption_date"
              value={formData.resumption_date || ''}
              onChange={(e) => handleDateChange('resumption_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.resumption_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const DeadlinesTab = ({ 
  isEditing, 
  formData, 
  options, 
  civilData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Сроки</h3>
        
        <div className={styles.field}>
          <label>Срок рассмотрения (дни)</label>
          {isEditing ? (
            <input
              type="number"
              name="consideration_term"
              value={formData.consideration_term || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.consideration_term || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата окончания срока</label>
          {isEditing ? (
            <input
              type="date"
              name="term_end_date"
              value={formData.term_end_date || ''}
              onChange={(e) => handleDateChange('term_end_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.term_end_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Продление срока</label>
          {isEditing ? (
            <select
              name="term_extended"
              value={formData.term_extended === true ? 'true' : formData.term_extended === false ? 'false' : ''}
              onChange={(e) => handleInputChange({
                target: {
                  name: 'term_extended',
                  value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null
                }
              })}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{civilData.term_extended ? 'Да' : civilData.term_extended === false ? 'Нет' : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Основание продления</label>
          {isEditing ? (
            <input
              type="text"
              name="term_extension_reason"
              value={formData.term_extension_reason || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.term_extension_reason || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Делопроизводство</h3>
        
        <div className={styles.field}>
          <label>Количество томов</label>
          {isEditing ? (
            <input
              type="number"
              name="volumes_count"
              value={formData.volumes_count || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.volumes_count || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Количество листов</label>
          {isEditing ? (
            <input
              type="number"
              name="pages_count"
              value={formData.pages_count || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{civilData.pages_count || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AdditionalInfoTab = ({ 
  isEditing, 
  formData, 
  civilData, 
  handleDateChange, 
  handleInputChange, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Особые отметки</h3>
        
        <div className={styles.field}>
          <label>Особые отметки</label>
          {isEditing ? (
            <textarea
              name="special_notes"
              value={formData.special_notes || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={4}
            />
          ) : (
            <span>{civilData.special_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Архивные данные</h3>
        
        <div className={styles.field}>
          <label>Статус дела</label>
          {isEditing ? (
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="active">Активное</option>
              <option value="completed">Рассмотрено</option>
              <option value="execution">На исполнении</option>
              <option value="archived">В архиве</option>
            </select>
          ) : (
            <span>{civilData.status_display || civilData.status || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата сдачи в архив</label>
          {isEditing ? (
            <input
              type="date"
              name="archived_date"
              value={formData.archived_date || ''}
              onChange={(e) => handleDateChange('archived_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(civilData.archived_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Архивные примечания</label>
          {isEditing ? (
            <textarea
              name="archive_notes"
              value={formData.archive_notes || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{civilData.archive_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <div className={styles.field}>
          <label>Дата создания</label>
          <span>{formatDate(civilData.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата обновления</label>
          <span>{formatDate(civilData.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);