// CaseViewOnly.jsx - исправленная версия

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CriminalCaseService from '../../API/CriminalCaseService';
import CivilCaseService from '../../API/CivilCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import KasCaseService from '../../API/KasCaseService';
import styles from './CaseViewOnly.module.css';

const CaseViewOnly = () => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCaseData();
  }, [caseType, caseId]);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      let data = null;
      
      // Нормализуем тип дела
      const normalizedType = caseType?.toLowerCase();
      
      switch (normalizedType) {
        case 'criminal':
        case 'criminal-proceedings':
          data = await CriminalCaseService.getCriminalProceedingById(caseId);
          break;
        case 'civil':
        case 'civil-proceedings':
          data = await CivilCaseService.getCivilProceedingById(caseId);
          break;
        case 'admin':
        case 'administrative':
        case 'coap':
        case 'admin-offenses':
          data = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
          break;
        case 'kas':
          data = await KasCaseService.getKasProceedingById(caseId);
          break;
        default:
          setError('Неизвестный тип дела');
      }
      setCaseData(data);
    } catch (err) {
      console.error('Error loading case:', err);
      setError('Ошибка загрузки дела');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка дела...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Дело не найдено'}</div>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          Вернуться к моим делам
        </button>
      </div>
    );
  }

  // Определяем поля в зависимости от типа дела
  const renderCaseFields = () => {
    const normalizedType = caseType?.toLowerCase();
    
    // Уголовное дело
    if (normalizedType === 'criminal' || normalizedType === 'criminal-proceedings') {
      return (
        <>
          <div className={styles.section}>
            <h2>Основная информация</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Номер дела:</span>
                <span className={styles.value}>{caseData.case_number_criminal || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статус:</span>
                <span className={styles.value}>{caseData.status || 'В производстве'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Судья:</span>
                <span className={styles.value}>{caseData.presiding_judge_full_name || 'Не назначен'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Дата поступления:</span>
                <span className={styles.value}>{formatDate(caseData.incoming_date)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статья УК РФ:</span>
                <span className={styles.value}>{caseData.article_criminal || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Обвиняемые:</span>
                <span className={styles.value}>
                  {caseData.defendants?.map(d => d.full_name_criminal || d.full_name).join(', ') || '—'}
                </span>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // Гражданское дело
    if (normalizedType === 'civil' || normalizedType === 'civil-proceedings') {
      return (
        <>
          <div className={styles.section}>
            <h2>Основная информация</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Номер дела:</span>
                <span className={styles.value}>{caseData.case_number_civil || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Наименование дела:</span>
                <span className={styles.value}>{caseData.case_name || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статус:</span>
                <span className={styles.value}>{caseData.status || 'В производстве'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Судья:</span>
                <span className={styles.value}>{caseData.presiding_judge_full_name || 'Не назначен'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Дата поступления:</span>
                <span className={styles.value}>{formatDate(caseData.incoming_date)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Цена иска:</span>
                <span className={styles.value}>{formatCurrency(caseData.claim_amount)}</span>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // Административное дело КАС
    if (normalizedType === 'kas') {
      return (
        <>
          <div className={styles.section}>
            <h2>Основная информация</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Номер дела:</span>
                <span className={styles.value}>{caseData.case_number_kas || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Наименование дела:</span>
                <span className={styles.value}>{caseData.case_name || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статус:</span>
                <span className={styles.value}>{caseData.status || 'В производстве'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Судья:</span>
                <span className={styles.value}>{caseData.presiding_judge_full_name || 'Не назначен'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Дата поступления:</span>
                <span className={styles.value}>{formatDate(caseData.incoming_date)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Административный истец:</span>
                <span className={styles.value}>{caseData.administrative_plaintiff || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Административный ответчик:</span>
                <span className={styles.value}>{caseData.administrative_defendant || '—'}</span>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    // Административное правонарушение (КоАП)
    if (normalizedType === 'admin' || normalizedType === 'administrative' || normalizedType === 'coap') {
      return (
        <>
          <div className={styles.section}>
            <h2>Основная информация</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Номер дела:</span>
                <span className={styles.value}>{caseData.case_number_admin || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Дата поступления:</span>
                <span className={styles.value}>{formatDate(caseData.incoming_date)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статус:</span>
                <span className={styles.value}>{caseData.status || 'В производстве'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Судья:</span>
                <span className={styles.value}>{caseData.presiding_judge_full_name || 'Не назначен'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Нарушитель:</span>
                <span className={styles.value}>{caseData.violator_name || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Статья КоАП:</span>
                <span className={styles.value}>{caseData.article_number || '—'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Описание правонарушения:</span>
                <span className={styles.value}>{caseData.offense_description || '—'}</span>
              </div>
            </div>
          </div>
        </>
      );
    }
    
    return (
      <div className={styles.section}>
        <h2>Информация о деле</h2>
        <pre>{JSON.stringify(caseData, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          ← Назад к моим делам
        </button>
      </div>

      <div className={styles.content}>
        {renderCaseFields()}
        
        <div className={styles.note}>
          <p>⚠️ Это страница предназначена только для просмотра. Вы не можете редактировать данные дела.</p>
          <p>Для подачи ходатайств или загрузки документов используйте соответствующие кнопки в личном кабинете.</p>
        </div>
      </div>
    </div>
  );
};

export default CaseViewOnly;