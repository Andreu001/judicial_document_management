import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyInput from '../../components/UI/input/MyInput';
import MyButton from '../../components/UI/button/MyButton';
import { updateConsidered } from '../../API/ConsideredService';
import styles from '../../components/UI/input/Input.module.css';
import baseService from '../../API/baseService';

const ConsideredForm = ({ create, editConsideredData = {}, onSave, onCancel, cardId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingConsideredId, setEditingConsideredId] = useState(null);
  const [decisionsList, setDecisionsList] = useState([]);
  const [sidesCaseList, setSidesCaseList] = useState([]);

  const [considered, setConsidered] = useState({
    name_case: [],
    date_consideration: '',
    effective_date: '',
    notification_parties: [],
    executive_lists: '',
  });

  useEffect(() => {
    baseService
      .get(`http://localhost:8000/business_card/decisions/`)
      .then((response) => {
        setDecisionsList(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке решений по делу:', error);
      });

    baseService
      .get(`http://localhost:8000/business_card/businesscard/${cardId}/sidescaseincase/`)
      .then((response) => {
        setSidesCaseList(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке списка сторон:', error);
      });

    if (editConsideredData) {
      setIsEditing(true);
      setConsidered({
        name_case: editConsideredData.name_case || [],
        date_consideration: editConsideredData.date_consideration || '',
        effective_date: editConsideredData.effective_date || '',
        notification_parties: editConsideredData.notification_parties || [],
        executive_lists: editConsideredData.executive_lists || '',
      });
      setEditingConsideredId(editConsideredData.id);
    }
  }, [cardId, editConsideredData]);

  const handleCancel = () => {
    setIsEditing(false);
    onCancel();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setConsidered((prevConsidered) => {
      if (name === 'name_case' || name === 'notification_parties') {
        return {
          ...prevConsidered,
          [name]: value ? [parseInt(value, 10)] : [],
        };
      }
      return {
        ...prevConsidered,
        [name]: value,
      };
    });
  };

  const formatDate = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return null;
    return parsedDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newConsideredData = {
      name_case: considered.name_case.map((id) => id),
      date_consideration: formatDate(considered.date_consideration),
      effective_date: formatDate(considered.effective_date),
      notification_parties: considered.notification_parties.map((id) => id),
      executive_lists: formatDate(considered.executive_lists),
      business_card: cardId,
    };

    console.log('Отправка данных:', newConsideredData);

    try {
      let response;
      if (editingConsideredId) {
        response = await updateConsidered(cardId, editingConsideredId, newConsideredData);
        onSave(response.data);
      } else {
        response = await baseService.post(
          `http://localhost:8000/business_card/businesscard/${cardId}/considered/`,
          newConsideredData
        );
        create(response.data);
      }

      onCancel();
      setConsidered({
        name_case: [],
        date_consideration: '',
        effective_date: '',
        notification_parties: [],
        executive_lists: '',
      });
    } catch (error) {
      console.error('Ошибка при отправке данных:', error.message);
      console.error('Дополнительные сведения:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Решение по делу</label>
          <select name="name_case" value={considered.name_case[0] || ''} onChange={handleChange}>
            <option value="">Выберите решение</option>
            {decisionsList.map((decision) => (
              <option key={decision.id} value={decision.id}>
                {decision.name_case}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Дата рассмотрения</label>
          <MyInput
            type="date"
            name="date_consideration"
            value={considered.date_consideration}
            onChange={handleChange}
            placeholder="Дата рассмотрения"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Дата вступления в законную силу</label>
          <MyInput
            type="date"
            name="effective_date"
            value={considered.effective_date}
            onChange={handleChange}
            placeholder="Дата вступления"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Уведомленные стороны</label>
          <select name="notification_parties" value={considered.notification_parties[0] || ''} onChange={handleChange}>
            <option value="">Выберите сторону</option>
            {sidesCaseList.map((side) => (
              <option key={side.id} value={side.id}>
                {side.name} ({side.sides_case_name})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Дата исполнения</label>
          <MyInput
            type="date"
            name="executive_lists"
            value={considered.executive_lists}
            onChange={handleChange}
            placeholder="Дата исполнения"
          />
        </div>

        {isEditing ? (
          <>
            <MyButton type="submit">Сохранить</MyButton>
            <MyButton type="button" onClick={handleCancel}>
              Отменить
            </MyButton>
          </>
        ) : null}
      </form>
    </div>
  );
};

export default ConsideredForm;
