import React from 'react';
import styles from './AdministrativeDetail.module.css';

export const BasicInfoTab = ({ 
  isEditing, 
  formData, 
  options, 
  adminData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived,
  judges = [],
  referringAuthorities = []
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Общие сведения</h3>
        
          <div className={styles.field}>
            <label>Номер дела об АП</label>
            <span>{adminData.case_number_admin || 'Не указано'}</span>
          </div>

        <div className={styles.field}>
          <label>Дата поступления дела в суд</label>
          {isEditing ? (
            <input
              type="date"
              name="incoming_date"
              value={formData.incoming_date || ''}
              onChange={(e) => handleDateChange('incoming_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.incoming_date)}</span>
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
            <span>{adminData.incoming_from || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Протокол об АП</h3>
        
        <div className={styles.field}>
          <label>Орган, составивший протокол</label>
          {isEditing ? (
            <select
              name="referring_authority"
              value={formData.referring_authority || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите орган</option>
              {referringAuthorities.map(authority => (
                <option key={authority.id} value={authority.id}>
                  {authority.name}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {adminData.referring_authority_detail?.name || 
               adminData.referring_authority || 
               'Не указано'}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label>Номер протокола об АП</label>
          {isEditing ? (
            <input
              type="text"
              name="protocol_number"
              value={formData.protocol_number || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.protocol_number || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата составления протокола</label>
          {isEditing ? (
            <input
              type="date"
              name="protocol_date"
              value={formData.protocol_date || ''}
              onChange={(e) => handleDateChange('protocol_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.protocol_date)}</span>
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
              {adminData.presiding_judge_full_name || 
               (adminData.presiding_judge ? `Судья ID: ${adminData.presiding_judge}` : 'Не указано')}
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
            <span>{adminData.judge_code || 'Не указано'}</span>
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
            <span>{formatDate(adminData.judge_acceptance_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Правонарушение</h3>
        
        <div className={styles.field}>
          <label>Статья КоАП РФ</label>
          {isEditing ? (
            <input
              type="text"
              name="article_number"
              value={formData.article_number || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Например: 12.8"
            />
          ) : (
            <span>{adminData.article_number || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Часть статьи</label>
          {isEditing ? (
            <input
              type="text"
              name="article_part"
              value={formData.article_part || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Например: 1"
            />
          ) : (
            <span>{adminData.article_part || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Описание правонарушения</label>
          {isEditing ? (
            <textarea
              name="offense_description"
              value={formData.offense_description || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{adminData.offense_description || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата совершения правонарушения</label>
          {isEditing ? (
            <input
              type="date"
              name="offense_date"
              value={formData.offense_date || ''}
              onChange={(e) => handleDateChange('offense_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.offense_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Время совершения</label>
          {isEditing ? (
            <input
              type="time"
              name="offense_time"
              value={formData.offense_time || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.offense_time?.slice(0,5) || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Место совершения</label>
          {isEditing ? (
            <input
              type="text"
              name="offense_place"
              value={formData.offense_place || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.offense_place || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ConsiderationTab = ({ 
  isEditing, 
  formData, 
  options, 
  adminData, 
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
          <label>Вид рассмотрения</label>
          {isEditing ? (
            <select
              name="consideration_type"
              value={formData.consideration_type || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите вид</option>
              {options.considerationType?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.considerationType, adminData.consideration_type)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата рассмотрения дела</label>
          {isEditing ? (
            <input
              type="date"
              name="hearing_date"
              value={formData.hearing_date || ''}
              onChange={(e) => handleDateChange('hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.hearing_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Время рассмотрения</label>
          {isEditing ? (
            <input
              type="time"
              name="hearing_time"
              value={formData.hearing_time || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.hearing_time?.slice(0,5) || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Отложение рассмотрения</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="hearing_postponed"
              checked={formData.hearing_postponed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Рассмотрение откладывалось
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
                <span>{adminData.postponement_count || '0'}</span>
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
                <span>{adminData.postponement_reason || 'Не указано'}</span>
              )}
            </div>
          </>
        )}
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
            Производство приостанавливалось
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
                  <option value="">Выберите основание</option>
                  {options.suspensionReason?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getOptionLabel(options.suspensionReason, adminData.suspension_reason)}</span>
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
                <span>{formatDate(adminData.suspension_date)}</span>
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
                <span>{formatDate(adminData.resumption_date)}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const DecisionTab = ({ 
  isEditing, 
  formData, 
  options, 
  adminData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate,
  formatCurrency,
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Результаты рассмотрения</h3>
        
        <div className={styles.field}>
          <label>Результат рассмотрения дела</label>
          {isEditing ? (
            <select
              name="outcome"
              value={formData.outcome || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {options.outcome?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.outcome, adminData.outcome)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Вид наказания</label>
          {isEditing ? (
            <select
              name="punishment_type"
              value={formData.punishment_type || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите вид</option>
              {options.punishmentType?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.punishmentType, adminData.punishment_type)}</span>
          )}
        </div>

        {formData.punishment_type === '2' && (
          <div className={styles.field}>
            <label>Сумма штрафа (руб.)</label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                name="fine_amount"
                value={formData.fine_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{formatCurrency(adminData.fine_amount)}</span>
            )}
          </div>
        )}

        {formData.punishment_type === '4' && (
          <div className={styles.field}>
            <label>Срок лишения специального права</label>
            {isEditing ? (
              <input
                type="text"
                name="deprivation_period"
                value={formData.deprivation_period || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{adminData.deprivation_period || 'Не указано'}</span>
            )}
          </div>
        )}

        {formData.punishment_type === '5' && (
          <div className={styles.field}>
            <label>Срок административного ареста</label>
            {isEditing ? (
              <input
                type="text"
                name="arrest_period"
                value={formData.arrest_period || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{adminData.arrest_period || 'Не указано'}</span>
            )}
          </div>
        )}

        {formData.punishment_type === '7' && (
          <div className={styles.field}>
            <label>Срок приостановления деятельности</label>
            {isEditing ? (
              <input
                type="text"
                name="suspension_period"
                value={formData.suspension_period || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{adminData.suspension_period || 'Не указано'}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Даты постановления</h3>
        
        <div className={styles.field}>
          <label>Дата вынесения постановления</label>
          {isEditing ? (
            <input
              type="date"
              name="decision_date"
              value={formData.decision_date || ''}
              onChange={(e) => handleDateChange('decision_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.decision_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата составления мотивированного постановления</label>
          {isEditing ? (
            <input
              type="date"
              name="decision_motivated_date"
              value={formData.decision_motivated_date || ''}
              onChange={(e) => handleDateChange('decision_motivated_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.decision_motivated_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата вступления в законную силу</label>
          {isEditing ? (
            <input
              type="date"
              name="decision_effective_date"
              value={formData.decision_effective_date || ''}
              onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.decision_effective_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>
          <input
            type="checkbox"
            name="complaint_filed"
            checked={formData.complaint_filed || false}
            onChange={handleInputChange}
            disabled={!isEditing}
            style={{ marginRight: '8px' }}
          />
          Обжалование
        </h3>

        {formData.complaint_filed && (
          <>
            <div className={styles.field}>
              <label>Дата поступления жалобы</label>
              {isEditing ? (
                <input
                  type="date"
                  name="complaint_date"
                  value={formData.complaint_date || ''}
                  onChange={(e) => handleDateChange('complaint_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.complaint_date)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Результат рассмотрения жалобы</label>
              {isEditing ? (
                <select
                  name="complaint_result"
                  value={formData.complaint_result || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите результат</option>
                  {options.complaint_result?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{getOptionLabel(options.complaint_result, adminData.complaint_result)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Дата решения по жалобе</label>
              {isEditing ? (
                <input
                  type="date"
                  name="complaint_decision_date"
                  value={formData.complaint_decision_date || ''}
                  onChange={(e) => handleDateChange('complaint_decision_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.complaint_decision_date)}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const ExecutionTab = ({ 
  isEditing, 
  formData, 
  options, 
  adminData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate,
  formatCurrency,
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Исполнительный документ</h3>
        
        <div className={styles.field}>
          <label>Дата выдачи исполнительного документа</label>
          {isEditing ? (
            <input
              type="date"
              name="execution_document_date"
              value={formData.execution_document_date || ''}
              onChange={(e) => handleDateChange('execution_document_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.execution_document_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Номер исполнительного документа</label>
          {isEditing ? (
            <input
              type="text"
              name="execution_document_number"
              value={formData.execution_document_number || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.execution_document_number || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Кому направлен исполнительный документ</label>
          {isEditing ? (
            <input
              type="text"
              name="execution_document_received_by"
              value={formData.execution_document_received_by || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.execution_document_received_by || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Исполнение постановления</h3>
        
        <div className={styles.field}>
          <label>Результат исполнения</label>
          {isEditing ? (
            <select
              name="execution_result"
              value={formData.execution_result || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {options.executionResult?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.executionResult, adminData.execution_result)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата фактического исполнения</label>
          {isEditing ? (
            <input
              type="date"
              name="execution_date"
              value={formData.execution_date || ''}
              onChange={(e) => handleDateChange('execution_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(adminData.execution_date)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Штраф</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="fine_paid"
              checked={formData.fine_paid || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Штраф уплачен
          </label>
        </div>

        {formData.fine_paid && (
          <>
            <div className={styles.field}>
              <label>Дата уплаты штрафа</label>
              {isEditing ? (
                <input
                  type="date"
                  name="fine_paid_date"
                  value={formData.fine_paid_date || ''}
                  onChange={(e) => handleDateChange('fine_paid_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.fine_paid_date)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Уплаченная сумма (руб.)</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  name="fine_paid_amount"
                  value={formData.fine_paid_amount || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{formatCurrency(adminData.fine_paid_amount)}</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Конфискация</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="confiscation_executed"
              checked={formData.confiscation_executed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Конфискация исполнена
          </label>
        </div>

        {formData.confiscation_executed && (
          <div className={styles.field}>
            <label>Дата исполнения конфискации</label>
            {isEditing ? (
              <input
                type="date"
                name="confiscation_executed_date"
                value={formData.confiscation_executed_date || ''}
                onChange={(e) => handleDateChange('confiscation_executed_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(adminData.confiscation_executed_date)}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Лишение специального права</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="deprivation_executed"
              checked={formData.deprivation_executed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Лишение спецправа исполнено
          </label>
        </div>

        {formData.deprivation_executed && (
          <>
            <div className={styles.field}>
              <label>Дата начала срока лишения</label>
              {isEditing ? (
                <input
                  type="date"
                  name="deprivation_start_date"
                  value={formData.deprivation_start_date || ''}
                  onChange={(e) => handleDateChange('deprivation_start_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.deprivation_start_date)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Дата окончания срока лишения</label>
              {isEditing ? (
                <input
                  type="date"
                  name="deprivation_end_date"
                  value={formData.deprivation_end_date || ''}
                  onChange={(e) => handleDateChange('deprivation_end_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.deprivation_end_date)}</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Административный арест</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="arrest_executed"
              checked={formData.arrest_executed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Административный арест исполнен
          </label>
        </div>

        {formData.arrest_executed && (
          <div className={styles.field}>
            <label>Отбытый срок ареста</label>
            {isEditing ? (
              <input
                type="text"
                name="arrest_period_served"
                value={formData.arrest_period_served || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{adminData.arrest_period_served || 'Не указано'}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Приостановление деятельности</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="suspension_executed"
              checked={formData.suspension_executed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Приостановление деятельности исполнено
          </label>
        </div>

        {formData.suspension_executed && (
          <>
            <div className={styles.field}>
              <label>Дата начала приостановления</label>
              {isEditing ? (
                <input
                  type="date"
                  name="suspension_start_date"
                  value={formData.suspension_start_date || ''}
                  onChange={(e) => handleDateChange('suspension_start_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.suspension_start_date)}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Дата окончания приостановления</label>
              {isEditing ? (
                <input
                  type="date"
                  name="suspension_end_date"
                  value={formData.suspension_end_date || ''}
                  onChange={(e) => handleDateChange('suspension_end_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(adminData.suspension_end_date)}</span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судебные приставы</h3>
        
        <div className={styles.field}>
          <label>Отдел судебных приставов</label>
          {isEditing ? (
            <input
              type="text"
              name="bailiff_department"
              value={formData.bailiff_department || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.bailiff_department || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Судебный пристав-исполнитель</label>
          {isEditing ? (
            <input
              type="text"
              name="bailiff_name"
              value={formData.bailiff_name || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.bailiff_name || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Номер исполнительного производства</label>
          {isEditing ? (
            <input
              type="text"
              name="enforcement_proceedings_number"
              value={formData.enforcement_proceedings_number || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{adminData.enforcement_proceedings_number || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AdditionalInfoTab = ({ 
  isEditing, 
  formData, 
  adminData, 
  handleDateChange, 
  handleInputChange, 
  formatDate,
  formatDateTime,
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
            <span>{adminData.special_notes || 'Нет'}</span>
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
            <span>{adminData.status_display || adminData.status || 'Не указано'}</span>
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
            <span>{formatDate(adminData.archived_date)}</span>
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
            <span>{adminData.archive_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <div className={styles.field}>
          <label>Дата создания</label>
          <span>{formatDateTime(adminData.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата обновления</label>
          <span>{formatDateTime(adminData.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);