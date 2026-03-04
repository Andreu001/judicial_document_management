import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PersonDetailsModal.module.css';

const PersonDetailsModal = ({ personData, onClose }) => {
  const navigate = useNavigate();
  
  if (!personData) return null;

  const { person, cases } = personData;

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString;
    }
  };

  // Функция для получения текста типа лица
  const getPersonTypeText = (type) => {
    const typeMap = {
      'individual': 'Физическое лицо',
      'legal': 'Юридическое лицо',
      'government': 'Орган власти',
      'other': 'Иное'
    };
    return typeMap[type] || type || 'Не указан';
  };

  // Функция для получения текста пола
  const getGenderText = (gender) => {
    const genderMap = {
      'male': 'Мужской',
      'female': 'Женский'
    };
    return genderMap[gender] || gender || 'Не указан';
  };

  // Функция для получения текста типа документа
  const getDocumentTypeText = (type) => {
    const docMap = {
      'passport': 'Паспорт РФ',
      'foreign_passport': 'Загранпаспорт',
      'birth_certificate': 'Свидетельство о рождении',
      'driver_license': 'Водительское удостоверение',
      'military_id': 'Военный билет'
    };
    return docMap[type] || type || 'Не указан';
  };

  // Функция для получения цвета статуса
  const getStatusColor = (status) => {
    const colorMap = {
      'active': '#2f855a',
      'completed': '#3182ce',
      'execution': '#dd6b20',
      'archived': '#718096'
    };
    return colorMap[status] || '#718096';
  };

  // Функция для получения текста статуса
  const getStatusText = (status) => {
    const statusMap = {
      'active': 'Активное',
      'completed': 'Рассмотрено',
      'execution': 'На исполнении',
      'archived': 'В архиве'
    };
    return statusMap[status] || status;
  };

  // Функция для получения типа дела
  const getCaseTypeText = (type) => {
    const typeMap = {
      'criminal': 'Уголовное',
      'civil': 'Гражданское',
      'administrative': 'Административное (КоАП)',
      'kas': 'Административное (КАС)'
    };
    return typeMap[type] || type;
  };

  // Переход к делу
  const handleCaseClick = (caseData) => {
    if (caseData.case_type === 'criminal') {
      navigate(`/criminal-proceedings/${caseData.id}`);
    } else if (caseData.case_type === 'civil') {
      navigate(`/civil-proceedings/${caseData.id}`);
    } else if (caseData.case_type === 'administrative') {
      navigate(`/admin-proceedings/${caseData.id}`);
    } else if (caseData.case_type === 'kas') {
      navigate(`/kas-proceedings/${caseData.id}`);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {person.name || 'Информация об участнике'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* Основная информация */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Основная информация</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Тип лица:</span>
                <span className={styles.infoValue}>{getPersonTypeText(person.person_type)}</span>
              </div>
              
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Телефон:</span>
                <span className={styles.infoValue}>{person.phone || 'Не указан'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{person.email || 'Не указан'}</span>
              </div>
              
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Адрес:</span>
                <span className={styles.infoValue}>{person.address || 'Не указан'}</span>
              </div>
            </div>
          </div>

          {/* Дополнительная информация для физических лиц */}
          {person.person_type === 'individual' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Данные физического лица</h3>
              <div className={styles.infoGrid}>
                {person.birth_date && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Дата рождения:</span>
                    <span className={styles.infoValue}>{formatDate(person.birth_date)}</span>
                  </div>
                )}
                
                {person.gender && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Пол:</span>
                    <span className={styles.infoValue}>{getGenderText(person.gender)}</span>
                  </div>
                )}
                
                {person.document_type && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Документ:</span>
                    <span className={styles.infoValue}>
                      {getDocumentTypeText(person.document_type)} 
                      {person.document_series && ` ${person.document_series}`}
                      {person.document_number && ` №${person.document_number}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Дополнительная информация для юридических лиц */}
          {person.person_type === 'legal' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Данные юридического лица</h3>
              <div className={styles.infoGrid}>
                {person.inn && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ИНН:</span>
                    <span className={styles.infoValue}>{person.inn}</span>
                  </div>
                )}
                
                {person.kpp && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>КПП:</span>
                    <span className={styles.infoValue}>{person.kpp}</span>
                  </div>
                )}
                
                {person.ogrn && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>ОГРН:</span>
                    <span className={styles.infoValue}>{person.ogrn}</span>
                  </div>
                )}
                
                {person.director_name && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Руководитель:</span>
                    <span className={styles.infoValue}>{person.director_name}</span>
                  </div>
                )}
                
                {person.legal_address && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Юридический адрес:</span>
                    <span className={styles.infoValue}>{person.legal_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Комментарий */}
          {person.comment && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Комментарий</h3>
              <div className={styles.comment}>
                {person.comment}
              </div>
            </div>
          )}

          {/* Связанные дела */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Участие в делах ({cases.length})
            </h3>
            
            {cases.length === 0 ? (
              <div className={styles.noCases}>
                Участник не найден ни в одном деле
              </div>
            ) : (
              <div className={styles.casesList}>
                {cases.map((caseData, index) => (
                  <div 
                    key={`${caseData.case_type}-${caseData.id}`} 
                    className={styles.caseCard}
                    onClick={() => handleCaseClick(caseData)}
                  >
                    <div className={styles.caseHeader}>
                      <span className={`${styles.caseType} ${styles[caseData.case_type]}`}>
                        {getCaseTypeText(caseData.case_type)}
                      </span>
                      <span 
                        className={styles.caseStatus}
                        style={{ backgroundColor: getStatusColor(caseData.status) }}
                      >
                        {getStatusText(caseData.status)}
                      </span>
                    </div>
                    
                    <div className={styles.caseBody}>
                      <div className={styles.caseNumber}>
                        {caseData.case_number}
                      </div>
                      
                      <div className={styles.caseRole}>
                        <span className={styles.roleLabel}>Роль:</span>
                        <span className={styles.roleValue}>{caseData.role}</span>
                      </div>
                      
                      <div className={styles.caseDate}>
                        Дата поступления: {formatDate(caseData.incoming_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonDetailsModal;