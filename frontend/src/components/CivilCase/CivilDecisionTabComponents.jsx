import React from 'react';
import styles from './CivilDecisionDetail.module.css';

export const ConsiderationTab = ({
  isEditing,
  formData,
  options,
  handleInputChange,
  getOptionLabel,
  decisionData,
  handleDateChange,
  formatDate,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* III. РЕЗУЛЬТАТ РАССМОТРЕНИЯ ДЕЛА ПО I ИНСТАНЦИИ */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>III. Результат рассмотрения дела по I инстанции</h3>
        
        <div className={styles.field}>
          <label>Дело рассмотрено:</label>
          {isEditing ? (
            <input
              type="date"
              name="considered_date"
              value={formData.considered_date || ''}
              onChange={(e) => handleDateChange('considered_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.considered_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Составлено мотивированное решение:</label>
          {isEditing ? (
            <input
              type="date"
              name="motivated_decision_date"
              value={formData.motivated_decision_date || ''}
              onChange={(e) => handleDateChange('motivated_decision_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.motivated_decision_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Рассмотрено в упрощенном производстве:</label>
          {isEditing ? (
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                name="simplified_proceedings"
                checked={formData.simplified_proceedings || false}
                onChange={handleInputChange}
              />
              Упрощенное производство
            </label>
          ) : (
            <span>{formatBoolean(decisionData.simplified_proceedings)}</span>
          )}
        </div>
      </div>
      
      {/* Вид судебного постановления */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Вид судебного постановления</h3>
        
        <div className={styles.field}>
          <label>Вид судебного постановления (код):</label>
          {isEditing ? (
            <select
              name="ruling_type"
              value={formData.ruling_type || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите вид</option>
              {options.ruling_type?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.ruling_type, decisionData.ruling_type)}</span>
          )}
        </div>
        
        {/* Дополнительные поля в зависимости от вида постановления */}
        {formData.ruling_type === '02' || decisionData.ruling_type === '02' ? (
          <>
            <div className={styles.field}>
              <label>Заочное решение направлено:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="default_judgment_sent"
                  value={formData.default_judgment_sent || ''}
                  onChange={(e) => handleDateChange('default_judgment_sent', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(decisionData.default_judgment_sent)}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Заочное решение вручено:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="default_judgment_delivered"
                  value={formData.default_judgment_delivered || ''}
                  onChange={(e) => handleDateChange('default_judgment_delivered', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(decisionData.default_judgment_delivered)}</span>
              )}
            </div>
          </>
        ) : formData.ruling_type === '03' || decisionData.ruling_type === '03' ? (
          <>
            <div className={styles.field}>
              <label>Судебный приказ направлен:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="court_order_sent"
                  value={formData.court_order_sent || ''}
                  onChange={(e) => handleDateChange('court_order_sent', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(decisionData.court_order_sent)}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Судебный приказ вручен:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="court_order_delivered"
                  value={formData.court_order_delivered || ''}
                  onChange={(e) => handleDateChange('court_order_delivered', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(decisionData.court_order_delivered)}</span>
              )}
            </div>
          </>
        ) : null}
      </div>
      
      {/* Результат рассмотрения */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
        
        <div className={styles.field}>
          <label>Результат рассмотрения (осн. треб.):</label>
          {isEditing ? (
            <select
              name="consideration_result_main"
              value={formData.consideration_result_main || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {options.consideration_result_main?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.consideration_result_main, decisionData.consideration_result_main)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Результат по дополнительному требованию:</label>
          {isEditing ? (
            <select
              name="consideration_result_additional"
              value={formData.consideration_result_additional || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {options.consideration_result_additional?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.consideration_result_additional, decisionData.consideration_result_additional)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Результат по встречному требованию:</label>
          {isEditing ? (
            <select
              name="consideration_result_counter"
              value={formData.consideration_result_counter || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите результат</option>
              {options.consideration_result_counter?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.consideration_result_counter, decisionData.consideration_result_counter)}</span>
          )}
        </div>
      </div>
      
      {/* Примирительные процедуры */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Примирительные процедуры</h3>
        
        <div className={styles.checkboxGroup}>
          {isEditing ? (
            <>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="mediation_used"
                  checked={formData.mediation_used || false}
                  onChange={handleInputChange}
                />
                Медиации в период судебного производства
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="judicial_reconciliation"
                  checked={formData.judicial_reconciliation || false}
                  onChange={handleInputChange}
                />
                Судебное примирение
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="negotiations"
                  checked={formData.negotiations || false}
                  onChange={handleInputChange}
                />
                Переговоры
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="dispute_settled"
                  checked={formData.dispute_settled || false}
                  onChange={handleInputChange}
                />
                Урегулирован спор
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="amicable_agreement"
                  checked={formData.amicable_agreement || false}
                  onChange={handleInputChange}
                />
                Заключение мирового соглашения
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="dispute_not_settled"
                  checked={formData.dispute_not_settled || false}
                  onChange={handleInputChange}
                />
                Не урегулирован
              </label>
            </>
          ) : (
            <div>
              <p>Медиации: {formatBoolean(decisionData.mediation_used)}</p>
              <p>Судебное примирение: {formatBoolean(decisionData.judicial_reconciliation)}</p>
              <p>Переговоры: {formatBoolean(decisionData.negotiations)}</p>
              <p>Урегулирован спор: {formatBoolean(decisionData.dispute_settled)}</p>
              <p>Мировое соглашение: {formatBoolean(decisionData.amicable_agreement)}</p>
              <p>Не урегулирован: {formatBoolean(decisionData.dispute_not_settled)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AppealTab = ({
  isEditing,
  formData,
  options,
  handleInputChange,
  getOptionLabel,
  decisionData,
  handleDateChange,
  formatDate,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* IV. ОБЖАЛОВАНИЕ И РАССМОТРЕНИЕ ВО II ИНСТАНЦИИ */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>IV. Обжалование и рассмотрение во II инстанции</h3>
        
        <div className={styles.field}>
          <label>Обжаловано:</label>
          {isEditing ? (
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                name="appealed"
                checked={formData.appealed || false}
                onChange={handleInputChange}
              />
              Решение обжаловано
            </label>
          ) : (
            <span>{formatBoolean(decisionData.appealed)}</span>
          )}
        </div>
        
        {formData.appealed || decisionData.appealed ? (
          <>
            <div className={styles.field}>
              <label>Дата обжалования:</label>
              {isEditing ? (
                <input
                  type="date"
                  name="appeal_date"
                  value={formData.appeal_date || ''}
                  onChange={(e) => handleDateChange('appeal_date', e.target.value)}
                  className={styles.input}
                />
              ) : (
                <span>{formatDate(decisionData.appeal_date)}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Кем обжаловано:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="appeal_applicant"
                  value={formData.appeal_applicant || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{decisionData.appeal_applicant || 'Не указано'}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Подана жалоба:</label>
              {isEditing ? (
                <label className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    name="appeal_complaint"
                    checked={formData.appeal_complaint || false}
                    onChange={handleInputChange}
                  />
                  Жалоба подана
                </label>
              ) : (
                <span>{formatBoolean(decisionData.appeal_complaint)}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Подано представление прокурора:</label>
              {isEditing ? (
                <label className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    name="prosecutor_representation"
                    checked={formData.prosecutor_representation || false}
                    onChange={handleInputChange}
                  />
                  Представление подано
                </label>
              ) : (
                <span>{formatBoolean(decisionData.prosecutor_representation)}</span>
              )}
            </div>
          </>
        ) : null}
      </div>
      
      {/* Рассмотрение во II инстанции */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Рассмотрение во II инстанции</h3>
        
        <div className={styles.field}>
          <label>Дело назначено к рассмотрению во II инстанции:</label>
          {isEditing ? (
            <input
              type="date"
              name="second_instance_scheduled_date"
              value={formData.second_instance_scheduled_date || ''}
              onChange={(e) => handleDateChange('second_instance_scheduled_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.second_instance_scheduled_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Направлено в вышестоящий суд:</label>
          {isEditing ? (
            <input
              type="date"
              name="sent_to_higher_court_date"
              value={formData.sent_to_higher_court_date || ''}
              onChange={(e) => handleDateChange('sent_to_higher_court_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.sent_to_higher_court_date)}</span>
          )}
        </div>
        
        {decisionData.sent_to_higher_court_date && (
          <div className={styles.field}>
            <label>Наименование вышестоящего суда:</label>
            {isEditing ? (
              <input
                type="text"
                name="sent_to_higher_court_name"
                value={formData.sent_to_higher_court_name || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.sent_to_higher_court_name || 'Не указано'}</span>
            )}
          </div>
        )}
        
        <div className={styles.field}>
          <label>Рассмотрено во II инстанции:</label>
          {isEditing ? (
            <input
              type="date"
              name="second_instance_considered_date"
              value={formData.second_instance_considered_date || ''}
              onChange={(e) => handleDateChange('second_instance_considered_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.second_instance_considered_date)}</span>
          )}
        </div>
        
        {decisionData.second_instance_considered_date && (
          <div className={styles.field}>
            <label>Результат рассмотрения во II инстанции:</label>
            {isEditing ? (
              <select
                name="second_instance_result"
                value={formData.second_instance_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите результат</option>
                {options.second_instance_result?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.second_instance_result, decisionData.second_instance_result)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ExecutionTab = ({
  isEditing,
  formData,
  handleInputChange,
  decisionData,
  handleDateChange,
  formatDate,
  formatCurrency
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* V. ИСПОЛНЕНИЕ СУДЕБНОГО ПОСТАНОВЛЕНИЯ */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>V. Исполнение судебного постановления</h3>
        
        <div className={styles.field}>
          <label>Решение вступило в законную силу:</label>
          {isEditing ? (
            <input
              type="date"
              name="effective_date"
              value={formData.effective_date || ''}
              onChange={(e) => handleDateChange('effective_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.effective_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Исполнительные документы направлены судебному приставу:</label>
          {isEditing ? (
            <input
              type="date"
              name="enforcement_documents_sent"
              value={formData.enforcement_documents_sent || ''}
              onChange={(e) => handleDateChange('enforcement_documents_sent', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.enforcement_documents_sent)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Исполнительные документы выданы взыскателю:</label>
          {isEditing ? (
            <input
              type="date"
              name="enforcement_documents_issued"
              value={formData.enforcement_documents_issued || ''}
              onChange={(e) => handleDateChange('enforcement_documents_issued', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.enforcement_documents_issued)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Исполнено:</label>
          {isEditing ? (
            <input
              type="date"
              name="executed_date"
              value={formData.executed_date || ''}
              onChange={(e) => handleDateChange('executed_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.executed_date)}</span>
          )}
        </div>
      </div>
      
      {/* Возврат из подразделения ССП */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Возврат из подразделения ССП</h3>
        
        <div className={styles.field}>
          <label>Возвращено из подразделения ССП:</label>
          {isEditing ? (
            <input
              type="date"
              name="returned_from_bailiff_date"
              value={formData.returned_from_bailiff_date || ''}
              onChange={(e) => handleDateChange('returned_from_bailiff_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.returned_from_bailiff_date)}</span>
          )}
        </div>
        
        {decisionData.returned_from_bailiff_date && (
          <>
            <div className={styles.field}>
              <label>Вид возвращенного взыскания:</label>
              {isEditing ? (
                <input
                  type="text"
                  name="returned_type"
                  value={formData.returned_type || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{decisionData.returned_type || 'Не указано'}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label>Сумма возвращенного взыскания:</label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  name="returned_amount"
                  value={formData.returned_amount || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              ) : (
                <span>{formatCurrency(decisionData.returned_amount)}</span>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Не взыскано */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Не взыскано</h3>
        
        <div className={styles.field}>
          <label>Не взыскано:</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="not_collected"
              value={formData.not_collected || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.not_collected)}</span>
          )}
        </div>
        
        {decisionData.not_collected && decisionData.not_collected > 0 && (
          <div className={styles.field}>
            <label>Основание невзыскания:</label>
            {isEditing ? (
              <textarea
                name="not_collected_reason"
                value={formData.not_collected_reason || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
              />
            ) : (
              <span>{decisionData.not_collected_reason || 'Не указано'}</span>
            )}
          </div>
        )}
        
        <div className={styles.field}>
          <label>Дело передано в архив:</label>
          {isEditing ? (
            <input
              type="date"
              name="archived_date"
              value={formData.archived_date || ''}
              onChange={(e) => handleDateChange('archived_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.archived_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const CostsTab = ({
  isEditing,
  formData,
  handleInputChange,
  decisionData,
  handleDateChange,
  formatDate,
  formatCurrency
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* Процессуальные издержки */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Процессуальные издержки</h3>
        
        <div className={styles.field}>
          <label>Сумма процессуальных издержек:</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="procedural_costs_amount"
              value={formData.procedural_costs_amount || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.procedural_costs_amount)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Кому начислены издержки:</label>
          {isEditing ? (
            <input
              type="text"
              name="procedural_costs_person"
              value={formData.procedural_costs_person || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData.procedural_costs_person || 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Дата постановления об издержках:</label>
          {isEditing ? (
            <input
              type="date"
              name="procedural_costs_date"
              value={formData.procedural_costs_date || ''}
              onChange={(e) => handleDateChange('procedural_costs_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.procedural_costs_date)}</span>
          )}
        </div>
      </div>
      
      {/* 14. По делу с удовлетворением иска */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>14. По делу с удовлетворением иска</h3>
        
        <div className={styles.field}>
          <label>Присуждено к взысканию (Осн. треб.):</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="awarded_main"
              value={formData.awarded_main || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.awarded_main)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Присуждено к взысканию (Доп. треб.):</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="awarded_additional"
              value={formData.awarded_additional || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.awarded_additional)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>В доход государства госпошлина:</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="duty_to_state"
              value={formData.duty_to_state || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.duty_to_state)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Судебные издержки:</label>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              name="court_costs"
              value={formData.court_costs || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{formatCurrency(decisionData.court_costs)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AdditionalTab = ({
  isEditing,
  formData,
  options,
  handleInputChange,
  getOptionLabel,
  decisionData,
  handleDateChange,
  formatDate,
  formatBoolean
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      {/* Состав суда */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Состав суда</h3>
        
        <div className={styles.field}>
          <label>Состав суда:</label>
          {isEditing ? (
            <select
              name="court_composition"
              value={formData.court_composition || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите состав</option>
              {options.court_composition?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.court_composition, decisionData.court_composition)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>ФИО судьи 1:</label>
          {isEditing ? (
            <input
              type="text"
              name="judge_name_1"
              value={formData.judge_name_1 || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData.judge_name_1 || 'Не указано'}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>ФИО судьи 2:</label>
          {isEditing ? (
            <input
              type="text"
              name="judge_name_2"
              value={formData.judge_name_2 || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData.judge_name_2 || 'Не указано'}</span>
          )}
        </div>
      </div>
      
      {/* Другие участники процесса */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Другие участники процесса</h3>
        
        <div className={styles.checkboxGroup}>
          {isEditing ? (
            <>
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="prosecutor_as_state"
                  checked={formData.prosecutor_as_state || false}
                  onChange={handleInputChange}
                />
                Прокурор как представитель государства
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="prosecutor_for_plaintiff"
                  checked={formData.prosecutor_for_plaintiff || false}
                  onChange={handleInputChange}
                />
                Прокурор в интересах истца
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="state_org_representative"
                  checked={formData.state_org_representative || false}
                  onChange={handleInputChange}
                />
                Представитель государственных органов
              </label>
              
              <label className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="public_organizations"
                  checked={formData.public_organizations || false}
                  onChange={handleInputChange}
                />
                Общественные организации
              </label>
            </>
          ) : (
            <div>
              <p>Прокурор как представитель государства: {formatBoolean(decisionData.prosecutor_as_state)}</p>
              <p>Прокурор в интересах истца: {formatBoolean(decisionData.prosecutor_for_plaintiff)}</p>
              <p>Представитель государственных органов: {formatBoolean(decisionData.state_org_representative)}</p>
              <p>Общественные организации: {formatBoolean(decisionData.public_organizations)}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Другие судебные постановления */}
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>VI. Другие судебные постановления</h3>
        
        <div className={styles.field}>
          <label>Дополнительное решение:</label>
          {isEditing ? (
            <input
              type="date"
              name="additional_decision_date"
              value={formData.additional_decision_date || ''}
              onChange={(e) => handleDateChange('additional_decision_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.additional_decision_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Определение о разъяснении решения:</label>
          {isEditing ? (
            <input
              type="date"
              name="clarification_decision_date"
              value={formData.clarification_decision_date || ''}
              onChange={(e) => handleDateChange('clarification_decision_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData.clarification_decision_date)}</span>
          )}
        </div>
        
        <div className={styles.field}>
          <label>Наложены судебные штрафы:</label>
          {isEditing ? (
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                name="court_fines"
                checked={formData.court_fines || false}
                onChange={handleInputChange}
              />
              Штрафы наложены
            </label>
          ) : (
            <span>{formatBoolean(decisionData.court_fines)}</span>
          )}
        </div>
        
        {formData.court_fines || decisionData.court_fines ? (
          <div className={styles.field}>
            <label>Дата наложения штрафа:</label>
            {isEditing ? (
              <input
                type="date"
                name="court_fines_date"
                value={formData.court_fines_date || ''}
                onChange={(e) => handleDateChange('court_fines_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_fines_date)}</span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);
