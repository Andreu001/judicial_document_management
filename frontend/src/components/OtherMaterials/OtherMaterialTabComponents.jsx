// components/OtherMaterial/OtherMaterialTabComponents.jsx
import React from 'react';
import styles from './OtherMaterialDetail.module.css';

export const BasicInfoTab = ({ 
  isEditing, 
  formData, 
  options, 
  materialData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived,
  responsiblePersons = []
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Регистрационные данные</h3>
        
        <div className={styles.field}>
          <label>Регистрационный номер</label>
          <span>{materialData?.registration_number || 'Не указано'}</span>
        </div>

        <div className={styles.field}>
          <label>Дата регистрации</label>
          {isEditing ? (
            <input
              type="date"
              name="registration_date"
              value={formData.registration_date || ''}
              onChange={(e) => handleDateChange('registration_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(materialData?.registration_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Наименование материала</label>
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Введите наименование"
            />
          ) : (
            <span>{materialData?.title || 'Не указано'}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Описание/содержание</label>
          {isEditing ? (
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={4}
              placeholder="Краткое описание содержания материала"
            />
          ) : (
            <span>{materialData?.description || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Сведения о поступлении</h3>
        
        <div className={styles.field}>
          <label>Входящий номер</label>
          {isEditing ? (
            <input
              type="text"
              name="incoming_number"
              value={formData.incoming_number || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Входящий номер документа"
            />
          ) : (
            <span>{materialData?.incoming_number || 'Не указано'}</span>
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
            <span>{formatDate(materialData?.incoming_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Отправитель</label>
          {isEditing ? (
            <input
              type="text"
              name="sender"
              value={formData.sender || ''}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="От кого поступил материал"
            />
          ) : (
            <span>{materialData?.sender || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Судья</h3>
        
        <div className={styles.field}>
          <label>Судья</label>
          {isEditing ? (
            <select
              name="responsible_person"
              value={formData.responsible_person || ''}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Выберите судью</option>
              {responsiblePersons.map(person => (
                <option key={person.id} value={person.id}>
                  {person.full_name} ({person.role_display})
                </option>
              ))}
            </select>
          ) : (
            <span>{materialData?.responsible_person_full_name || 'Не указано'}</span>
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
  materialData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Рассмотрение материала</h3>
        
        <div className={styles.field}>
          <label>Дата рассмотрения</label>
          {isEditing ? (
            <input
              type="date"
              name="consideration_date"
              value={formData.consideration_date || ''}
              onChange={(e) => handleDateChange('consideration_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(materialData?.consideration_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Результат рассмотрения</label>
          {isEditing ? (
            <textarea
              name="consideration_result"
              value={formData.consideration_result || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={4}
              placeholder="Результат рассмотрения материала, принятые решения"
            />
          ) : (
            <span>{materialData?.consideration_result || 'Не указано'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const AdditionalInfoTab = ({ 
  isEditing, 
  formData, 
  materialData, 
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
            <span>{materialData?.special_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Архивные данные</h3>
        
        <div className={styles.field}>
          <label>Статус</label>
          {isEditing ? (
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="active">Активное</option>
              <option value="completed">Завершено</option>
              <option value="archived">В архиве</option>
            </select>
          ) : (
            <span>{materialData?.status_display || materialData?.status || 'Не указано'}</span>
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
            <span>{formatDate(materialData?.archived_date)}</span>
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
            <span>{materialData?.archive_notes || 'Нет'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Системная информация</h3>
        
        <div className={styles.field}>
          <label>Дата создания</label>
          <span>{formatDateTime(materialData?.created_at)}</span>
        </div>

        <div className={styles.field}>
          <label>Дата обновления</label>
          <span>{formatDateTime(materialData?.updated_at)}</span>
        </div>
      </div>
    </div>
  </div>
);

export const DecisionTab = ({ 
  isEditing, 
  formData, 
  options, 
  materialData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Результат рассмотрения</h3>
        
        <div className={styles.field}>
          <label>Результат рассмотрения</label>
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
            <span>{getOptionLabel(options.outcome, materialData?.outcome)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата вынесения решения</label>
          {isEditing ? (
            <input
              type="date"
              name="decision_date"
              value={formData.decision_date || ''}
              onChange={(e) => handleDateChange('decision_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(materialData?.decision_date)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Дата вступления в силу</label>
          {isEditing ? (
            <input
              type="date"
              name="decision_effective_date"
              value={formData.decision_effective_date || ''}
              onChange={(e) => handleDateChange('decision_effective_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(materialData?.decision_effective_date)}</span>
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
              <label>Результат обжалования</label>
              {isEditing ? (
                <select
                  name="complaint_result"
                  value={formData.complaint_result || ''}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="">Выберите результат</option>
                  <option value="1">Оставлено без изменения</option>
                  <option value="2">Отменено</option>
                  <option value="3">Изменено</option>
                </select>
              ) : (
                <span>
                  {materialData?.complaint_result === '1' && 'Оставлено без изменения'}
                  {materialData?.complaint_result === '2' && 'Отменено'}
                  {materialData?.complaint_result === '3' && 'Изменено'}
                  {!materialData?.complaint_result && 'Не указано'}
                </span>
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
  materialData, 
  handleDateChange, 
  handleInputChange, 
  getOptionLabel, 
  formatDate, 
  isArchived 
}) => (
  <div className={styles.tabContent}>
    <div className={styles.tabGrid}>
      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Исполнительный документ</h3>
        
        <div className={styles.field}>
          <label>Дата исполнительного документа</label>
          {isEditing ? (
            <input
              type="date"
              name="execution_document_date"
              value={formData.execution_document_date || ''}
              onChange={(e) => handleDateChange('execution_document_date', e.target.value)}
              className={styles.input}
            />
          ) : (
            <span>{formatDate(materialData?.execution_document_date)}</span>
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
            <span>{materialData?.execution_document_number || 'Не указано'}</span>
          )}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <h3 className={styles.subsectionTitle}>Исполнение</h3>
        
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="executed"
              checked={formData.executed || false}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
            Исполнено
          </label>
        </div>

        {formData.executed && (
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
              <span>{formatDate(materialData?.execution_date)}</span>
            )}
          </div>
        )}

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
            <span>{getOptionLabel(options.executionResult, materialData?.execution_result)}</span>
          )}
        </div>

        <div className={styles.field}>
          <label>Примечания по исполнению</label>
          {isEditing ? (
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
          ) : (
            <span>{materialData?.notes || 'Нет'}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);