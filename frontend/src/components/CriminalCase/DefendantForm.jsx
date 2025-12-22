import React, { useState, useEffect } from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './DefendantForm.module.css';
import baseService from '../../API/baseService';

const DefendantForm = ({ defendantData, onDefendantDataChange, onCancel, onSubmit }) => {
  const [sidesCaseList, setSidesCaseList] = useState([]);
  const [selectedSideCase, setSelectedSideCase] = useState(defendantData.side_case || '');
  const [defendantOptions, setDefendantOptions] = useState({
    sex: [],
    restraint_measure: []
  });

  useEffect(() => {
    // Загружаем список сторон по делу
    baseService.get('http://localhost:8000/business_card/sides/')
      .then((response) => {
        setSidesCaseList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching sides list:', error);
      });

    // Загружаем опции для полей defendant из бэкенда
    baseService.get('http://localhost:8000/criminal_proceedings/defendant-options/')
      .then((response) => {
        setDefendantOptions(response.data);
      })
      .catch((error) => {
        console.error('Error fetching defendant options:', error);
        // Значения по умолчанию на основе models.py
        setDefendantOptions({
          sex: [
            { value: '1', label: 'мужской' },
            { value: '2', label: 'женский' }
          ],
          restraint_measure: [
            { value: '0', label: 'не избиралась' },
            { value: '1', label: 'подписка о невыезде' },
            { value: '2', label: 'личное поручительство' },
            { value: '3', label: 'наблюдение командования воинской части' },
            { value: '4', label: 'присмотр за несовершеннолетним подозреваемым (обвиняемым)' },
            { value: '5', label: 'залог' },
            { value: '6', label: 'домашний арест' },
            { value: '7', label: 'заключение под стражу' },
            { value: '8', label: 'запрет определенных действий' }
          ]
        });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'side_case') {
      setSelectedSideCase(value);
    }
    
    onDefendantDataChange({
      ...defendantData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(defendantData);
  };

  return (
    <div className={styles.defendantForm}>
      <h4>Данные обвиняемого</h4>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>ФИО обвиняемого *</label>
            <MyInput
              type="text"
              name="full_name"
              value={defendantData.full_name || ''}
              onChange={handleChange}
              placeholder="ФИО обвиняемого"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Сторона по делу *</label>
            <select 
              name="side_case" 
              value={selectedSideCase} 
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Выберите сторону по делу</option>
              {sidesCaseList.map((sideCase, index) => (
                <option key={index} value={sideCase.id}>
                  {sideCase.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата рождения</label>
            <MyInput
              type="date"
              name="birth_date"
              value={defendantData.birth_date || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Пол</label>
            <select 
              name="sex" 
              value={defendantData.sex || ''} 
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Выберите пол</option>
              {defendantOptions.sex.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Адрес проживания</label>
            <MyInput
              type="text"
              name="address"
              value={defendantData.address || ''}
              onChange={handleChange}
              placeholder="Адрес проживания"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Гражданство</label>
            <MyInput
              type="text"
              name="citizenship"
              value={defendantData.citizenship || ''}
              onChange={handleChange}
              placeholder="Гражданство"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Статья *</label>
          <MyInput
            type="number"
            name="article"
            value={defendantData.article || ''}
            onChange={handleChange}
            placeholder="Статья УК РФ"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Максимальное наказание по статье *</label>
          <MyInput
            type="number"
            name="maximum_penalty_article"
            value={defendantData.maximum_penalty_article || ''}
            onChange={handleChange}
            placeholder="Максимальное наказание по статье"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Мера пресечения</label>
            <select 
              name="restraint_measure" 
              value={defendantData.restraint_measure || ''} 
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">Выберите меру пресечения</option>
              {defendantOptions.restraint_measure.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Дата избрания меры пресечения</label>
            <MyInput
              type="date"
              name="restraint_date"
              value={defendantData.restraint_date || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            Сохранить
          </button>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Отменить
          </button>
        </div>
      </form>
    </div>
  );
};

export default DefendantForm;