import React from 'react';
import styles from './CriminalDetail.module.css';


// =================== КРИМИНАЛЬНОЕ ДЕЛО (CriminalDetail) ===================
export const BasicInfoTab = ({ isEditing,
                                formData,
                                options,
                                criminalData,
                                handleDateChange,
                                formatDate, card,
                                handleInputChange,
                                handleFieldChange,
                                getOptionLabel,
                                formatBoolean,
                                referringAuthorities = [],
                                judges = [] }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Основные сведения</h3>
          <div className={styles.field}>
            <div className={styles.field}>
              <label>№ дела</label>
              <span>{criminalData.case_number || card?.original_name}</span>
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
                <span>{formatDate(criminalData.incoming_date)}</span>
              )}
            </div>
            <label>Число лиц по делу</label>
            {isEditing ? (
              <input
                type="number"
                name="number_of_persons"
                value={formData.number_of_persons || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.number_of_persons || 'Не указано'}</span>
            )}
          </div>
        
        {/* Количество томов */}
        <div className={styles.field}>
          <label>Количество томов</label>
          {isEditing ? (
            <input
              type="number"
              name="volume_count"
              value={formData.volume_count || ''}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{criminalData.volume_count || criminalData.volume_count === 0 ? criminalData.volume_count : 'Не указано'}</span>
          )}
        </div>

        {/* Орган, направивший материалы */}
        <div className={styles.field}>
          <label>Орган, направивший материалы</label>
          {isEditing ? (
            <select
              name="referring_authority"
              value={formData.referring_authority || ''}
              onChange={handleInputChange}
              className={styles.input}
            >
              <option value="">Выберите орган</option>
              {referringAuthorities.map(authority => (
                <option key={authority.id} value={authority.id}>
                  {authority.name} {authority.code ? `(${authority.code})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <span>
              {criminalData.referring_authority_name || 'Не указано'}
              {criminalData.referring_authority_code ? ` (${criminalData.referring_authority_code})` : ''}
            </span>
          )}
        </div>

          <div className={styles.field}>
            <label>Состав суда</label>
            {isEditing ? (
              <select
                name="composition_court"
                value={formData.composition_court || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.compositionCourt.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.compositionCourt, criminalData.composition_court)}</span>
            )}
          </div>

        {/* Председательствующий */}
        <div className={styles.field}>
          <label>Председательствующий</label>
            {isEditing ? (
              <select
                name="presiding_judge"
                value={formData.presiding_judge || ''}
                onChange={handleInputChange}
                className={styles.input}
              >
                <option value="">Выберите судью</option>
                {judges.map(judge => (
                  <option key={judge.id} value={judge.id}>
                    {judge.role} ({judge.judge_code})
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {formData.presiding_judge_name || 'Не указано'}
              </span>
            )}
        </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Порядок поступления дела</h3>
          <div className={styles.field}>
            <label>Порядок поступления</label>
            {isEditing ? (
              <select
                name="case_order"
                value={formData.case_order ??''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseOrder.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseOrder, criminalData.case_order)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Номер дела, из которого выделено</label>
            {isEditing ? (
              <input
                type="text"
                name="separated_case_number"
                value={formData.separated_case_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.separated_case_number || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата выделения дела</label>
            {isEditing ? (
              <input
                type="date"
                name="separated_case_date"
                value={formData.separated_case_date || ''}
                onChange={(e) => handleDateChange('separated_case_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.separated_case_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Код суда при повторном поступлении</label>
            {isEditing ? (
              <input
                type="text"
                name="repeated_court_code"
                value={formData.repeated_court_code || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.repeated_court_code || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>№ производства по первичной регистрации</label>
            {isEditing ? (
              <input
                type="text"
                name="repeated_primary_reg_number"
                value={formData.repeated_primary_reg_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.repeated_primary_reg_number || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Повторное поступление дела</label>
            {isEditing ? (
              <select
                name="repeat_case"
                value={formData.repeat_case}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.repeat_case)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата повторного поступления</label>
            {isEditing ? (
              <input
                type="date"
                name="repeat_case_date"
                value={formData.repeat_case_date || ''}
                onChange={(e) => handleDateChange('repeat_case_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.repeat_case_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

export const EvidenceTab = ({ isEditing,
                            formData,
                            handleInputChange,
                            formatBoolean,
                            criminalData }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Вещественные доказательства</h3>
          
          <div className={styles.field}>
            <label>Наличие вещдоков</label>
            {isEditing ? (
              <select
                name="evidence_present"
                value={formData.evidence_present}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.evidence_present)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Рег. номер вещдока</label>
            {isEditing ? (
              <input
                type="text"
                name="evidence_reg_number"
                value={formData.evidence_reg_number || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.evidence_reg_number || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const CaseCategoryTab = ({ isEditing,
                                    formData,
                                    options,
                                    handleInputChange,
                                    getOptionLabel,
                                    criminalData,
                                    handleDateChange,
                                    formatDate,
                                    setShowRulingModal,
                                    showPreliminaryHearingGrounds,
                                    formatBoolean }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Категория дела</h3>
          <div className={styles.field}>
            <label>Категория дела</label>
            {isEditing ? (
              <select
                name="case_category"
                value={formData.case_category || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseCategory.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseCategory, criminalData.case_category)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата принятия дела судьей</label>
            {isEditing ? (
              <input
                type="date"
                name="judge_acceptance_date"
                value={formData.judge_acceptance_date || ''}
                onChange={(e) => handleDateChange('judge_acceptance_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.judge_acceptance_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Решение судьи при назначении дела</h3>
          
          {/* Кнопка формирования постановления */}
          <div className={styles.rulingSection}>
            <button 
              className={styles.generateRulingButton}
              onClick={() => setShowRulingModal(true)}
            >
              Сформировать постановление о назначении дела
            </button>
          </div>

          <div className={styles.field}>
            <label>Решение судьи</label>
            {isEditing ? (
              <select
                name="judge_decision"
                value={formData.judge_decision || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.judgeDecision.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.judgeDecision, criminalData.judge_decision)}</span>
            )}
          </div>

          {/* Поле оснований предварительного слушания */}
          {showPreliminaryHearingGrounds() && (
              <div className={styles.field}>
                  <label>Основания проведения предварительного слушания</label>
                  {isEditing ? (
                      <select
                          name="preliminary_hearing_grounds"
                          value={formData.preliminary_hearing_grounds || ''}
                          onChange={handleInputChange}
                          className={styles.select}
                      >
                          <option value="">Выберите основание</option>
                          {options.preliminaryHearingGrounds.map(option => (
                              <option key={option.value} value={option.value}>
                                  {option.label}
                              </option>
                          ))}
                      </select>
                  ) : (
                      <span>
                          {options.preliminaryHearingGrounds.find(opt => opt.value === criminalData.preliminary_hearing_grounds)?.label || 'Не указано'}
                      </span>
                  )}
                    <div className={styles.field}>
                      <label>Дата предварительного слушания</label>
                      {isEditing ? (
                        <input
                          type="date"
                          name="case_transfer_date"
                          value={formData.case_transfer_date || ''}
                          onChange={(e) => handleDateChange('case_transfer_date', e.target.value)}
                          className={styles.input}
                        />
                      ) : (
                        <span>{formatDate(criminalData.case_transfer_date)}</span>
                      )}
                    </div>
              </div>
          )}

          <div className={styles.field}>
            <label>Куда направлено дело</label>
            {isEditing ? (
              <input
                type="text"
                name="case_transfer_destination"
                value={formData.case_transfer_destination || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.case_transfer_destination || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>С использованием ВКС</label>
            {isEditing ? (
              <select
                name="vks_used"
                value={formData.vks_used}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.vks_used)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления дела</label>
            {isEditing ? (
              <input
                type="date"
                name="preliminary_hearing_date"
                value={formData.preliminary_hearing_date || ''}
                onChange={(e) => handleDateChange('preliminary_hearing_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.preliminary_hearing_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const ResultTab = ({ isEditing,
                            formData,
                            options,
                            handleInputChange,
                            getOptionLabel,
                            criminalData,
                            formatBoolean }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Результат рассмотрения дела</h3>
          <div className={styles.field}>
            <label>Результат рассмотрения</label>
            {isEditing ? (
              <select
                name="case_result"
                value={formData.case_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseResult.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseResult, criminalData.case_result)}</span>
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
              <span>{criminalData.total_duration_days || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Категория длительности рассмотрения</label>
            {isEditing ? (
              <select
                name="case_duration_category"
                value={formData.case_duration_category || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseDurationCategory.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseDurationCategory, criminalData.case_duration_category)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Состав суда</h3>
          <div className={styles.field}>
            <label>Без участия подсудимого</label>
            {isEditing ? (
              <select
                name="absence_defendant"
                value={formData.absence_defendant}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.absence_defendant)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Закрытое заседание</label>
            {isEditing ? (
              <select
                name="closed_hearing"
                value={formData.closed_hearing}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.closed_hearing)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Использование ВКС</label>
            {isEditing ? (
              <select
                name="vks_technology"
                value={formData.vks_technology}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.vks_technology)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особый порядок при согласии обвиняемого</label>
            {isEditing ? (
              <select
                name="special_procedure_consent"
                value={formData.special_procedure_consent}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.special_procedure_consent)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особый порядок при досудебном соглашении</label>
            {isEditing ? (
              <select
                name="special_procedure_agreement"
                value={formData.special_procedure_agreement}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                <option value="true">Да</option>
                <option value="false">Нет</option>
              </select>
            ) : (
              <span>{formatBoolean(criminalData.special_procedure_agreement)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const AdditionalTab = ({ isEditing,
                                formData,
                                handleInputChange,
                                criminalData,
                                handleDateChange,
                                formatDate,
                                isArchived = false }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Частные определения</h3>
          <div className={styles.field}>
            <label>Количество частных определений</label>
            {isEditing && !isArchived ? ( // Блокируем для архивных дел
              <input
                type="number"
                name="private_rulings_count"
                value={formData.private_rulings_count || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{criminalData.private_rulings_count || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата вынесения частного определения</label>
            {isEditing && !isArchived ? ( // Блокируем для архивных дел
              <input
                type="date"
                name="private_ruling_date"
                value={formData.private_ruling_date || ''}
                onChange={(e) => handleDateChange('private_ruling_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData.private_ruling_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Дополнительные сведения</h3>
          <div className={styles.field}>
            <label>Дата передачи в архив</label>
            {isEditing ? (
              <textarea
              type="date"
                name="archived_date"
                value={formData.archived_date || ''}
                onChange={(e) => handleDateChange('archived_date', e.target.value)}
                className={styles.textarea}
              />
            ) : (
              <span>{criminalData.archived_date || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Примечание</label>
            {isEditing ? (
              <textarea
                name="special_notes"
                value={formData.special_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{criminalData.special_notes || 'Не указано'}</span>
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
              <span>{criminalData.archive_notes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(criminalData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(criminalData.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
);

// =================== СУДЕБНОЕ РЕШЕНИЕ (CriminalDecisionDetail) ===================
export const AppealTab = ({ isEditing,
                            formData,
                            options,
                            handleInputChange,
                            getOptionLabel,
                            decisionData,
                            handleDateChange,
                            formatDate }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Обжалование приговора</h3>
          
          <div className={styles.field}>
            <label>Обжалование приговора</label>
            {isEditing ? (
              <select
                name="appeal_present"
                value={formData.appeal_present || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.appeal_present.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.appeal_present, decisionData.appeal_present)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления апелляции</label>
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
            <label>ФИО заявителя апелляции</label>
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
            <label>Процессуальное положение заявителя</label>
            {isEditing ? (
              <input
                type="text"
                name="appeal_applicant_status"
                value={formData.appeal_applicant_status || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.appeal_applicant_status || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const CourtInstanceTab = ({ isEditing,
                                    formData,
                                    options,
                                    handleInputChange,
                                    getOptionLabel,
                                    decisionData,
                                    handleDateChange,
                                    formatDate }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Направление в суд II инстанции</h3>
          
          <div className={styles.field}>
            <label>Суд II инстанции</label>
            {isEditing ? (
              <select
                name="court_instance"
                value={formData.court_instance || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.court_instance.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.court_instance, decisionData.court_instance)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления в суд II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_sent_date"
                value={formData.court_sent_date || ''}
                onChange={(e) => handleDateChange('court_sent_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_sent_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата возвращения из суда II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_return_date"
                value={formData.court_return_date || ''}
                onChange={(e) => handleDateChange('court_return_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_return_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина возвращения</label>
            {isEditing ? (
              <textarea
                name="court_return_reason"
                value={formData.court_return_reason || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.court_return_reason || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата повторного направления</label>
            {isEditing ? (
              <input
                type="date"
                name="court_resend_date"
                value={formData.court_resend_date || ''}
                onChange={(e) => handleDateChange('court_resend_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_resend_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const ConsiderationTab = ({ isEditing,
                                    formData,
                                    options,
                                    handleDateChange,
                                    formatDate,
                                    decisionData,
                                    handleInputChange,
                                    getOptionLabel }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Рассмотрение во II инстанции</h3>
          
          <div className={styles.field}>
            <label>Дата рассмотрения во II инстанции</label>
            {isEditing ? (
              <input
                type="date"
                name="court_consideration_date"
                value={formData.court_consideration_date || ''}
                onChange={(e) => handleDateChange('court_consideration_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.court_consideration_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Результат рассмотрения во II инстанции</label>
            {isEditing ? (
              <select
                name="appeal_consideration_result"
                value={formData.appeal_consideration_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.appeal_consideration_result.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.appeal_consideration_result, decisionData.appeal_consideration_result)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сущность изменений</label>
            {isEditing ? (
              <textarea
                name="consideration_changes"
                value={formData.consideration_changes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.consideration_changes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления из вышестоящего суда</label>
            {isEditing ? (
              <input
                type="date"
                name="higher_court_receipt_date"
                value={formData.higher_court_receipt_date || ''}
                onChange={(e) => handleDateChange('higher_court_receipt_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.higher_court_receipt_date)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const ExecutionTab = ({ isEditing,
                                formData,
                                options,
                                handleDateChange,
                                formatDate,
                                decisionData,
                                handleInputChange,
                                getOptionLabel }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Вступление в силу и исполнение</h3>
          
          <div className={styles.field}>
            <label>Дата вступления в силу</label>
            {isEditing ? (
              <input
                type="date"
                name="sentence_effective_date"
                value={formData.sentence_effective_date || ''}
                onChange={(e) => handleDateChange('sentence_effective_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.sentence_effective_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата обращения к исполнению</label>
            {isEditing ? (
              <input
                type="date"
                name="sentence_execution_date"
                value={formData.sentence_execution_date || ''}
                onChange={(e) => handleDateChange('sentence_execution_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.sentence_execution_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Результаты гражданского иска</h3>
          
          <div className={styles.field}>
            <label>Результат гражданского иска</label>
            {isEditing ? (
              <select
                name="civil_claim_result"
                value={formData.civil_claim_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.civil_claim_result.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {getOptionLabel(options.civil_claim_result, decisionData.civil_claim_result)}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма иска</label>
            {isEditing ? (
              <input
                type="number"
                name="civil_claim_amount"
                value={formData.civil_claim_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.civil_claim_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма госпошлины</label>
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
              <span>{decisionData.state_duty_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма ущерба от хищения</label>
            {isEditing ? (
              <input
                type="number"
                name="theft_damage_amount"
                value={formData.theft_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.theft_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма ущерба от др. преступлений</label>
            {isEditing ? (
              <input
                type="number"
                name="other_damage_amount"
                value={formData.other_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.other_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма морального вреда</label>
            {isEditing ? (
              <input
                type="number"
                name="moral_damage_amount"
                value={formData.moral_damage_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.moral_damage_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ по моральному вреду</label>
            {isEditing ? (
              <input
                type="text"
                name="moral_damage_article"
                value={formData.moral_damage_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.moral_damage_article || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const SpecialMarksTab = ({ isEditing,
                                formData,
                                handleInputChange,
                                decisionData,
                                handleDateChange,
                                formatDate }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Особые отметки</h3>
          
          <div className={styles.field}>
            <label>Копия направлена</label>
            {isEditing ? (
              <input
                type="text"
                name="copy_sent_to_1"
                value={formData.copy_sent_to_1 || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.copy_sent_to_1 || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления 1</label>
            {isEditing ? (
              <input
                type="date"
                name="copy_sent_date_1"
                value={formData.copy_sent_date_1 || ''}
                onChange={(e) => handleDateChange('copy_sent_date_1', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.copy_sent_date_1)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Соединено с делом №</label>
            {isEditing ? (
              <input
                type="text"
                name="joined_with_case"
                value={formData.joined_with_case || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.joined_with_case || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Выделено в дело №</label>
            {isEditing ? (
              <input
                type="text"
                name="separated_to_case"
                value={formData.separated_to_case || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.separated_to_case || 'Не указано'}</span>
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
              <span>{decisionData.expertise_type || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата направления экспертизы</label>
            {isEditing ? (
              <input
                type="date"
                name="expertise_sent_date"
                value={formData.expertise_sent_date || ''}
                onChange={(e) => handleDateChange('expertise_sent_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.expertise_sent_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата поступления экспертизы</label>
            {isEditing ? (
              <input
                type="date"
                name="expertise_received_date"
                value={formData.expertise_received_date || ''}
                onChange={(e) => handleDateChange('expertise_received_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.expertise_received_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ о конфискации</label>
            {isEditing ? (
              <input
                type="text"
                name="confiscation_article"
                value={formData.confiscation_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.confiscation_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма судебного штрафа</label>
            {isEditing ? (
              <input
                type="number"
                name="court_fine_amount"
                value={formData.court_fine_amount || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.court_fine_amount || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья УК РФ о штрафе</label>
            {isEditing ? (
              <input
                type="text"
                name="court_fine_article"
                value={formData.court_fine_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{decisionData.court_fine_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Меры процессуального принуждения</label>
            {isEditing ? (
              <textarea
                name="procedural_coercion"
                value={formData.procedural_coercion || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.procedural_coercion || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата применения мер</label>
            {isEditing ? (
              <input
                type="date"
                name="procedural_coercion_date"
                value={formData.procedural_coercion_date || ''}
                onChange={(e) => handleDateChange('procedural_coercion_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.procedural_coercion_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Процессуальные издержки</label>
            {isEditing ? (
              <input
                type="number"
                name="procedural_costs"
                value={formData.procedural_costs || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{decisionData.procedural_costs || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Информация о ходатайствах</label>
            {isEditing ? (
              <textarea
                name="petitions_info"
                value={formData.petitions_info || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.petitions_info || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата отзыва ходатайства</label>
            {isEditing ? (
              <input
                type="date"
                name="petitions_withdrawal_date"
                value={formData.petitions_withdrawal_date || ''}
                onChange={(e) => handleDateChange('petitions_withdrawal_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.petitions_withdrawal_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Другие отметки</label>
            {isEditing ? (
              <textarea
                name="other_notes"
                value={formData.other_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{decisionData.other_notes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата сдачи в архив</label>
            {isEditing ? (
              <input
                type="date"
                name="archive_date"
                value={formData.archive_date || ''}
                onChange={(e) => handleDateChange('archive_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(decisionData.archive_date)}</span>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Системная информация</h3>
          
          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(decisionData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(decisionData.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
);

// =================== ПОДСУДИМЫЙ (DefendantDetail) ===================
export const DefendantBasicInfoTab = ({ isEditing,
                                        formData,
                                        options,
                                        handleInputChange,
                                        defendantData,
                                        formatDate,
                                        handleDateChange,
                                        getOptionLabel }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Основные сведения</h3>

          <div className={styles.field}>
            <label>ФИО подсудимого</label>
            {isEditing ? (
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.full_name || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Статья</label>
            {isEditing ? (
              <input
                type="text"
                name="article"
                value={formData.article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.article || 'Не указано'}</span>
            )}
          </div>
          <div className={styles.field}>
            <label>Максимальное наказание по статье</label>
            {isEditing ? (
              <input
                type="text"
                name="maximum_penalty_article"
                value={formData.maximum_penalty_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.maximum_penalty_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата рождения</label>
            {isEditing ? (
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date || ''}
                onChange={(e) => handleDateChange('birth_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.birth_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Пол</label>
            {isEditing ? (
              <select
                name="sex"
                value={formData.sex || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.sex.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.sex, defendantData.sex)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Гражданство</label>
            {isEditing ? (
              <input
                type="text"
                name="citizenship"
                value={formData.citizenship || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.citizenship || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Адрес проживания</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.address || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const DefendantRestraintTab = ({ isEditing,
                                        formData,
                                        options,
                                        handleInputChange,
                                        defendantData,
                                        formatDate,
                                        handleDateChange,
                                        getOptionLabel }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Меры пресечения</h3>
          
          <div className={styles.field}>
            <label>Мера пресечения</label>
            {isEditing ? (
              <select
                name="restraint_measure"
                value={formData.restraint_measure || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintMeasure.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintMeasure, defendantData.restraint_measure)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата избрания меры пресечения</label>
            {isEditing ? (
              <input
                type="date"
                name="restraint_date"
                value={formData.restraint_date || ''}
                onChange={(e) => handleDateChange('restraint_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.restraint_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Мера пресечения применена</label>
            {isEditing ? (
              <select
                name="restraint_application"
                value={formData.restraint_application || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintApplication.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintApplication, defendantData.restraint_application)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Изменение меры пресечения</label>
            {isEditing ? (
              <select
                name="restraint_change"
                value={formData.restraint_change || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.restraintChange.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.restraintChange, defendantData.restraint_change)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата изменения меря пресечения</label>
            {isEditing ? (
              <input
                type="date"
                name="restraint_change_date"
                value={formData.restraint_change_date || ''}
                onChange={(e) => handleDateChange('restraint_change_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(defendantData.restraint_change_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Изменена на меру</label>
            {isEditing ? (
              <input
                type="text"
                name="restraint_change_to"
                value={formData.restraint_change_to || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.restraint_change_to || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

 export const DefendantPunishmentTab = ({ isEditing,
                                formData,
                                handleInputChange,
                                defendantData }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Наказание</h3>
          
          <div className={styles.field}>
            <label>Статья по приговору</label>
            {isEditing ? (
              <input
                type="text"
                name="conviction_article"
                value={formData.conviction_article || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.conviction_article || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Вид наказания</label>
            {isEditing ? (
              <input
                type="text"
                name="punishment_type"
                value={formData.punishment_type || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.punishment_type || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Срок наказания</label>
            {isEditing ? (
              <input
                type="text"
                name="punishment_term"
                value={formData.punishment_term || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.punishment_term || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дополнительное наказание</label>
            {isEditing ? (
              <input
                type="text"
                name="additional_punishment"
                value={formData.additional_punishment || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.additional_punishment || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Условно-досрочное освобождение / испытательный срок</label>
            {isEditing ? (
              <input
                type="text"
                name="parole_info"
                value={formData.parole_info || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.parole_info || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

export const DefendantDamageTab = ({ isEditing,
                                        formData,                                        
                                        handleInputChange,
                                        defendantData }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Ущерб и взыскания</h3>
          
          <div className={styles.field}>
            <label>Сумма ущерба</label>
            {isEditing ? (
              <input
                type="number"
                name="property_damage"
                value={formData.property_damage || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{defendantData.property_damage || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Сумма морального вреда</label>
            {isEditing ? (
              <input
                type="number"
                name="moral_damage"
                value={formData.moral_damage || ''}
                onChange={handleInputChange}
                className={styles.input}
                step="0.01"
              />
            ) : (
              <span>{defendantData.moral_damage || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const DefendantDetentionTab = ({ isEditing,
                                        formData,
                                        handleInputChange,
                                        defendantData }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Место содержания</h3>
          
          <div className={styles.field}>
            <label>Содержится в учреждении</label>
            {isEditing ? (
              <input
                type="text"
                name="detention_institution"
                value={formData.detention_institution || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.detention_institution || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Адрес учреждения</label>
            {isEditing ? (
              <input
                type="text"
                name="detention_address"
                value={formData.detention_address || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.detention_address || 'Не указано'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
);

export const DefendantAdditionalTab = ({ isEditing,
                                        formData,
                                        handleInputChange,
                                        defendantData,
                                        formatDate }) => (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Дополнительные сведения</h3>
          
          <div className={styles.field}>
            <label>Результат рассмотрения по данному лицу</label>
            {isEditing ? (
              <input
                type="text"
                name="trial_result"
                value={formData.trial_result || ''}
                onChange={handleInputChange}
                className={styles.input}
              />
            ) : (
              <span>{defendantData.trial_result || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Особые отметки по лицу</label>
            {isEditing ? (
              <textarea
                name="special_notes"
                value={formData.special_notes || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            ) : (
              <span>{defendantData.special_notes || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата создания записи</label>
            <span>{formatDate(defendantData.created_at)}</span>
          </div>

          <div className={styles.field}>
            <label>Дата последнего обновления</label>
            <span>{formatDate(defendantData.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
);

// =================== ДВИЖЕНИЕ (DefendantDetail) ===================
export const MovementHearingTab = ({ 
                                  isEditing, 
                                  formData, 
                                  options, 
                                  handleInputChange, 
                                  getOptionLabel, 
                                  movementData, 
                                  handleDateChange, 
                                  formatDate, 
                                  formatBoolean 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Результат предварительного слушания</h3>
        
        <div className={styles.field}>
          <label>Результат слушания</label>
          {isEditing ? (
            <select
              name="preliminary_hearing_result"
              value={formData.preliminary_hearing_result || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.preliminaryHearingResult.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.preliminaryHearingResult, movementData.preliminary_hearing_result)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата первого заседания</label>
          {isEditing ? (
            <input
              type="date"
              name="first_hearing_date"
              value={formData.first_hearing_date || ''}
              onChange={(e) => handleDateChange('first_hearing_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(movementData.first_hearing_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="meeting_time">Время заседания:</label>
          {isEditing ? (
            <input
              type="time"
              id="meeting_time"
              name="meeting_time"
              value={formData.meeting_time || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{(movementData.meeting_time)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Место проведения слушания</label>
          {isEditing ? (
            <input
              type="text"
              name="hearing_location"
              value={formData.hearing_location || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{movementData.hearing_location || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Присутствие сторон</label>
          {isEditing ? (
            <select
              name="parties_present"
              value={formData.parties_present || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="all">Все стороны присутствуют</option>
              <option value="partial">Частичное присутствие</option>
              <option value="none">Стороны отсутствуют</option>
            </select>
          ) : (
            <span>{movementData.parties_present || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const MovementComplianceTab = ({ 
                                  isEditing, 
                                  formData, 
                                  options, 
                                  handleInputChange, 
                                  getOptionLabel, 
                                  movementData 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Соблюдение сроков</h3>
        
        <div className={styles.field}>
          <label>Соблюдение сроков</label>
          {isEditing ? (
            <select
              name="hearing_compliance"
              value={formData.hearing_compliance || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.hearingCompliance.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.hearingCompliance, movementData.hearing_compliance)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Причина нарушения сроков</label>
          {isEditing ? (
            <textarea
              name="compliance_violation_reason"
              value={formData.compliance_violation_reason || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{movementData.compliance_violation_reason || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Плановый срок рассмотрения</label>
          {isEditing ? (
            <input
              type="text"
              name="planned_completion_date"
              value={formData.planned_completion_date || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{movementData.planned_completion_date || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Фактический срок рассмотрения</label>
          {isEditing ? (
            <input
              type="text"
              name="actual_completion_date"
              value={formData.actual_completion_date || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{movementData.actual_completion_date || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const MovementPostponementTab = ({ 
                                        isEditing, 
                                        formData, 
                                        options, 
                                        handleInputChange, 
                                        getOptionLabel, 
                                        movementData, 
                                        handleDateChange, 
                                        formatDate 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Причины отложения дела</h3>
        
        <div className={styles.field}>
          <label>Причина отложения</label>
          {isEditing ? (
            <select
              name="hearing_postponed_reason"
              value={formData.hearing_postponed_reason || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.hearingPostponedReason.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.hearingPostponedReason, movementData.hearing_postponed_reason)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Текст причины отложения</label>
          {isEditing ? (
            <textarea
              name="hearing_postponed_reason_text"
              value={formData.hearing_postponed_reason_text || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{movementData.hearing_postponed_reason_text || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата приостановления производства</label>
          {isEditing ? (
            <input
              type="date"
              name="suspension_date"
              value={formData.suspension_date || ''}
              onChange={(e) => handleDateChange('suspension_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(movementData.suspension_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Причина приостановления</label>
          {isEditing ? (
            <select
              name="suspension_reason"
              value={formData.suspension_reason || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите</option>
              {options.suspensionReason.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.suspensionReason, movementData.suspension_reason)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата возобновления производства</label>
          {isEditing ? (
            <input
              type="date"
              name="resumption_date"
              value={formData.resumption_date || ''}
              onChange={(e) => handleDateChange('resumption_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(movementData.resumption_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Основание возобновления</label>
          {isEditing ? (
            <input
              type="text"
              name="resumption_reason"
              value={formData.resumption_reason || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{movementData.resumption_reason || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);
