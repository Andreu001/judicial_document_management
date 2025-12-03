import React, { useState } from 'react';
import MyInput from '../UI/input/MyInput';
import styles from './MovementForm.module.css';

const MovementForm = ({ movementData, onMovementDataChange, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    hearing_date: movementData.hearing_date || '',
    hearing_time: movementData.hearing_time || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedData);
    
    // Передаем обновленные данные родителю
    if (onMovementDataChange) {
      onMovementDataChange(updatedData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className={styles.movementForm}>
      <h4>Данные движения дела</h4>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата заседания *</label>
            <MyInput
              type="date"
              name="hearing_date"
              value={formData.hearing_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Время заседания</label>
            <MyInput
              type="time"
              name="hearing_time"
              value={formData.hearing_time}
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

export default MovementForm;