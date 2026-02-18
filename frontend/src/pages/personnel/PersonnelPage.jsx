import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ru from 'date-fns/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './PersonnelPage.module.css';
import baseService from '../../API/baseService';

const locales = { ru };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const PersonnelPage = () => {
  const [judges, setJudges] = useState([]);
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    user: '',
    absence_type: '',
    start_date: '',
    end_date: '',
    block_start_date: '',
    block_end_date: '',
    reason: '',
  });

  // Загрузка данных
  useEffect(() => {
    fetchJudges();
    fetchAbsenceTypes();
    fetchAbsenceRecords();
  }, []);

  const fetchJudges = async () => {
    try {
      console.log('Запрос к /personnel/judges/');
      const res = await baseService.get('/personnel/judges/');
      console.log('Статус ответа:', res.status);
      console.log('Данные:', res.data);
      setJudges(res.data);
    } catch (e) {
      console.error('Ошибка загрузки судей');
      console.error('Статус ошибки:', e.response?.status);
      console.error('Текст ошибки:', e.response?.data);
      console.error('Полная ошибка:', e);
    }
  };

  const fetchAbsenceTypes = async () => {
    try {
      console.log('Запрос к /personnel/absence-types/');
      const res = await baseService.get('/personnel/absence-types/');
      console.log('Ответ от absence-types:', res.data);
      
      // Проверяем, есть ли пагинация (поле results)
      if (res.data && res.data.results) {
        setAbsenceTypes(res.data.results);
      } else if (Array.isArray(res.data)) {
        // Если это уже массив
        setAbsenceTypes(res.data);
      } else {
        console.error('Неожиданный формат данных:', res.data);
        setAbsenceTypes([]);
      }
    } catch (e) {
      console.error('Ошибка загрузки типов отсутствий', e);
      setAbsenceTypes([]);
    }
  };

  const fetchAbsenceRecords = async (userId = '') => {
    try {
      const url = userId ? `/personnel/absence-records/?user_id=${userId}` : '/personnel/absence-records/';
      console.log('Запрос к', url);
      const res = await baseService.get(url);
      console.log('Ответ от absence-records:', res.data);
      
      if (res.data && res.data.results) {
        setAbsenceRecords(res.data.results);
      } else if (Array.isArray(res.data)) {
        setAbsenceRecords(res.data);
      } else {
        setAbsenceRecords(res.data);
      }
    } catch (e) {
      console.error('Ошибка загрузки записей', e);
      setAbsenceRecords([]);
    }
  };

  // Преобразование записей в события для календаря
  const events = Array.isArray(absenceRecords) ? absenceRecords.map(record => ({
    id: record.id,
    title: `${record.user_name || 'Судья'} — ${record.absence_type_name || 'Отсутствие'}`,
    start: new Date(record.block_start_date),
    end: new Date(record.block_end_date),
    resource: record,
    color: record.absence_type_color || '#3498db',
  })) : [];

  // Обработчики формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateForm = () => {
    setEditingRecord(null);
    setFormData({
      user: selectedJudge?.id || '',
      absence_type: '',
      start_date: '',
      end_date: '',
      block_start_date: '',
      block_end_date: '',
      reason: '',
    });
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    setFormData({
      user: record.user,
      absence_type: record.absence_type,
      start_date: record.start_date.slice(0,10),
      end_date: record.end_date.slice(0,10),
      block_start_date: record.block_start_date.slice(0,10),
      block_end_date: record.block_end_date.slice(0,10),
      reason: record.reason || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await baseService.patch(`/personnel/absence-records/${editingRecord.id}/`, formData);
      } else {
        await baseService.post('/personnel/absence-records/', formData);
      }
      setShowForm(false);
      fetchAbsenceRecords(selectedJudge?.id);
    } catch (error) {
      console.error('Ошибка сохранения', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить запись?')) {
      try {
        await baseService.delete(`/personnel/absence-records/${id}/`);
        fetchAbsenceRecords(selectedJudge?.id);
      } catch (error) {
        console.error('Ошибка удаления', error);
      }
    }
  };

  // Обработка клика по событию
  const handleSelectEvent = (event) => {
    if (event.resource) {
      openEditForm(event.resource);
    }
  };

  // Фильтр по судье
  const handleJudgeFilter = (e) => {
    const judgeId = e.target.value;
    setSelectedJudge(judgeId ? { id: judgeId } : null);
    fetchAbsenceRecords(judgeId);
  };

  // Фильтр для выбора судьи в форме
  const handleFormJudgeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getJudgeFullName = (judge) => {
    const parts = [];
    if (judge.last_name) parts.push(judge.last_name);
    if (judge.first_name) parts.push(judge.first_name);
    if (judge.middle_name) parts.push(judge.middle_name);
    return parts.join(' ') || judge.username || 'Без имени';
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Кадры — график отсутствия судей</h1>

      <div className={styles.controls}>
        <select onChange={handleJudgeFilter} className={styles.select} value={selectedJudge?.id || ''}>
          <option value="">Все судьи</option>
          {judges.map(judge => (
            <option key={judge.id} value={judge.id}>
              {getJudgeFullName(judge)}
            </option>
          ))}
        </select>
        <button onClick={openCreateForm} className={styles.addButton}>+ Добавить отсутствие</button>
      </div>

      {/* Календарь */}
      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          popup
          selectable
          onSelectEvent={handleSelectEvent}
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.color, border: 'none', color: '#fff' }
          })}
          messages={{
            next: 'След.',
            previous: 'Пред.',
            today: 'Сегодня',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
          }}
        />
      </div>

      {/* Форма создания/редактирования (модальное окно) */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingRecord ? 'Редактировать' : 'Новая запись'}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Судья
                <select name="user" value={formData.user} onChange={handleFormJudgeChange} required>
                  <option value="">Выберите судью</option>
                  {judges.map(judge => (
                    <option key={judge.id} value={judge.id}>
                      {getJudgeFullName(judge)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Тип отсутствия
                <select name="absence_type" value={formData.absence_type} onChange={handleInputChange} required>
                  <option value="">Выберите тип</option>
                  {absenceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Дата начала отсутствия
                <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
              </label>
              <label>
                Дата окончания отсутствия
                <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
              </label>
              <label>
                Начало блокировки (авто, можно изменить)
                <input type="date" name="block_start_date" value={formData.block_start_date} onChange={handleInputChange} />
              </label>
              <label>
                Окончание блокировки (авто, можно изменить)
                <input type="date" name="block_end_date" value={formData.block_end_date} onChange={handleInputChange} />
              </label>
              <label>
                Примечание
                <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows="2" />
              </label>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveBtn}>Сохранить</button>
                <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>Отмена</button>
                {editingRecord && (
                  <button type="button" onClick={() => handleDelete(editingRecord.id)} className={styles.deleteBtn}>Удалить</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelPage;