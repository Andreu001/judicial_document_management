import React, { useState, useEffect } from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './DefendantForm.module.css';
import baseService from '../../API/baseService';

const DefendantForm = ({ defendantData, onDefendantDataChange, onCancel, onSubmit }) => {
  const [sidesCaseList, setSidesCaseList] = useState([]);
  const [selectedSideCase, setSelectedSideCase] = useState(defendantData.side_case || '');

  useEffect(() => {
    // Загружаем список сторон по делу
    baseService
      .get('http://localhost:8000/business_card/sides/')
      .then((response) => {
        setSidesCaseList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching sides list:', error);
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
                  {sideCase.sides_case}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Остальные поля формы остаются без изменений */}
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
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
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

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Мера пресечения</label>
            <MyInput
              type="text"
              name="restraint_measure"
              value={defendantData.restraint_measure || ''}
              onChange={handleChange}
              placeholder="Мера пресечения"
            />
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