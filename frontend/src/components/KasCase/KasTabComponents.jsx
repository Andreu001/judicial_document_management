import React from 'react';
import styles from './KasDetail.module.css';

export const BasicInfoTab = ({
  isEditing,
  formData,
  options,
  kasData,
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
            <label>Номер дела (КАС)</label>
            <span>{kasData.case_number_kas || 'Не указано'}</span>
          </div>

        <div className={styles.field}>
          <label>Дата поступления в суд</label>
          {isEditing ? (
            <input
              type="date"
              name="incoming_date"
              value={formData.incoming_date || ''}
              onChange={(e) => handleDateChange('incoming_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.incoming_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Откуда поступило дело</label>
          {isEditing ? (
            <input
              type="text"
              name="incoming_from"
              value={formData.incoming_from || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.incoming_from || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Порядок поступления</label>
          {isEditing ? (
            <select
              name="admission_order"
              value={formData.admission_order || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.admission_order?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.admission_order, kasData.admission_order)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Категория дела</label>
          {isEditing ? (
            <input
              type="text"
              name="case_category"
              value={formData.case_category || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.case_category || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Сфера правоотношений</label>
          {isEditing ? (
            <input
              type="text"
              name="legal_relationship_sphere"
              value={formData.legal_relationship_sphere || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.legal_relationship_sphere || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_collective_claim"
              checked={formData.is_collective_claim || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Коллективное исковое заявление
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_state_secret"
              checked={formData.is_state_secret || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Связано с государственной тайной
          </label>
        </div>

        {formData.is_collective_claim && (
          <div className={styles.field}>
            <label>Количество истцов</label>
            {isEditing ? (
              <input
                type="number"
                name="number_of_plaintiffs"
                value={formData.number_of_plaintiffs || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{kasData.number_of_plaintiffs || 'Не указано'}</span>
            )}
          </div>
        )}
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
              {kasData.presiding_judge_full_name || 'Не указано'}
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
            />
          ) : (
            <span>{kasData.judge_code || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата принятия дела к производству</label>
          {isEditing ? (
            <input
              type="date"
              name="acceptance_date"
              value={formData.acceptance_date || ''}
              onChange={(e) => handleDateChange('acceptance_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.acceptance_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Госпошлина</h3>
        
        <div className={styles.field}>
          <label>Сумма госпошлины (руб.)</label>
          {isEditing ? (
            <input
              type="number"
              name="state_duty_amount"
              value={formData.state_duty_amount || ''}
              onChange={handleInputChange}
              className={styles.input}
              step="0.01"
            />
          ) : (
            <span>{kasData.state_duty_amount ? `${kasData.state_duty_amount} ₽` : 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Кем уплачена госпошлина</label>
          {isEditing ? (
            <input
              type="text"
              name="state_duty_payer"
              value={formData.state_duty_payer || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.state_duty_payer || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Связанные дела</h3>
        
        <div className={styles.field}>
          <label>Номер связанного/первичного дела</label>
          {isEditing ? (
            <input type="text" name="related_case_number" value={formData.related_case_number || ''}
              onChange={handleInputChange} className={styles.input} />
          ) : <span>{kasData.related_case_number || 'Не указано'}</span>}
        </div>

        <div className={styles.field}>
          <label>Код суда (для повторных/из другого суда)</label>
          {isEditing ? (
            <input type="text" name="previous_court_code" value={formData.previous_court_code || ''}
              onChange={handleInputChange} className={styles.input} />
          ) : <span>{kasData.previous_court_code || 'Не указано'}</span>}
        </div>
      </div>

      {/* Блок: Избирательные дела */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Избирательные дела</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="is_election_period" checked={formData.is_election_period || false}
              onChange={handleInputChange} disabled={!isEditing} /> В период избирательной кампании
          </label>
        </div>

        {formData.is_election_period && (
          <div className={styles.field}>
            <label>Срок для дополнительной проверки по избирательным делам (дней)</label>
            {isEditing ? (
              <input type="number" name="election_case_deadline_days" value={formData.election_case_deadline_days || ''}
                onChange={handleInputChange} className={styles.input} />
            ) : <span>{kasData.election_case_deadline_days || 'Не указано'}</span>}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Меры предварительной защиты</h3>
        
        <div className={styles.field}>
          <label>Меры предварительной защиты</label>
          {isEditing ? (
            <select
              name="preliminary_protection"
              value={formData.preliminary_protection || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Не выбрано</option>
              {options.preliminary_protection?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.preliminary_protection, kasData.preliminary_protection)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата назначения мер предварительной защиты</label>
          {isEditing ? (
            <input
              type="date"
              name="preliminary_protection_date"
              value={formData.preliminary_protection_date || ''}
              onChange={(e) => handleDateChange('preliminary_protection_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.preliminary_protection_date)}</span>
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
  kasData,
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
          <label>Дата определения о подготовке дела</label>
          {isEditing ? (
            <input
              type="date"
              name="ruling_preparation_date"
              value={formData.ruling_preparation_date || ''}
              onChange={(e) => handleDateChange('ruling_preparation_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.ruling_preparation_date)}</span>
          )}
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="ruling_preparation"
              checked={formData.ruling_preparation || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Определение о подготовке дела
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_simplified_procedure"
              checked={formData.is_simplified_procedure || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Рассмотрение в упрощенном производстве
          </label>
        </div>

        <div className={styles.field}>
          <label>Контрольный срок</label>
          {isEditing ? (
            <input
              type="date"
              name="control_date"
              value={formData.control_date || ''}
              onChange={(e) => handleDateChange('control_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.control_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Предварительное заседание</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="ruling_preliminary_hearing"
              checked={formData.ruling_preliminary_hearing || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Определение о назначении предварительного заседания
          </label>
        </div>

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
            <span>{formatDate(kasData.preliminary_hearing_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Экспертиза</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="ruling_expertise"
              checked={formData.ruling_expertise || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Определение о назначении экспертизы
          </label>
        </div>

        <div className={styles.field}>
          <label>Дата направления на экспертизу</label>
          {isEditing ? (
            <input
              type="date"
              name="expertise_sent_date"
              value={formData.expertise_sent_date || ''}
              onChange={(e) => handleDateChange('expertise_sent_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.expertise_sent_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата возвращения с экспертизы</label>
          {isEditing ? (
            <input
              type="date"
              name="expertise_received_date"
              value={formData.expertise_received_date || ''}
              onChange={(e) => handleDateChange('expertise_received_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.expertise_received_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Экспертное учреждение</label>
          {isEditing ? (
            <input
              type="text"
              name="expertise_institution"
              value={formData.expertise_institution || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.expertise_institution || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Вид экспертизы</label>
          {isEditing ? (
            <input
              type="text"
              name="expertise_type"
              value={formData.expertise_type || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.expertise_type || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судебное разбирательство</h3>
        
        <div className={styles.field}>
          <label>Дата рассмотрения (последнего заседания)</label>
          {isEditing ? (
            <input
              type="date"
              name="hearing_date"
              value={formData.hearing_date || ''}
              onChange={(e) => handleDateChange('hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.hearing_date)}</span>
          )}
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_vcs_used"
              checked={formData.is_vcs_used || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            С использованием ВКС
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_audio_recorded"
              checked={formData.is_audio_recorded || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Аудиозапись
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_video_recorded"
              checked={formData.is_video_recorded || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Видеозапись
          </label>
        </div>
      </div>

      {/* Блок: Закрытое заседание */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Закрытое заседание</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="ruling_closed_hearing" checked={formData.ruling_closed_hearing || false}
              onChange={handleInputChange} disabled={!isEditing} /> Определение о назначении закрытого заседания (ст. 11 КАС РФ)
          </label>
        </div>
      </div>

      {/* Блок: Судебное поручение */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судебное поручение</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="ruling_court_order" checked={formData.ruling_court_order || false}
              onChange={handleInputChange} disabled={!isEditing} /> Определение о направлении судебного поручения
          </label>
        </div>

        {formData.ruling_court_order && (
          <>
            <div className={styles.field}>
              <label>Дата направления судебного поручения</label>
              {isEditing ? (
                <input type="date" name="court_order_sent_date" value={formData.court_order_sent_date || ''}
                  onChange={(e) => handleDateChange('court_order_sent_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.court_order_sent_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата поступления исполненного поручения</label>
              {isEditing ? (
                <input type="date" name="court_order_received_date" value={formData.court_order_received_date || ''}
                  onChange={(e) => handleDateChange('court_order_received_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.court_order_received_date)}</span>}
            </div>
          </>
        )}
      </div>

      {/* Блок: Переход к общему порядку */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Переход к общему порядку</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="ruling_transition_to_general" checked={formData.ruling_transition_to_general || false}
              onChange={handleInputChange} disabled={!isEditing} /> Определение о переходе к общему порядку
          </label>
        </div>

        {formData.ruling_transition_to_general && (
          <div className={styles.field}>
            <label>Дата перехода к общему порядку</label>
            {isEditing ? (
              <input type="date" name="ruling_transition_date" value={formData.ruling_transition_date || ''}
                onChange={(e) => handleDateChange('ruling_transition_date', e.target.value)} className={styles.input} />
            ) : <span>{formatDate(kasData.ruling_transition_date)}</span>}
          </div>
        )}
      </div>

      {/* Блок: Назначение дела к разбирательству */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Назначение дела к разбирательству</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="ruling_scheduled_trial" checked={formData.ruling_scheduled_trial || false}
              onChange={handleInputChange} disabled={!isEditing} /> Определение о назначении дела к судебному разбирательству
          </label>
        </div>

        {formData.ruling_scheduled_trial && (
          <div className={styles.field}>
            <label>Дата назначения дела к разбирательству</label>
            {isEditing ? (
              <input type="date" name="scheduled_trial_date" value={formData.scheduled_trial_date || ''}
                onChange={(e) => handleDateChange('scheduled_trial_date', e.target.value)} className={styles.input} />
            ) : <span>{formatDate(kasData.scheduled_trial_date)}</span>}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Отложение дела</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="hearing_postponed"
              checked={formData.hearing_postponed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Дело откладывалось
          </label>
        </div>

        {formData.hearing_postponed && (
          <>
            <div className={styles.field}>
              <label>Количество отложений</label>
              {isEditing ? (
                <input
                  type="number"
                  name="postponement_count"
                  value={formData.postponement_count || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{kasData.postponement_count || 'Не указано'}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Причина отложения</label>
              {isEditing ? (
                <select
                  name="postponement_reason"
                  value={formData.postponement_reason || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите</option>
                  {options.postponement_reason?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getOptionLabel(options.postponement_reason, kasData.postponement_reason)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Иная причина отложения</label>
              {isEditing ? (
                <textarea
                  name="postponement_reason_text"
                  value={formData.postponement_reason_text || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={2}
                />
              ) : (
                <span>{kasData.postponement_reason_text || 'Не указано'}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const DeadlinesTab = ({
  isEditing,
  formData,
  options,
  kasData,
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
          <label>Продолжительность рассмотрения (мес.)</label>
          {isEditing ? (
            <input
              type="number"
              name="consideration_duration_months"
              value={formData.consideration_duration_months || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.consideration_duration_months || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Продолжительность рассмотрения (дни)</label>
          {isEditing ? (
            <input
              type="number"
              name="consideration_duration_days"
              value={formData.consideration_duration_days || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.consideration_duration_days || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Общая продолжительность (мес.)</label>
          {isEditing ? (
            <input
              type="number"
              name="total_duration_months"
              value={formData.total_duration_months || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.total_duration_months || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Общая продолжительность (дни)</label>
          {isEditing ? (
            <input
              type="number"
              name="total_duration_days"
              value={formData.total_duration_days || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{kasData.total_duration_days || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дело рассмотрено в сроки</label>
          {isEditing ? (
            <select
              name="term_compliance"
              value={formData.term_compliance || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="1">Предусмотренные КАС РФ (с учетом продления по сложным)</option>
              <option value="2">С нарушением сроков</option>
              <option value="2.1"> - по несложному делу</option>
              <option value="2.2"> - по сложному делу</option>
            </select>
          ) : (
            <span>{getOptionLabel([
              {value: '1', label: 'Предусмотренные КАС РФ (с учетом продления по сложным)'},
              {value: '2', label: 'С нарушением сроков'},
              {value: '2.1', label: ' - по несложному делу'},
              {value: '2.2', label: ' - по сложному делу'},
            ], kasData.term_compliance)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата начала исчисления процесс. срока</label>
          {isEditing ? (
            <input
              type="date"
              name="deadline_start_date"
              value={formData.deadline_start_date || ''}
              onChange={(e) => handleDateChange('deadline_start_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(kasData.deadline_start_date)}</span>
          )}
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="is_complex_case"
              checked={formData.is_complex_case || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Дело сложное
          </label>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Приостановление производства</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="case_suspended"
              checked={formData.case_suspended || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Производство по делу приостанавливалось
          </label>
        </div>

        {formData.case_suspended && (
          <>
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
                <span>{getOptionLabel(options.suspension_reason, kasData.suspension_reason)}</span>
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
                <span>{formatDate(kasData.suspension_date)}</span>
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
                <span>{formatDate(kasData.resumption_date)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Продолжительность приостановления (дней)</label>
              {isEditing ? (
                <input
                  type="number"
                  name="suspension_duration_days"
                  value={formData.suspension_duration_days || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{kasData.suspension_duration_days || 'Не указано'}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Срок для примирения до</label>
              {isEditing ? (
                <input
                  type="date"
                  name="reconciliation_deadline_date"
                  value={formData.reconciliation_deadline_date || ''}
                  onChange={(e) => handleDateChange('reconciliation_deadline_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(kasData.reconciliation_deadline_date)}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const AdditionalInfoTab = ({
  isEditing,
  formData,
  options,
  kasData,
  handleDateChange,
  handleInputChange,
  formatDate,
  isArchived,
  getOptionLabel
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
            <span>{kasData.special_notes || 'Нет'}</span>
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
            <span>{kasData.status_display || kasData.status || 'Не указано'}</span>
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
            <span>{formatDate(kasData.archived_date)}</span>
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
            <span>{kasData.archive_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      {/* Блок: Обжалование дела (апелляция) */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Апелляционное обжалование дела</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="is_appealed" checked={formData.is_appealed || false}
              onChange={handleInputChange} disabled={!isEditing} /> Обжаловано (апелляция)
          </label>
        </div>

        {formData.is_appealed && (
          <>
            <div className={styles.field}>
              <label>Кем обжаловано (апелляция)</label>
              {isEditing ? (
                <textarea name="appealed_by" value={formData.appealed_by || ''} onChange={handleInputChange}
                  className={styles.textarea} rows={2} />
              ) : <span>{kasData.appealed_by || 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата подачи апелляционной жалобы/представления</label>
              {isEditing ? (
                <input type="date" name="appeal_date" value={formData.appeal_date || ''}
                  onChange={(e) => handleDateChange('appeal_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Тип обжалования (апелляция)</label>
              {isEditing ? (
                <select name="appeal_type" value={formData.appeal_type || ''} onChange={handleInputChange} className={styles.select}>
                  <option value="">Выберите</option>
                  <option value="1">Жалоба</option>
                  <option value="2">Представление прокурора</option>
                </select>
              ) : <span>{formData.appeal_type === '1' ? 'Жалоба' : formData.appeal_type === '2' ? 'Представление прокурора' : 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Срок для устранения недостатков апелляционной жалобы до</label>
              {isEditing ? (
                <input type="date" name="appeal_deadline_for_corrections" value={formData.appeal_deadline_for_corrections || ''}
                  onChange={(e) => handleDateChange('appeal_deadline_for_corrections', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_deadline_for_corrections)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дело назначено к рассмотрению в апелляции на</label>
              {isEditing ? (
                <input type="date" name="appeal_scheduled_date" value={formData.appeal_scheduled_date || ''}
                  onChange={(e) => handleDateChange('appeal_scheduled_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_scheduled_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Повторно назначено в апелляции на</label>
              {isEditing ? (
                <input type="date" name="appeal_scheduled_date_repeated" value={formData.appeal_scheduled_date_repeated || ''}
                  onChange={(e) => handleDateChange('appeal_scheduled_date_repeated', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_scheduled_date_repeated)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата направления дела в апелляционный суд</label>
              {isEditing ? (
                <input type="date" name="appeal_sent_to_higher_court_date" value={formData.appeal_sent_to_higher_court_date || ''}
                  onChange={(e) => handleDateChange('appeal_sent_to_higher_court_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_sent_to_higher_court_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата повторного направления в апелляционный суд</label>
              {isEditing ? (
                <input type="date" name="appeal_sent_to_higher_court_repeated" value={formData.appeal_sent_to_higher_court_repeated || ''}
                  onChange={(e) => handleDateChange('appeal_sent_to_higher_court_repeated', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_sent_to_higher_court_repeated)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата возврата апелляционной жалобы без рассмотрения</label>
              {isEditing ? (
                <input type="date" name="appeal_returned_without_review_date" value={formData.appeal_returned_without_review_date || ''}
                  onChange={(e) => handleDateChange('appeal_returned_without_review_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_returned_without_review_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Причина возврата апелляционной жалобы</label>
              {isEditing ? (
                <textarea name="appeal_return_reason" value={formData.appeal_return_reason || ''} onChange={handleInputChange}
                  className={styles.textarea} rows={2} />
              ) : <span>{kasData.appeal_return_reason || 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата рассмотрения дела в апелляционной инстанции</label>
              {isEditing ? (
                <input type="date" name="appeal_review_date" value={formData.appeal_review_date || ''}
                  onChange={(e) => handleDateChange('appeal_review_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.appeal_review_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Результат апелляционного рассмотрения</label>
              {isEditing ? (
                <select name="appeal_result" value={formData.appeal_result || ''} onChange={handleInputChange} className={styles.select}>
                  <option value="">Выберите</option>
                  {options?.appeal_result?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : <span>{getOptionLabel(options?.appeal_result, kasData.appeal_result)}</span>}
            </div>
          </>
        )}
      </div>

      {/* Блок: Кассационное обжалование дела */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Кассационное обжалование дела</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="is_cassation_filed" checked={formData.is_cassation_filed || false}
              onChange={handleInputChange} disabled={!isEditing} /> Подана кассационная жалоба/представление
          </label>
        </div>

        {formData.is_cassation_filed && (
          <>
            <div className={styles.field}>
              <label>Кем подана кассационная жалоба/представление</label>
              {isEditing ? (
                <textarea name="cassation_filed_by" value={formData.cassation_filed_by || ''} onChange={handleInputChange}
                  className={styles.textarea} rows={2} />
              ) : <span>{kasData.cassation_filed_by || 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата подачи кассационной жалобы/представления</label>
              {isEditing ? (
                <input type="date" name="cassation_date" value={formData.cassation_date || ''}
                  onChange={(e) => handleDateChange('cassation_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Тип обжалования (кассация)</label>
              {isEditing ? (
                <select name="cassation_type" value={formData.cassation_type || ''} onChange={handleInputChange} className={styles.select}>
                  <option value="">Выберите</option>
                  <option value="1">Жалоба</option>
                  <option value="2">Представление прокурора</option>
                </select>
              ) : <span>{formData.cassation_type === '1' ? 'Жалоба' : formData.cassation_type === '2' ? 'Представление прокурора' : 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Срок для устранения недостатков кассационной жалобы до</label>
              {isEditing ? (
                <input type="date" name="cassation_deadline_for_corrections" value={formData.cassation_deadline_for_corrections || ''}
                  onChange={(e) => handleDateChange('cassation_deadline_for_corrections', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_deadline_for_corrections)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дело назначено к рассмотрению в кассации на</label>
              {isEditing ? (
                <input type="date" name="cassation_scheduled_date" value={formData.cassation_scheduled_date || ''}
                  onChange={(e) => handleDateChange('cassation_scheduled_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_scheduled_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата направления дела в кассационный суд</label>
              {isEditing ? (
                <input type="date" name="cassation_sent_to_higher_court_date" value={formData.cassation_sent_to_higher_court_date || ''}
                  onChange={(e) => handleDateChange('cassation_sent_to_higher_court_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_sent_to_higher_court_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата возврата кассационной жалобы без рассмотрения</label>
              {isEditing ? (
                <input type="date" name="cassation_returned_without_review_date" value={formData.cassation_returned_without_review_date || ''}
                  onChange={(e) => handleDateChange('cassation_returned_without_review_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_returned_without_review_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Причина возврата кассационной жалобы</label>
              {isEditing ? (
                <textarea name="cassation_return_reason" value={formData.cassation_return_reason || ''} onChange={handleInputChange}
                  className={styles.textarea} rows={2} />
              ) : <span>{kasData.cassation_return_reason || 'Не указано'}</span>}
            </div>

            <div className={styles.field}>
              <label>Дата рассмотрения дела в кассационной инстанции</label>
              {isEditing ? (
                <input type="date" name="cassation_review_date" value={formData.cassation_review_date || ''}
                  onChange={(e) => handleDateChange('cassation_review_date', e.target.value)} className={styles.input} />
              ) : <span>{formatDate(kasData.cassation_review_date)}</span>}
            </div>

            <div className={styles.field}>
              <label>Результат кассационного рассмотрения</label>
              {isEditing ? (
                <select name="cassation_result" value={formData.cassation_result || ''} onChange={handleInputChange} className={styles.select}>
                  <option value="">Выберите</option>
                  {options?.cassation_result?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : <span>{getOptionLabel(options?.cassation_result, kasData.cassation_result)}</span>}
            </div>
          </>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <div className={styles.field}>
          <label>Дата создания</label>
          <span>{formatDate(kasData.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата обновления</label>
          <span>{formatDate(kasData.updated_at)}</span>
        </div>

        {kasData.registered_case_info && (
          <div className={styles.field}>
            <label>Связанное зарегистрированное дело</label>
            <span>
              №{kasData.registered_case_info.full_number} от {formatDate(kasData.registered_case_info.registration_date)}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);