import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import styles from './CriminalDetail.module.css';

const CriminalDetail = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [criminalData, setCriminalData] = useState(null);
  const [defendants, setDefendants] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCriminalDetails = async () => {
      try {
        setLoading(true);
        
        // Получаем данные уголовного дела
        const criminalResponse = await CriminalCaseService.getByBusinessCardId(cardId);
        
        if (criminalResponse) {
          setCriminalData(criminalResponse);
          setFormData(criminalResponse);
          
          // Получаем обвиняемых
          const defendantsResponse = await CriminalCaseService.getDefendants(cardId);
          
          // Получаем названия сторон для каждого обвиняемого
          const defendantsWithSideNames = await Promise.all(
            defendantsResponse.map(async (defendant) => {
              if (defendant.side_case) {
                try {
                  const sideResponse = await baseService.get(`/business_card/sides/${defendant.side_case}/`);
                  return {
                    ...defendant,
                    side_case_name: sideResponse.data.sides_case
                  };
                } catch (error) {
                  console.error('Ошибка загрузки названия стороны:', error);
                  return { ...defendant, side_case_name: 'Неизвестный статус' };
                }
              }
              return defendant;
            })
          );
          
          setDefendants(defendantsWithSideNames);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки данных уголовного дела:', err);
        setError('Не удалось загрузить данные уголовного дела');
        setLoading(false);
      }
    };

    fetchCriminalDetails();
  }, [cardId]);

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};

const handleSave = async () => {
  try {
    setSaving(true);
    
    // Убедитесь, что отправляете только нужные данные
    const dataToSend = { ...formData };
    // Удалите ненужные поля, которые могут быть в форме
    delete dataToSend.defendants;
    delete dataToSend.criminal_decisions;
    delete dataToSend.id;
    
    console.log('Saving criminal data:', dataToSend);
    
    const updatedData = await CriminalCaseService.update(cardId, dataToSend);
    console.log('Update successful:', updatedData);
    
    setCriminalData(updatedData);
    setFormData(updatedData);
    setIsEditing(false);
    setSaving(false);
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    console.error('Error details:', err.response?.data);
    setError('Не удалось сохранить данные');
    setSaving(false);
  }
};

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({
      ...prev,
      [name]: dateString || null
    }));
  };

  const handleCancel = () => {
    setFormData(criminalData);
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatBoolean = (value) => {
    return value ? 'Да' : 'Нет';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных уголовного дела...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

  if (!criminalData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Уголовное дело не найдено</div>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
      </div>
    );
  }

    return (
    <div className={styles.container}>
        <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
        </button>
        <h1 className={styles.title}>Уголовное производство</h1>
        
        {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
            Редактировать
            </button>
        ) : (
            <div className={styles.editActions}>
            <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
                Отменить
            </button>
            </div>
        )}
        </div>

        <div className={styles.content}>
        {/* Левая колонка - основные разделы */}
        <div className={styles.mainSections}>
            {/* Раздел А. Сведения по делу */}
            <div className={styles.section}>
            <h2 className={styles.sectionTitle}>А. Сведения по делу</h2>
            
            <div className={styles.grid}>
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

                {/* Добавьте остальные поля из раздела А аналогичным образом */}
                <div className={styles.field}>
                <label>Откуда поступило</label>
                {isEditing ? (
                    <input
                    type="text"
                    name="incoming_from"
                    value={formData.incoming_from || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    />
                ) : (
                    <span>{criminalData.incoming_from || 'Не указано'}</span>
                )}
                </div>

                <div className={styles.field}>
                <label>Порядок поступления дела</label>
                {isEditing ? (
                    <input
                    type="text"
                    name="case_order"
                    value={formData.case_order || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    />
                ) : (
                    <span>{criminalData.case_order || 'Не указано'}</span>
                )}
                </div>

                {/* Продолжайте добавлять остальные поля... */}
            </div>
            </div>

            {/* Раздел C. Приговор и исполнение */}
            <div className={styles.section}>
            <h2 className={styles.sectionTitle}>C. Приговор и исполнение</h2>
            
            <div className={styles.grid}>
                <div className={styles.field}>
                <label>Дата вынесения приговора</label>
                {isEditing ? (
                    <input
                    type="date"
                    name="sentence_date"
                    value={formData.sentence_date || ''}
                    onChange={(e) => handleDateChange('sentence_date', e.target.value)}
                    className={styles.input}
                    />
                ) : (
                    <span>{formatDate(criminalData.sentence_date)}</span>
                )}
                </div>

                <div className={styles.field}>
                <label>Результат рассмотрения</label>
                {isEditing ? (
                    <input
                    type="text"
                    name="sentence_result"
                    value={formData.sentence_result || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    />
                ) : (
                    <span>{criminalData.sentence_result || 'Не указано'}</span>
                )}
                </div>

                {/* Добавьте остальные поля из раздела C */}
            </div>
            </div>
        </div>

        {/* Правая колонка - обвиняемые и особые отметки */}
        <div className={styles.sideSections}>
            {/* Раздел Б. Обвиняемые */}
            <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Б. Обвиняемые</h2>
            
            {defendants.length > 0 ? (
                <div className={styles.defendantsList}>
                {defendants.map(defendant => (
                    <div key={defendant.id} className={styles.defendantItem}>
                    <h4>{defendant.full_name}</h4>
                    <p>Статус: {defendant.side_case_name}</p>
                    <p>Адрес: {defendant.address || 'Не указан'}</p>
                    <p>Дата рождения: {defendant.birth_date ? formatDate(defendant.birth_date) : 'Не указана'}</p>
                    {/* Добавьте остальные поля обвиняемого */}
                    </div>
                ))}
                </div>
            ) : (
                <p>Обвиняемые не добавлены</p>
            )}
            </div>

            {/* Особые отметки */}
            <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Особые отметки</h2>
            
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
                <span>{criminalData.special_notes || 'Не указано'}</span>
                )}
            </div>
            </div>
        </div>
        </div>
    </div>
    );
};

export default CriminalDetail;