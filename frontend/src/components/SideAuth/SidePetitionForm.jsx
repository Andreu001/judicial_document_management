// src/components/SideAuth/SidePetitionForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SideCaseService from '../../API/SideCaseService';
import CriminalCaseService from '../../API/CriminalCaseService';
import CivilCaseService from '../../API/CivilCaseService';
import AdministrativeCaseService from '../../API/AdministrativeCaseService';
import KasCaseService from '../../API/KasCaseService';
import baseService from '../../API/baseService';
import styles from './SidePetitionForm.module.css';

const SidePetitionForm = () => {
  const { caseType, caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { caseNumber, sideName } = location.state || {};
  
  const [formData, setFormData] = useState({
    petition_type: '',
    petitioner_info: '',
    petition_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [petitionTypes, setPetitionTypes] = useState([]);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [caseInfo, setCaseInfo] = useState(null);
  const [petitioners, setPetitioners] = useState([]);
  const [selectedPetitioner, setSelectedPetitioner] = useState('');

  useEffect(() => {
    loadData();
    loadUserInfo();
  }, [caseType, caseId]);

  const normalizeCaseType = (type) => {
    const typeMap = {
      'criminal': 'criminal',
      'civil': 'civil',
      'kas': 'kas',
      'administrative': 'administrative',
      'coap': 'administrative',
      'admin': 'administrative'
    };
    return typeMap[type] || type;
  };

  const loadData = async () => {
    try {
      const normalizedType = normalizeCaseType(caseType);
      
      let types = [];
      let caseData = null;
      let sidesData = [];
      let lawyersData = [];
      
      switch (normalizedType) {
        case 'criminal':
          const criminalOptions = await CriminalCaseService.getPetitionCriminalOptions?.();
          if (criminalOptions && criminalOptions.petition_types) {
            types = criminalOptions.petition_types;
          }
          caseData = await CriminalCaseService.getCriminalProceedingById(caseId);
          sidesData = await CriminalCaseService.getSides(caseId);
          lawyersData = await CriminalCaseService.getLawyers(caseId);
          break;
          
        case 'civil':
          const civilOptions = await CivilCaseService.getCivilOptions?.();
          if (civilOptions && civilOptions.petition_types) {
            types = civilOptions.petition_types;
          }
          caseData = await CivilCaseService.getCivilProceedingById(caseId);
          sidesData = await CivilCaseService.getSides(caseId);
          lawyersData = await CivilCaseService.getLawyers(caseId);
          break;
          
        case 'administrative':
          const adminOptions = await AdministrativeCaseService.getAdminOptions?.();
          if (adminOptions && adminOptions.petition_types) {
            types = adminOptions.petition_types;
          }
          caseData = await AdministrativeCaseService.getAdministrativeProceedingById(caseId);
          sidesData = await AdministrativeCaseService.getSides(caseId);
          lawyersData = await AdministrativeCaseService.getLawyers(caseId);
          break;
          
        case 'kas':
          const kasOptions = await KasCaseService.getKasOptions?.();
          if (kasOptions && kasOptions.petition_types) {
            types = kasOptions.petition_types;
          }
          caseData = await KasCaseService.getKasProceedingById(caseId);
          sidesData = await KasCaseService.getSides(caseId);
          lawyersData = await KasCaseService.getLawyers(caseId);
          break;
          
        default:
          break;
      }
      
      if (types.length === 0) {
        types = await getDefaultPetitionTypes();
      }
      
      setPetitionTypes(types);
      setCaseInfo(caseData);
      
      // Формируем список заявителей
      const petitionersList = [];
      
      sidesData.forEach(side => {
        let sideDetail = {};
        let name = '';
        let role = '';
        
        if (normalizedType === 'criminal') {
          sideDetail = side.criminal_side_case_detail || {};
          name = sideDetail.name || 'Сторона по делу';
          role = side.sides_case_criminal_detail?.sides_case || 'Сторона';
        } else {
          sideDetail = side.sides_case_incase_detail || {};
          name = sideDetail.name || 'Сторона по делу';
          role = side.sides_case_role_detail?.name || 'Сторона';
        }
        
        petitionersList.push({
          id: side.id,
          name: name,
          role: role,
          type: 'side'
        });
      });
      
      lawyersData.forEach(lawyer => {
        const lawyerDetail = lawyer.lawyer_detail || {};
        let roleLabel = '';
        
        switch(normalizedType) {
          case 'criminal':
            roleLabel = 'Адвокат';
            break;
          case 'admin':
            roleLabel = 'Защитник';
            break;
          case 'kas':
            roleLabel = 'Представитель';
            break;
          default:
            roleLabel = 'Представитель';
        }
        
        petitionersList.push({
          id: lawyer.id,
          name: lawyerDetail.law_firm_name || roleLabel,
          role: lawyer.sides_case_role_detail?.name || roleLabel,
          type: 'lawyer'
        });
      });
      
      setPetitioners(petitionersList);
      
    } catch (err) {
      console.error('Error loading data:', err);
      const defaultTypes = await getDefaultPetitionTypes();
      setPetitionTypes(defaultTypes);
    }
  };

  const getDefaultPetitionTypes = async () => {
    try {
      const response = await baseService.get('/business_card/petitions/');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn('Could not load petition types from API, using defaults');
    }
    
    return [
      { id: 1, name: 'Ходатайство о приобщении документов' },
      { id: 2, name: 'Ходатайство о вызове свидетелей' },
      { id: 3, name: 'Ходатайство об ознакомлении с материалами дела' },
      { id: 4, name: 'Ходатайство о привлечении специалиста' },
      { id: 5, name: 'Ходатайство об отложении судебного заседания' },
      { id: 6, name: 'Ходатайство о проведении экспертизы' },
      { id: 7, name: 'Ходатайство об истребовании доказательств' },
      { id: 8, name: 'Другое ходатайство' },
    ];
  };

  const loadUserInfo = async () => {
    try {
      const userData = await SideCaseService.getProfile();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        petitioner_info: userData.full_name || userData.email || 'Участник процесса'
      }));
    } catch (err) {
      console.error('Error loading user:', err);
      const cachedUser = SideCaseService.getCurrentUser();
      if (cachedUser) {
        setUser(cachedUser);
        setFormData(prev => ({
          ...prev,
          petitioner_info: cachedUser.full_name || cachedUser.email || 'Участник процесса'
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePetitionerSelect = (e) => {
    const value = e.target.value;
    setSelectedPetitioner(value);
    
    if (value && value !== 'other') {
      const [type, id] = value.split(':');
      const petitioner = petitioners.find(p => `${p.type}:${p.id}` === value);
      if (petitioner) {
        setFormData(prev => ({
          ...prev,
          petitioner_info: `${petitioner.name} (${petitioner.role})`
        }));
      }
    } else if (value === 'other') {
      setFormData(prev => ({
        ...prev,
        petitioner_info: user?.full_name || user?.email || 'Участник процесса'
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.petition_type) {
      setError('Выберите тип ходатайства');
      return;
    }
    if (!formData.petitioner_info.trim()) {
      setError('Укажите заявителя');
      return;
    }
    if (!formData.petition_date) {
      setError('Укажите дату подачи ходатайства');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const normalizedType = normalizeCaseType(caseType);
      
      // Получаем выбранный тип ходатайства
      const selectedTypeId = parseInt(formData.petition_type);
      const selectedType = petitionTypes.find(t => t.id === selectedTypeId);
      const petitionTypeName = selectedType?.name || selectedType?.petitions || 'Ходатайство';
      
      // Формируем текст ходатайства
      const fullPetitionText = `Тип ходатайства: ${petitionTypeName}

Дата подачи: ${formData.petition_date}

Заявитель: ${formData.petitioner_info}

Содержание ходатайства:
${formData.notes || 'Не указано'}

---
Данное ходатайство подано через личный кабинет участника процесса.
Автор: ${user?.full_name || user?.email || 'Участник процесса'}
Email: ${user?.email || 'Не указан'}`;

      // Формируем данные для API - ОБЯЗАТЕЛЬНО с petitions_name
      const petitionApiData = {
        petitions_name: [selectedTypeId],  // Массив ID типов ходатайств
        date_application: formData.petition_date,
        notation: fullPetitionText,
        petitioner_info: {
          name: formData.petitioner_info,
          source: 'side_user',
          user_email: user?.email,
          user_id: user?.id
        }
      };

      let result;
      
      console.log('Sending petition data:', petitionApiData);
      console.log('To case type:', normalizedType);
      console.log('Case ID:', caseId);
      
      // Отправляем ходатайство в зависимости от типа дела
      switch (normalizedType) {
        case 'criminal':
          result = await CriminalCaseService.createPetition(caseId, petitionApiData);
          break;
        case 'civil':
          result = await baseService.post(`/civil_proceedings/civil-proceedings/${caseId}/petitions/`, petitionApiData);
          result = result.data;
          break;
        case 'administrative':
          result = await AdministrativeCaseService.createPetition(caseId, petitionApiData);
          break;
        case 'kas':
          result = await KasCaseService.createPetition(caseId, petitionApiData);
          break;
        default:
          throw new Error(`Неизвестный тип дела: ${caseType}`);
      }
      
      console.log('Petition created successfully:', result);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/my-cases');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating petition:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Ошибка при подаче ходатайства';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errors = Object.entries(err.response.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          errorMessage = errors;
        } else {
          errorMessage = err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCaseTypeName = () => {
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении (КоАП РФ)',
      admin: 'Дело об административном правонарушении (КоАП РФ)',
      coap: 'Дело об административном правонарушении (КоАП РФ)'
    };
    return names[caseType] || 'Дело';
  };

  const formatCaseNumber = () => {
    if (caseNumber) return caseNumber;
    if (caseInfo) {
      if (caseInfo.case_number_criminal) return caseInfo.case_number_criminal;
      if (caseInfo.case_number_civil) return caseInfo.case_number_civil;
      if (caseInfo.case_number_kas) return caseInfo.case_number_kas;
      if (caseInfo.case_number_admin) return caseInfo.case_number_admin;
    }
    return caseId;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/my-cases')} className={styles.backButton}>
          ← Назад к делам
        </button>
        <h1>Подача ходатайства</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.caseInfo}>
          <div className={styles.caseInfoTitle}>{getCaseTypeName()}</div>
          <div className={styles.caseInfoNumber}>№ {formatCaseNumber()}</div>
          {sideName && (
            <div className={styles.caseInfoSide}>Ваша роль: {sideName}</div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <strong>✓ Ходатайство успешно подано!</strong>
            <p>Вы будете перенаправлены в личный кабинет...</p>
          </div>
        )}

        <div className={styles.formSection}>
          <h3>Информация о ходатайстве</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="petition_type">Тип ходатайства *</label>
            <select
              id="petition_type"
              name="petition_type"
              value={formData.petition_type}
              onChange={handleChange}
              className={styles.select}
              disabled={submitting || success}
            >
              <option value="">Выберите тип ходатайства</option>
              {petitionTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name || type.petitions || `Ходатайство ${type.id}`}
                </option>
              ))}
            </select>
          </div>

          {petitioners.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="petitioner_select">Выбрать из списка участников</label>
              <select
                id="petitioner_select"
                value={selectedPetitioner}
                onChange={handlePetitionerSelect}
                className={styles.select}
                disabled={submitting || success}
              >
                <option value="">-- Выберите из списка --</option>
                {petitioners.map(p => (
                  <option key={`${p.type}-${p.id}`} value={`${p.type}:${p.id}`}>
                    {p.name} ({p.role})
                  </option>
                ))}
                <option value="other">-- Другое (ввести вручную) --</option>
              </select>
              <p className={styles.hint}>Выберите себя из списка или заполните вручную ниже</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="petitioner_info">Заявитель *</label>
            <input
              type="text"
              id="petitioner_info"
              name="petitioner_info"
              value={formData.petitioner_info}
              onChange={handleChange}
              className={styles.input}
              disabled={submitting || success}
              placeholder="ФИО заявителя"
            />
            <p className={styles.hint}>Ваше ФИО будет указано в ходатайстве как заявитель</p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="petition_date">Дата подачи *</label>
            <input
              type="date"
              id="petition_date"
              name="petition_date"
              value={formData.petition_date}
              onChange={handleChange}
              className={styles.input}
              disabled={submitting || success}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes">Содержание ходатайства</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={10}
              className={styles.textarea}
              disabled={submitting || success}
              placeholder="Опишите содержание ходатайства подробно...

Пример:
- Какие документы вы хотите приобщить?
- Каких свидетелей вызвать?
- Какие обстоятельства требуют проверки?
- Какое экспертное исследование необходимо?
- Иные основания для удовлетворения ходатайства"
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleSubmit}
            disabled={submitting || success}
            className={styles.submitButton}
          >
            {submitting ? 'Отправка ходатайства...' : '📄 Отправить ходатайство'}
          </button>
          <button 
            onClick={() => navigate('/my-cases')}
            className={styles.cancelButton}
            disabled={submitting}
          >
            Отмена
          </button>
        </div>

        <div className={styles.note}>
          <p>📌 После отправки ходатайства оно будет рассмотрено судом. 
             Статус рассмотрения можно отследить в разделе "Ходатайства" 
             при просмотре дела в личном кабинете.</p>
        </div>
      </div>
    </div>
  );
};

export default SidePetitionForm;