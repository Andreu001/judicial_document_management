import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import baseService from '../../API/baseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import CriminalDecisionForm from '../CriminalCase/CriminalDecisionForm';
import styles from './CriminalDecisionDetail.module.css';

const CriminalDecisionDetail = () => {
  const { cardId, decisionId } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState(null);
  const [defendants, setDefendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [decisionData, setDecisionData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDecisionDetails();
    fetchDefendants();
  }, [cardId, decisionId]);

  const fetchDecisionDetails = async () => {
    try {
      setLoading(true);
      
      const decisionData = await CriminalCaseService.getDecisionById(cardId, decisionId);
      
      if (decisionData.name_case) {
        try {
          const decisionResponse = await baseService.get(`/business_card/decisions/${decisionData.name_case}/`);
          decisionData.decision_name = decisionResponse.data.decisions;
        } catch (decisionError) {
          console.error('Ошибка загрузки названия решения:', decisionError);
          decisionData.decision_name = 'Неизвестное решение';
        }
      }

      if (decisionData.decision_appeal) {
        try {
          const appealResponse = await baseService.get(`/business_card/appeals/${decisionData.decision_appeal}/`);
          decisionData.appeal_name = appealResponse.data.appeal;
        } catch (appealError) {
          console.error('Ошибка загрузки названия апелляции:', appealError);
          decisionData.appeal_name = 'Неизвестный результат';
        }
      }

      setDecision(decisionData);
      setDecisionData(decisionData);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки данных решения:', err);
      setError('Не удалось загрузить данные решения');
      setLoading(false);
    }
  };

  const fetchDefendants = async () => {
    try {
      const defendantsResponse = await CriminalCaseService.getDefendants(cardId);
      
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
    } catch (err) {
      console.error('Ошибка загрузки обвиняемых:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (data) => {
    try {
      setSaving(true);
      
      const updatedDecision = await CriminalCaseService.updateDecision(
        cardId, 
        decisionId, 
        data
      );

      if (updatedDecision.name_case) {
        try {
          const decisionResponse = await baseService.get(`/business_card/decisions/${updatedDecision.name_case}/`);
          updatedDecision.decision_name = decisionResponse.data.decisions;
        } catch (decisionError) {
          console.error('Ошибка загрузки названия решения:', decisionError);
          updatedDecision.decision_name = 'Неизвестное решение';
        }
      }

      if (updatedDecision.decision_appeal) {
        try {
          const appealResponse = await baseService.get(`/business_card/appeals/${updatedDecision.decision_appeal}/`);
          updatedDecision.appeal_name = appealResponse.data.appeal;
        } catch (appealError) {
          console.error('Ошибка загрузки названия апелляции:', appealError);
          updatedDecision.appeal_name = 'Неизвестный результат';
        }
      }

      setDecision(updatedDecision);
      setDecisionData(updatedDecision);
      setIsEditing(false);
      setSaving(false);
      
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
      alert('Не удалось сохранить изменения');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDecisionData(decision);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const getCourtInstanceText = (instance) => {
    switch (instance) {
      case '1': return 'Апелляционной';
      case '2': return 'Кассационной';
      default: return 'Не указано';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          Назад
        </button>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Решение не найдено</div>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Заголовок с кнопками */}
      <div className={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          ← Назад
        </button>
        <h1 className={styles.title}>Решение по уголовному делу</h1>
        
        {!isEditing ? (
          <button onClick={handleEdit} className={styles.editButton}>
            Редактировать
          </button>
        ) : (
          <div className={styles.editActions}>
            <button 
              onClick={() => handleSave(decisionData)} 
              className={styles.saveButton} 
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Отменить
            </button>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Основной контент */}
        <div className={styles.mainContent}>
          {isEditing ? (
            <div className={styles.editForm}>
              <CriminalDecisionForm
                decisionData={decisionData}
                onDecisionDataChange={setDecisionData}
                onCancel={handleCancel}
                onSubmit={handleSave}
              />
            </div>
          ) : (
            <div className={styles.card}>
              {/* Основная информация */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Основные данные</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Решение:</span>
                    <span className={styles.value}>{decision.decision_name || 'Не указано'}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Дата поступления апелляции:</span>
                    <span className={styles.value}>{formatDate(decision.appeal_date)}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Заявитель апелляции:</span>
                    <span className={styles.value}>{decision.appeal_applicant || 'Не указано'}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Процессуальное положение:</span>
                    <span className={styles.value}>{decision.appeal_applicant_status || 'Не указано'}</span>
                  </div>
                </div>
              </div>

              {/* Информация о суде II инстанции */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Суд II инстанции</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Суд:</span>
                    <span className={styles.value}>{getCourtInstanceText(decision.court_instance)}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Дата направления:</span>
                    <span className={styles.value}>{formatDate(decision.court_sent_date)}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Дата возвращения:</span>
                    <span className={styles.value}>{formatDate(decision.court_return_date)}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Причина возвращения:</span>
                    <span className={styles.value}>{decision.court_return_reason || 'Не указано'}</span>
                  </div>
                </div>
              </div>

              {/* Результаты рассмотрения */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Результаты рассмотрения</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Дата рассмотрения:</span>
                    <span className={styles.value}>{formatDate(decision.court_consideration_date)}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Результат:</span>
                    <span className={styles.value}>{decision.appeal_name || 'Не указано'}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Сущность изменений:</span>
                    <span className={styles.value}>{decision.consideration_changes || 'Не указано'}</span>
                  </div>
                </div>
              </div>

              {/* Идентификаторы */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Идентификаторы</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>ID решения:</span>
                    <span className={styles.value}>{decision.id}</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.label}>ID дела:</span>
                    <span className={styles.value}>{cardId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Боковая панель с обвиняемыми */}
        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <h3 className={styles.sideTitle}>Обвиняемые по делу</h3>
            {defendants.length > 0 ? (
              <div className={styles.defendantsList}>
                {defendants.map(defendant => (
                  <div key={defendant.id} className={styles.defendantItem}>
                    <h4>{defendant.full_name}</h4>
                    <p>Статус: {defendant.side_case_name}</p>
                    <p>Адрес: {defendant.address || 'Не указан'}</p>
                    <p>Дата рождения: {defendant.birth_date ? formatDate(defendant.birth_date) : 'Не указана'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noDefendants}>Обвиняемые не добавлены</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalDecisionDetail;