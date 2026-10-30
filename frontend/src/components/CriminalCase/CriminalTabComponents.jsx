import React, { useState, useEffect } from 'react';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import CaseManagementService from '../../API/CaseManagementService';
import ConfirmModal from '../UI/Modal/ConfirmModal';
import styles from './CriminalDetail.module.css';

// =================== ОСНОВНЫЕ СВЕДЕНИЯ (BasicInfoTab) ===================
export const BasicInfoTab = ({ 
  isEditing,
  formData,
  options,
  criminalData,
  caseMovement,
  handleDateChange,
  formatDate,
  handleInputChange,
  handleFieldChange,
  getOptionLabel,
  formatBoolean,
  referringAuthorities = [],
  judges = [],
  showRareFields,
  setShowRareFields,
  showRepeatCaseDetails,
  showSeparationDetails
}) => {
  // Состояния для дополнительных судей (только на фронтенде)
  const [additionalJudges, setAdditionalJudges] = useState({
    judge_1: formData.judge_1 || '',
    judge_2: formData.judge_2 || ''
  });

  const handleAdditionalJudgeChange = (field, value) => {
    setAdditionalJudges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Основные сведения</h3>
          
          <div className={styles.field}>
            <label>№ дела</label>
            <span>{criminalData.case_number_criminal}</span>
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

          <div className={styles.field}>
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

          <div className={styles.field}>
            <label>Орган, направивший материалы</label>
            {isEditing ? (
              <select
                name="referring_authority"
                value={formData.referring_authority_id || formData.referring_authority || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Сохраняем ID в referring_authority_id
                  handleFieldChange('referring_authority_id', value ? parseInt(value, 10) : null);
                  // Также сохраняем в referring_authority для совместимости
                  handleFieldChange('referring_authority', value ? parseInt(value, 10) : null);
                }}
                className={styles.input}
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
                    {judge.full_name || judge.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {criminalData.presiding_judge_full_name || 
                criminalData.presiding_judge_name || 
                'Не указано'}
              </span>
            )}
          </div>

          {/* Дополнительные поля для судей при коллегии */}
          {formData.composition_court === '2' && (
            <>
              <div className={styles.field}>
                <label>Судья - 1</label>
                {isEditing ? (
                  <select
                    value={additionalJudges.judge_1}
                    onChange={(e) => handleAdditionalJudgeChange('judge_1', e.target.value)}
                    className={styles.input}
                  >
                    <option value="">Выберите судью</option>
                    {judges.map(judge => (
                      <option key={judge.id} value={judge.id}>
                        {judge.full_name || judge.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>
                    {additionalJudges.judge_1 ? 
                      judges.find(j => String(j.id) === String(additionalJudges.judge_1))?.full_name || additionalJudges.judge_1 : 
                      'Не указано'}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label>Судья - 2</label>
                {isEditing ? (
                  <select
                    value={additionalJudges.judge_2}
                    onChange={(e) => handleAdditionalJudgeChange('judge_2', e.target.value)}
                    className={styles.input}
                  >
                    <option value="">Выберите судью</option>
                    {judges.map(judge => (
                      <option key={judge.id} value={judge.id}>
                        {judge.full_name || judge.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span>
                    {additionalJudges.judge_2 ? 
                      judges.find(j => String(j.id) === String(additionalJudges.judge_2))?.full_name || additionalJudges.judge_2 : 
                      'Не указано'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>
            Порядок поступления дела
            <button 
              type="button"
              className={styles.toggleRareFieldsButton}
              onClick={() => setShowRareFields(!showRareFields)}
            >
              {showRareFields ? 'Скрыть дополнительные поля' : 'Показать дополнительные поля'}
            </button>
          </h3>
          
          <div className={styles.field}>
            <label>Порядок поступления</label>
            {isEditing ? (
              <select
                name="case_order"
                value={formData.case_order || ''}
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

          {/* Редко используемые поля - сворачиваемый блок */}
          {showRareFields && (
            <div className={styles.rareFieldsBlock}>
              {/* Поля для выделенного дела */}
              <div className={styles.subsectionTitleSmall}>Сведения о выделении дела</div>
              
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

              <div className={styles.subsectionTitleSmall}>Сведения о повторном поступлении</div>

              <div className={styles.field}>
                <label>Повторное поступление дела</label>
                {isEditing ? (
                  <select
                    name="repeat_case"
                    value={formData.repeat_case === true ? 'true' : formData.repeat_case === false ? 'false' : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('repeat_case', val === 'true' ? true : val === 'false' ? false : null);
                    }}
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

              {showRepeatCaseDetails() && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =================== ВЕЩЕСТВЕННЫЕ ДОКАЗАТЕЛЬСТВА (EvidenceTab) ===================
export const EvidenceTab = ({ isEditing, formData, handleInputChange, handleFieldChange, formatBoolean, criminalData }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Вещественные доказательства</h3>
        
        <div className={styles.field}>
          <label>Наличие вещдоков</label>
          {isEditing ? (
            <select
              name="evidence_present"
              value={formData.evidence_present === true ? 'true' : formData.evidence_present === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('evidence_present', val === 'true' ? true : val === 'false' ? false : null);
              }}
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

// =================== КАТЕГОРИЯ И РЕШЕНИЕ (CaseCategoryTab) ===================

export const CaseCategoryTab = ({ 
  isEditing,
  formData,
  options,
  caseMovement,
  handleInputChange,
  getOptionLabel,
  criminalData,
  handleDateChange,
  handleFieldChange,
  formatDate,
  setShowRulingModal,
  showPreliminaryHearingGrounds,
  formatBoolean 
}) => {
  // Определяем, какое решение выбрано
  const judgeDecision = formData.judge_decision || criminalData?.judge_decision;
  
  // Определяем, какой результат предварительного слушания выбран
  const preliminaryResult = formData.preliminary_hearing_result || criminalData?.preliminary_hearing_result;
  
  // Функция для отображения условных полей при направлении по подсудности из предварительного слушания
  const renderPreliminaryTransferFields = () => {
    if (preliminaryResult === '1') {
      return (
        <div className={styles.conditionalFields}>
          <div className={styles.subsectionTitleSmall}>Направление по подсудности (результат предварительного слушания)</div>
          
          <div className={styles.field}>
            <label>Куда направлено дело</label>
            {isEditing ? (
              <input
                type="text"
                name="transfer_to_court"
                value={formData.transfer_to_court || ''}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Наименование суда"
              />
            ) : (
              <span>{criminalData?.transfer_to_court || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина направления</label>
            {isEditing ? (
              <textarea
                name="transfer_reason"
                value={formData.transfer_reason || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
                placeholder="Основание для передачи дела по подсудности"
              />
            ) : (
              <span>{criminalData?.transfer_reason || 'Не указано'}</span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Функция для отображения условных полей в зависимости от judge_decision
  const renderConditionalFields = () => {
    if (judgeDecision === '1') {
      // Вариант 1: "о направлении уголовного дела по подсудности"
      return (
        <div className={styles.conditionalFields}>
          <div className={styles.subsectionTitleSmall}>Направление по подсудности</div>
          
          <div className={styles.field}>
            <label>Куда направлено дело</label>
            {isEditing ? (
              <input
                type="text"
                name="transfer_to_court"
                value={formData.transfer_to_court || ''}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Наименование суда"
              />
            ) : (
              <span>{criminalData?.transfer_to_court || 'Не указано'}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина направления</label>
            {isEditing ? (
              <textarea
                name="transfer_reason"
                value={formData.transfer_reason || ''}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
                placeholder="Основание для передачи дела по подсудности"
              />
            ) : (
              <span>{criminalData?.transfer_reason || 'Не указано'}</span>
            )}
          </div>
        </div>
      );
    }
    
    if (judgeDecision === '2') {
      // Вариант 2: "о назначении предварительного слушания"
      return (
        <div className={styles.conditionalFields}>
          <div className={styles.subsectionTitleSmall}>Предварительное слушание</div>
          
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
                {options.preliminaryHearingGrounds && options.preliminaryHearingGrounds.length > 0 ? (
                  options.preliminaryHearingGrounds.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  // Резервные опции, если options не загрузились
                  <>
                    <option value="229.2.1">Ходатайство об исключении доказательства (ч. 3 ст. 229 УПК РФ)</option>
                    <option value="229.2.2">Основания для возвращения дела прокурору (ст. 237 УПК РФ)</option>
                    <option value="229.2.3">Основания для приостановления или прекращения дела</option>
                    <option value="229.2.4.1">Ходатайство о проведении заседания без участия подсудимого (ч. 5 ст. 247 УПК РФ)</option>
                    <option value="229.2.5">Решение вопроса о рассмотрении дела с участием присяжных заседателей</option>
                    <option value="229.2.6">Наличие приговора с условным осуждением за ранее совершенное преступление</option>
                    <option value="229.2.7">Основания для выделения уголовного дела</option>
                    <option value="229.2.8">Ходатайство о соединении уголовных дел</option>
                    <option value="other">Иные основания по решению судьи</option>
                  </>
                )}
              </select>
            ) : (
              <span>{getOptionLabel(options.preliminaryHearingGrounds, criminalData?.preliminary_hearing_grounds)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Дата предварительного слушания</label>
            {isEditing ? (
              <input
                type="date"
                name="preliminary_hearing_date"
                value={formData.preliminary_hearing_date || ''}
                onChange={(e) => handleDateChange('preliminary_hearing_date', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData?.preliminary_hearing_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Результат предварительного слушания (ст. 236 УПК РФ)</label>
            {isEditing ? (
              <select
                name="preliminary_hearing_result"
                value={formData.preliminary_hearing_result || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите результат</option>
                {options.preliminaryHearingResult && options.preliminaryHearingResult.length > 0 ? (
                  options.preliminaryHearingResult.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  // Резервные опции
                  <>
                    <option value="1">о направлении уголовного дела по подсудности</option>
                    <option value="2">о возвращении уголовного дела прокурору</option>
                    <option value="3">о приостановлении производства по делу</option>
                    <option value="4">о прекращении уголовного дела</option>
                    <option value="5">о назначении судебного заседания</option>
                    <option value="6">о назначении закрытого судебного заседания</option>
                  </>
                )}
              </select>
            ) : (
              <span>{getOptionLabel(options.preliminaryHearingResult, criminalData?.preliminary_hearing_result)}</span>
            )}
          </div>

          {/* Условные поля для направления по подсудности из предварительного слушания */}
          {renderPreliminaryTransferFields()}
        </div>
      );
    }
    
    // Вариант 3: "о назначении судебного заседания" - ничего не показываем
    return null;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabGrid}>
        
        {/* ===== БЛОК 1: КАТЕГОРИЯ ДЕЛА И РЕШЕНИЕ СУДЬИ ===== */}
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Категория дела и решение судьи</h3>
          
          <div className={styles.field}>
            <label>Категория дела</label>
            {isEditing ? (
              <select
                name="case_category_criminal"
                value={formData.case_category_criminal || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.caseCategory && options.caseCategory.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.caseCategory, criminalData?.case_category_criminal)}</span>
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
              <span>{formatDate(criminalData?.judge_acceptance_date)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Решение судьи при назначении дела</label>
            {isEditing ? (
              <select
                name="judge_decision"
                value={formData.judge_decision || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите</option>
                {options.judgeDecision && options.judgeDecision.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{getOptionLabel(options.judgeDecision, criminalData?.judge_decision)}</span>
            )}
          </div>

          {/* Условные поля, зависящие от решения судьи */}
          {renderConditionalFields()}
        </div>

        {/* ===== БЛОК 2: ПРИОСТАНОВЛЕНИЕ ПРОИЗВОДСТВА ===== */}
        <div className={styles.fieldGroup}>
          <h3 className={styles.subsectionTitle}>Приостановление производства по делу</h3>
          
          <div className={styles.field}>
            <label>Дата приостановления дела</label>
            {isEditing ? (
              <input
                type="date"
                name="date_suspension_case"
                value={formData.date_suspension_case || ''}
                onChange={(e) => handleDateChange('date_suspension_case', e.target.value)}
                className={styles.input}
              />
            ) : (
              <span>{formatDate(criminalData?.date_suspension_case)}</span>
            )}
          </div>

          <div className={styles.field}>
            <label>Причина приостановления производства</label>
            {isEditing ? (
              <select
                name="suspension_reason_code"
                value={formData.suspension_reason_code || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">Выберите причину</option>
                <option value="1">обвиняемый скрылся и место его пребывания неизвестно</option>
                <option value="2">тяжелое заболевание обвиняемого</option>
                <option value="3">запрос в Конституционный Суд РФ или принятие жалобы к рассмотрению</option>
                <option value="4">место нахождения обвиняемого известно, но реальная возможность участия отсутствует</option>
                <option value="5">призыв на военную службу в период мобилизации/военное время или заключение контракта</option>
              </select>
            ) : (
              <span>
                {formData.suspension_reason_code === '1' && 'обвиняемый скрылся и место его пребывания неизвестно'}
                {formData.suspension_reason_code === '2' && 'тяжелое заболевание обвиняемого'}
                {formData.suspension_reason_code === '3' && 'запрос в Конституционный Суд РФ или принятие жалобы к рассмотрению'}
                {formData.suspension_reason_code === '4' && 'место нахождения обвиняемого известно, но реальная возможность участия отсутствует'}
                {formData.suspension_reason_code === '5' && 'призыв на военную службу в период мобилизации/военное время или заключение контракта'}
                {!formData.suspension_reason_code && 'Не указано'}
              </span>
            )}
          </div>

          {/* Поле для текста причины, если нужно детализировать */}
          {formData.suspension_reason_code && (
            <div className={styles.field}>
              <label>Детали причины приостановления</label>
              {isEditing ? (
                <textarea
                  name="suspension_reason_text"
                  value={formData.suspension_reason_text || ''}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Введите дополнительную информацию о причине приостановления"
                />
              ) : (
                <span>{criminalData?.suspension_reason_text || 'Не указано'}</span>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label>Продолжительность приостановления (дней)</label>
            {isEditing ? (
              <input
                type="number"
                name="suspension_duration_days"
                value={formData.suspension_duration_days || ''}
                onChange={handleInputChange}
                className={styles.input}
                min="0"
              />
            ) : (
              <span>{criminalData?.suspension_duration_days || 'Не указано'}</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// =================== РЕЗУЛЬТАТ И СОСТАВ (ResultTab) ===================

export const ResultTab = ({ 
  isEditing, 
  formData, 
  options, 
  handleInputChange, 
  handleFieldChange,  // <-- ДОБАВИТЬ ЭТОТ ПАРАМЕТР
  getOptionLabel, 
  criminalData, 
  formatBoolean 
}) => (
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

        {/* Количество лиц, в отношении которых дело прекращено */}
        <div className={styles.field}>
          <label>Количество лиц, дело прекращено по нереабилитирующим основаниям</label>
          {isEditing ? (
            <input
              type="number"
              name="persons_non_rehabilitated"
              value={formData.persons_non_rehabilitated || 0}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{criminalData.persons_non_rehabilitated || 0}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Количество лиц, дело прекращено по реабилитирующим основаниям</label>
          {isEditing ? (
            <input
              type="number"
              name="persons_rehabilitated"
              value={formData.persons_rehabilitated || 0}
              onChange={handleInputChange}
              className={styles.input}
              min="0"
            />
          ) : (
            <span>{criminalData.persons_rehabilitated || 0}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Состав суда и участие в процессе</h3>
        
        <div className={styles.field}>
          <label>Без участия подсудимого (ч. 5 ст. 247 УПК РФ)</label>
          {isEditing ? (
            <select
              name="absence_defendant"
              value={formData.absence_defendant === true ? 'true' : formData.absence_defendant === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('absence_defendant', val === 'true' ? true : val === 'false' ? false : null);
              }}
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
          <label>Без участия адвоката у подсудимого</label>
          {isEditing ? (
            <select
              name="absence_lawyer"
              value={formData.absence_lawyer === true ? 'true' : formData.absence_lawyer === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('absence_lawyer', val === 'true' ? true : val === 'false' ? false : null);
              }}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{formatBoolean(criminalData.absence_lawyer)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Закрытое заседание</label>
          {isEditing ? (
            <select
              name="closed_hearing"
              value={formData.closed_hearing === true ? 'true' : formData.closed_hearing === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('closed_hearing', val === 'true' ? true : val === 'false' ? false : null);
              }}
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
          <label>Участие прокурора</label>
          {isEditing ? (
            <select
              name="participation_prosecutor"
              value={formData.participation_prosecutor === true ? 'true' : formData.participation_prosecutor === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('participation_prosecutor', val === 'true' ? true : val === 'false' ? false : null);
              }}
              className={styles.select}
            >
              <option value="">Выберите</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          ) : (
            <span>{formatBoolean(criminalData.participation_prosecutor)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Особый порядок при согласии обвиняемого</label>
          {isEditing ? (
            <select
              name="special_procedure_consent"
              value={formData.special_procedure_consent === true ? 'true' : formData.special_procedure_consent === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('special_procedure_consent', val === 'true' ? true : val === 'false' ? false : null);
              }}
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
              value={formData.special_procedure_agreement === true ? 'true' : formData.special_procedure_agreement === false ? 'false' : ''}
              onChange={(e) => {
                const val = e.target.value;
                handleFieldChange('special_procedure_agreement', val === 'true' ? true : val === 'false' ? false : null);
              }}
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

// =================== СУДЕБНОЕ РЕШЕНИЕ (AppealTab) ===================
export const AppealTab = ({
  isEditing,
  formData,
  options,
  handleInputChange,
  handleFieldChange,
  getOptionLabel,
  decisionData,
  handleDateChange,
  formatDate,
  formatBoolean
}) => (
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
              {options.appealPresent.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.appealPresent, decisionData?.appeal_present)}</span>
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
            <span>{formatDate(decisionData?.appeal_date)}</span>
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
            <span>{decisionData?.appeal_applicant || 'Не указано'}</span>
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
            <span>{decisionData?.appeal_applicant_status || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =================== СУД II ИНСТАНЦИИ (CourtInstanceTab) ===================
export const CourtInstanceTab = ({
  isEditing,
  formData,
  options,
  handleInputChange,
  handleFieldChange,
  getOptionLabel,
  decisionData,
  handleDateChange,
  formatDate,
  formatBoolean
}) => (
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
              {options.courtInstance.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.courtInstance, decisionData?.court_instance)}</span>
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
            <span>{formatDate(decisionData?.court_sent_date)}</span>
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
            <span>{formatDate(decisionData?.court_return_date)}</span>
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
            <span>{decisionData?.court_return_reason || 'Не указано'}</span>
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
            <span>{formatDate(decisionData?.court_resend_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =================== РАССМОТРЕНИЕ ВО II ИНСТАНЦИИ (ConsiderationTab) ===================
export const ConsiderationTab = ({
  isEditing,
  formData,
  options,
  handleDateChange,
  formatDate,
  decisionData,
  handleInputChange,
  handleFieldChange,
  getOptionLabel,
  formatBoolean
}) => (
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
            <span>{formatDate(decisionData?.court_consideration_date)}</span>
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
              {options.appealConsiderationResult.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.appealConsiderationResult, decisionData?.appeal_consideration_result)}</span>
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
            <span>{decisionData?.consideration_changes || 'Не указано'}</span>
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
            <span>{formatDate(decisionData?.higher_court_receipt_date)}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =================== ВСТУПЛЕНИЕ В СИЛУ И ИСПОЛНЕНИЕ (ExecutionTab) ===================
export const ExecutionTab = ({ isEditing, formData, options, handleDateChange, formatDate, decisionData, handleInputChange, handleFieldChange, getOptionLabel, formatBoolean }) => (
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
            <span>{formatDate(decisionData?.sentence_effective_date)}</span>
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
            <span>{formatDate(decisionData?.sentence_execution_date)}</span>
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
              {options.civilClaimResult.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span>{getOptionLabel(options.civilClaimResult, decisionData?.civil_claim_result)}</span>
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
            <span>{decisionData?.civil_claim_amount || 'Не указано'}</span>
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
            <span>{decisionData?.state_duty_amount || 'Не указано'}</span>
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
            <span>{decisionData?.theft_damage_amount || 'Не указано'}</span>
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
            <span>{decisionData?.other_damage_amount || 'Не указано'}</span>
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
            <span>{decisionData?.moral_damage_amount || 'Не указано'}</span>
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
            <span>{decisionData?.moral_damage_article || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =================== ОСОБЫЕ ОТМЕТКИ (SpecialMarksTab) ===================
export const SpecialMarksTab = ({ isEditing, formData, handleInputChange, decisionData, handleDateChange, handleFieldChange, formatDate, formatBoolean }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Особые отметки</h3>
        
        <div className={styles.field}>
          <label>Копия направлена 1</label>
          {isEditing ? (
            <input
              type="text"
              name="copy_sent_to_1"
              value={formData.copy_sent_to_1 || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData?.copy_sent_to_1 || 'Не указано'}</span>
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
            <span>{formatDate(decisionData?.copy_sent_date_1)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Копия направлена 2</label>
          {isEditing ? (
            <input
              type="text"
              name="copy_sent_to_2"
              value={formData.copy_sent_to_2 || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData?.copy_sent_to_2 || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата направления 2</label>
          {isEditing ? (
            <input
              type="date"
              name="copy_sent_date_2"
              value={formData.copy_sent_date_2 || ''}
              onChange={(e) => handleDateChange('copy_sent_date_2', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData?.copy_sent_date_2)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Копия направлена 3</label>
          {isEditing ? (
            <input
              type="text"
              name="copy_sent_to_3"
              value={formData.copy_sent_to_3 || ''}
              onChange={handleInputChange}
              className={styles.input}
            />
          ) : (
            <span>{decisionData?.copy_sent_to_3 || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата направления 3</label>
          {isEditing ? (
            <input
              type="date"
              name="copy_sent_date_3"
              value={formData.copy_sent_date_3 || ''}
              onChange={(e) => handleDateChange('copy_sent_date_3', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(decisionData?.copy_sent_date_3)}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <div className={styles.field}>
          <label>Дата создания записи</label>
          <span>{formatDate(decisionData?.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата последнего обновления</label>
          <span>{formatDate(decisionData?.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);

// Вставить в CriminalTabComponents.jsx после импортов

// Компонент для отображения следующих действий судьи
export const NextActionsList = ({ proceedingId, onActionExecuted }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await baseService.get(`/criminal_proceedings/criminal-proceedings/${proceedingId}/next-actions/`);
      setActions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки действий:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [proceedingId]);

  if (loading) return <div className={styles.loadingSmall}>Загрузка...</div>;
  if (!actions.length) return <p className={styles.sidebarNoData}>Нет рекомендуемых действий</p>;

  const executeAction = async (action) => {
    try {
      // Пример выполнения действия: обновить стадию или поле
      // В реальном приложении можно добавить API для выполнения конкретного действия
      if (action.id === 'make_decision_227') {
        // Открыть модалку для выбора решения
        const decision = prompt('Выберите решение: о назначении судебного заседания (3), о назначении предварительного слушания (2), о направлении по подсудности (1)');
        if (decision) {
          await CriminalCaseService.updateCriminalProceedings(proceedingId, { judge_decision: decision });
          onActionExecuted();
          fetchActions();
        }
      } else if (action.id === 'schedule_preliminary_hearing') {
        const date = prompt('Введите дату предварительного слушания (ГГГГ-ММ-ДД)');
      } else if (action.id === 'schedule_trial') {
        const date = prompt('Введите дату судебного заседания (ГГГГ-ММ-ДД)');
      } else if (action.id === 'conduct_hearing') {
        alert('Функция проведения заседания пока не реализована. Вы можете вручную добавить запись в Справочный лист.');
      } else if (action.id === 'execute_sentence') {
        const sentDate = prompt('Введите дату обращения приговора к исполнению (ГГГГ-ММ-ДД)');
        if (sentDate) {
          await CriminalCaseService.updateCriminalProceedings(proceedingId, { sentence_execution_date: sentDate });
          onActionExecuted();
          fetchActions();
        }
      }
    } catch (error) {
      console.error('Ошибка выполнения действия:', error);
      alert('Не удалось выполнить действие');
    }
  };

  return (
    <div className={styles.nextActionsList}>
      {actions.map((action, idx) => (
        <div key={idx} className={styles.nextActionItem}>
          <div className={styles.nextActionTitle}>{action.title}</div>
          <div className={styles.nextActionDescription}>{action.description}</div>
          <button onClick={() => executeAction(action)} className={styles.nextActionButton}>Выполнить</button>
        </div>
      ))}
    </div>
  );
};

// =================== КОНФИСКАЦИЯ И ШТРАФЫ ===================
export const ConfiscationAndFinesTab = ({ isEditing, formData, handleInputChange, handleFieldChange, formatBoolean, handleDateChange, formatDate }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Конфискация</h3>
        <div className={styles.field}>
          <label>Применена конфискация имущества</label>
          {isEditing ? (
            <select name="confiscation_applied" value={formData.confiscation_applied === true ? 'true' : formData.confiscation_applied === false ? 'false' : ''} onChange={(e) => handleFieldChange('confiscation_applied', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)} className={styles.select}>
              <option value="">Выберите</option><option value="true">Да</option><option value="false">Нет</option>
            </select>
          ) : <span>{formatBoolean(formData.confiscation_applied)}</span>}
        </div>
        <div className={styles.field}>
          <label>Статья УК РФ о конфискации</label>
          {isEditing ? <input type="text" name="confiscation_article" value={formData.confiscation_article || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.confiscation_article || 'Не указано'}</span>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судебный штраф</h3>
        <div className={styles.field}>
          <label>Назначен судебный штраф</label>
          {isEditing ? (
            <select name="court_fine_applied" value={formData.court_fine_applied === true ? 'true' : formData.court_fine_applied === false ? 'false' : ''} onChange={(e) => handleFieldChange('court_fine_applied', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)} className={styles.select}>
              <option value="">Выберите</option><option value="true">Да</option><option value="false">Нет</option>
            </select>
          ) : <span>{formatBoolean(formData.court_fine_applied)}</span>}
        </div>
        <div className={styles.field}>
          <label>Сумма судебного штрафа (руб.)</label>
          {isEditing ? <input type="number" step="0.01" name="court_fine_amount" value={formData.court_fine_amount || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.court_fine_amount || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Статья УК РФ о судебном штрафе</label>
          {isEditing ? <input type="text" name="court_fine_article" value={formData.court_fine_article || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.court_fine_article || 'Не указано'}</span>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Процессуальные меры и издержки</h3>
        <div className={styles.field}>
          <label>Меры процессуального принуждения</label>
          {isEditing ? <textarea name="procedural_coercion" value={formData.procedural_coercion || ''} onChange={handleInputChange} className={styles.textarea} rows={3} /> : <span>{formData.procedural_coercion || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата применения мер процессуального принуждения</label>
          {isEditing ? <input type="date" name="procedural_coercion_date" value={formData.procedural_coercion_date || ''} onChange={(e) => handleDateChange('procedural_coercion_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.procedural_coercion_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Процессуальные издержки (руб.)</label>
          {isEditing ? <input type="number" step="0.01" name="procedural_costs" value={formData.procedural_costs || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.procedural_costs || 'Не указано'}</span>}
        </div>
      </div>
    </div>
  </div>
);

// =================== ЭКСПЕРТИЗЫ И СОЕДИНЕНИЕ ===================
export const ExpertiseAndJoiningTab = ({ isEditing, formData, handleInputChange, handleDateChange, formatDate }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Соединение/выделение дел</h3>
        <div className={styles.field}>
          <label>Соединено с делом №</label>
          {isEditing ? <input type="text" name="joined_with_case" value={formData.joined_with_case || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.joined_with_case || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Выделено в дело №</label>
          {isEditing ? <input type="text" name="separated_to_case" value={formData.separated_to_case || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.separated_to_case || 'Не указано'}</span>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Экспертизы</h3>
        <div className={styles.field}>
          <label>Вид экспертизы</label>
          {isEditing ? <input type="text" name="expertise_type" value={formData.expertise_type || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.expertise_type_name || formData.expertise_type || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата направления на экспертизу</label>
          {isEditing ? <input type="date" name="expertise_sent_date" value={formData.expertise_sent_date || ''} onChange={(e) => handleDateChange('expertise_sent_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.expertise_sent_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата поступления экспертизы</label>
          {isEditing ? <input type="date" name="expertise_received_date" value={formData.expertise_received_date || ''} onChange={(e) => handleDateChange('expertise_received_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.expertise_received_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Экспертное учреждение</label>
          {isEditing ? <input type="text" name="expertise_institution" value={formData.expertise_institution || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.expertise_institution || 'Не указано'}</span>}
        </div>
      </div>
    </div>
  </div>
);

// =================== ЧАСТНЫЕ ОПРЕДЕЛЕНИЯ И ДАТЫ ===================
export const PrivateRulingsAndDatesTab = ({ isEditing, formData, handleInputChange, handleDateChange, formatDate, criminalData }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Частные определения</h3>
        <div className={styles.field}>
          <label>Количество частных определений (постановлений)</label>
          {isEditing ? <input type="number" name="private_rulings_count" value={formData.private_rulings_count || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.private_rulings_count || 'Не указано'}</span>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Важные даты</h3>
        <div className={styles.field}>
          <label>Дата сдачи дела в отдел делопроизводства</label>
          {isEditing ? <input type="date" name="case_to_office_date" value={formData.case_to_office_date || ''} onChange={(e) => handleDateChange('case_to_office_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.case_to_office_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата вступления приговора в законную силу</label>
          {isEditing ? <input type="date" name="sentence_effective_date" value={formData.sentence_effective_date || ''} onChange={(e) => handleDateChange('sentence_effective_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.sentence_effective_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата обращения приговора к исполнению</label>
          {isEditing ? <input type="date" name="sentence_execution_date" value={formData.sentence_execution_date || ''} onChange={(e) => handleDateChange('sentence_execution_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.sentence_execution_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата направления приговора для исполнения</label>
          {isEditing ? <input type="date" name="execution_sent_date" value={formData.execution_sent_date || ''} onChange={(e) => handleDateChange('execution_sent_date', e.target.value)} className={styles.input} /> : <span>{formatDate(formData.execution_sent_date)}</span>}
        </div>
        <div className={styles.field}>
          <label>Куда направлен приговор для исполнения</label>
          {isEditing ? <input type="text" name="execution_sent_to" value={formData.execution_sent_to || ''} onChange={handleInputChange} className={styles.input} /> : <span>{formData.execution_sent_to || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Дата сдачи в архив</label>
          {isEditing ? <input type="date" name="archived_date" value={formData.archived_date || ''} onChange={(e) => handleDateChange('archived_date', e.target.value)} className={styles.input} /> : <span>{formatDate(criminalData?.archived_date)}</span>}
        </div>
      </div>
    </div>
  </div>
);

// =================== ДОПОЛНИТЕЛЬНО (оставшиеся поля) ===================
export const AdditionalTab = ({ isEditing, formData, handleInputChange, criminalData, handleDateChange, formatDate, formatBoolean, isArchived }) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Особые отметки</h3>
        <div className={styles.field}>
          <label>Другие отметки</label>
          {isEditing ? <textarea name="other_notes" value={formData.other_notes || ''} onChange={handleInputChange} className={styles.textarea} rows={3} /> : <span>{criminalData?.other_notes || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Особые отметки</label>
          {isEditing ? <textarea name="special_notes" value={formData.special_notes || ''} onChange={handleInputChange} className={styles.textarea} rows={3} /> : <span>{criminalData?.special_notes || 'Не указано'}</span>}
        </div>
        <div className={styles.field}>
          <label>Архивные примечания</label>
          {isEditing ? <textarea name="archive_notes" value={formData.archive_notes || ''} onChange={handleInputChange} className={styles.textarea} rows={3} /> : <span>{criminalData?.archive_notes || 'Не указано'}</span>}
        </div>
      </div>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        <div className={styles.field}>
          <label>Дата создания записи</label>
          <span>{formatDate(criminalData?.created_at)}</span>
        </div>
        <div className={styles.field}>
          <label>Дата последнего обновления</label>
          <span>{formatDate(criminalData?.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);
