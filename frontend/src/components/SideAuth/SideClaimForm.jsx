// src/components/SideAuth/SideClaimForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import styles from './SideClaimForm.module.css';

const SideClaimForm = () => {
  const { caseType, caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { caseNumber, sideName, defendantName } = location.state || {};
  
  const [formData, setFormData] = useState({
    // Ст. 131 ГПК РФ - обязательные реквизиты
    court_name: '',
    plaintiff_info: {
      full_name: '',
      address: '',
      phone: '',
      email: '',
      passport_series: '',
      passport_number: '',
      birth_date: '',
      place_of_birth: '',
    },
    defendant_info: {
      full_name: '',
      address: '',
      phone: '',
      email: '',
      inn: '',
      ogrn: '', // для юрлиц
    },
    third_persons: [], // третьи лица
    
    // Суть иска
    claim_subject: '', // предмет иска
    claim_amount: '', // цена иска в рублях
    
    // Обстоятельства дела
    rights_violation: '', // нарушение прав истца
    circumstances: '', // обстоятельства, на которых основан иск
    evidence: '', // доказательства
    
    // Требования истца
    claims: '', // конкретные требования
    
    // Досудебный порядок
    pre_trial_compliance: false,
    pre_trial_details: '',
    
    // Цена иска - расчет
    claim_calculation: '',
    
    // Дополнительно
    attached_documents: [], // список прилагаемых документов
    additional_notes: '',
    
    // Информация о подателе
    signer_info: '', // подпись/представитель
    submission_date: new Date().toISOString().split('T')[0],
  });
  
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [caseInfo, setCaseInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [thirdPersonInput, setThirdPersonInput] = useState('');
  
  const [documentFiles, setDocumentFiles] = useState([]); // Файлы для загрузки
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    loadData();
    loadUserInfo();
  }, [caseType, caseId]);

  const loadData = async () => {
    try {
      // Загружаем информацию о деле
      let caseData = null;
      const normalizedType = normalizeCaseType(caseType);
      
      switch (normalizedType) {
        case 'criminal':
          const criminalData = await import('../../API/CriminalCaseService').then(m => m.default.getCriminalProceedingById(caseId));
          caseData = criminalData;
          break;
        case 'civil':
          const civilData = await import('../../API/CivilCaseService').then(m => m.default.getCivilProceedingById(caseId));
          caseData = civilData;
          break;
        case 'kas':
          const kasData = await import('../../API/KasCaseService').then(m => m.default.getKasProceedingById(caseId));
          caseData = kasData;
          break;
        default:
          break;
      }
      
      setCaseInfo(caseData);
      
      // Предзаполняем информацию об истце из профиля
      const userData = await import('../../API/SideCaseService').then(m => m.default.getProfile());
      setUser(userData);
      
      setFormData(prev => ({
        ...prev,
        plaintiff_info: {
          ...prev.plaintiff_info,
          full_name: userData.full_name || '',
          email: userData.email || '',
          birth_date: userData.birth_date || '',
        },
        signer_info: userData.full_name || '',
      }));
      
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadUserInfo = async () => {
    try {
      const sideService = await import('../../API/SideCaseService');
      const userData = await sideService.default.getProfile();
      setUser(userData);
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addThirdPerson = () => {
    if (thirdPersonInput.trim()) {
      setFormData(prev => ({
        ...prev,
        third_persons: [...prev.third_persons, thirdPersonInput.trim()]
      }));
      setThirdPersonInput('');
    }
  };

  const removeThirdPerson = (index) => {
    setFormData(prev => ({
      ...prev,
      third_persons: prev.third_persons.filter((_, i) => i !== index)
    }));
  };

  const addAttachedDocument = () => {
    // Открываем диалог выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setDocumentFiles(prev => [...prev, ...files]);
      
      // Добавляем в список прилагаемых документов
      files.forEach(file => {
        setFormData(prev => ({
          ...prev,
          attached_documents: [...prev.attached_documents, file.name]
        }));
      });
    };
    input.click();
  };

  const removeAttachedDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      attached_documents: prev.attached_documents.filter((_, i) => i !== index)
    }));
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.court_name.trim()) {
      errors.push('Укажите наименование суда');
    }
    if (!formData.plaintiff_info.full_name.trim()) {
      errors.push('Укажите ФИО истца');
    }
    if (!formData.plaintiff_info.address.trim()) {
      errors.push('Укажите адрес истца');
    }
    if (!formData.defendant_info.full_name.trim()) {
      errors.push('Укажите ФИО/наименование ответчика');
    }
    if (!formData.defendant_info.address.trim()) {
      errors.push('Укажите адрес ответчика');
    }
    if (!formData.claim_subject.trim()) {
      errors.push('Укажите предмет иска');
    }
    if (!formData.circumstances.trim()) {
      errors.push('Укажите обстоятельства, на которых основан иск');
    }
    if (!formData.claims.trim()) {
      errors.push('Укажите требования истца');
    }
    
    return errors;
  };

  const uploadDocuments = async () => {
    if (documentFiles.length === 0) return [];
    
    const uploadedIds = [];
    const sideService = await import('../../API/SideCaseService');
    
    for (const file of documentFiles) {
      try {
        const result = await sideService.default.uploadDocument(
          normalizeCaseType(caseType),
          caseId,
          file.name,
          file,
          `Приложение к исковому заявлению: ${file.name}`
        );
        uploadedIds.push(result.document_id);
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
      }
    }
    
    return uploadedIds;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Сначала загружаем приложенные файлы
      setUploadingFiles(true);
      const documentIds = await uploadDocuments();
      setUploadingFiles(false);
      
      // Формируем полный текст искового заявления
      const claimText = generateClaimText();
      
      // Формируем данные для API
      const claimData = {
        // Информация о деле
        case_type: normalizeCaseType(caseType),
        case_id: parseInt(caseId),
        case_number: caseNumber || (caseInfo?.case_number_civil || caseInfo?.case_number_criminal || ''),
        
        // Данные искового заявления
        claim_text: claimText,
        claim_amount: parseFloat(formData.claim_amount) || 0,
        claim_subject: formData.claim_subject,
        claim_requirements: formData.claims,
        
        // Информация об истце
        plaintiff_name: formData.plaintiff_info.full_name,
        plaintiff_address: formData.plaintiff_info.address,
        plaintiff_phone: formData.plaintiff_info.phone,
        plaintiff_email: formData.plaintiff_info.email,
        plaintiff_passport_series: formData.plaintiff_info.passport_series,
        plaintiff_passport_number: formData.plaintiff_info.passport_number,
        plaintiff_birth_date: formData.plaintiff_info.birth_date,
        plaintiff_birth_place: formData.plaintiff_info.place_of_birth,
        
        // Информация об ответчике
        defendant_name: formData.defendant_info.full_name,
        defendant_address: formData.defendant_info.address,
        defendant_phone: formData.defendant_info.phone,
        defendant_email: formData.defendant_info.email,
        
        // Третьи лица
        third_persons: formData.third_persons,
        
        // Прилагаемые документы
        attached_documents: formData.attached_documents,
        uploaded_document_ids: documentIds,
        
        // Информация о подаче
        submission_date: formData.submission_date,
        signer_info: formData.signer_info,
        additional_notes: formData.additional_notes,
      };
      
      // Отправляем иск
      const response = await baseService.post('/side_case/civil-claim/', claimData);
      
      console.log('Claim submitted successfully:', response.data);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/my-cases');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting claim:', err);
      console.error('Error details:', err.response?.data);
      
      let errorMessage = 'Ошибка при подаче искового заявления';
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
      setUploadingFiles(false);
    }
  };

  const generateClaimText = () => {
    const plaintiff = formData.plaintiff_info;
    const defendant = formData.defendant_info;
    const thirdPersons = formData.third_persons.length > 0 
      ? `\nТретьи лица: ${formData.third_persons.join(', ')}` 
      : '';
    
    return `В ${formData.court_name}

Истец: ${plaintiff.full_name}
Адрес: ${plaintiff.address}
Телефон: ${plaintiff.phone}
Email: ${plaintiff.email}

Ответчик: ${defendant.full_name}
Адрес: ${defendant.address}
Телефон: ${defendant.phone}
Email: ${defendant.email}
${thirdPersons}

Цена иска: ${formData.claim_amount || 'не указана'} руб.

Предмет иска:
${formData.claim_subject}

Обстоятельства, на которых основан иск:
${formData.circumstances}

Нарушение прав истца:
${formData.rights_violation || 'Не указано'}

Доказательства:
${formData.evidence || 'Будут представлены в судебном заседании'}

Требования истца:
${formData.claims}

${formData.pre_trial_compliance ? `Досудебный порядок соблюден:\n${formData.pre_trial_details}` : 'Досудебный порядок не требовался'}

${formData.claim_calculation ? `Расчет цены иска:\n${formData.claim_calculation}` : ''}

Приложение:
${formData.attached_documents.map(doc => `- ${doc}`).join('\n')}

${formData.additional_notes ? `Дополнительно:\n${formData.additional_notes}` : ''}

Дата: ${new Date(formData.submission_date).toLocaleDateString('ru-RU')}
Подпись: ${formData.signer_info}`;
  };

  const formatNumber = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  const getCaseTypeName = () => {
    const names = {
      criminal: 'Уголовное дело',
      civil: 'Гражданское дело',
      kas: 'Административное дело (КАС РФ)',
      administrative: 'Дело об административном правонарушении (КоАП РФ)',
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
        <h1>Подача искового заявления</h1>
        <p className={styles.subtitle}>на основе требований ст. 131 ГПК РФ</p>
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
            <strong>✓ Исковое заявление успешно подано!</strong>
            <p>Документ зарегистрирован и передан на рассмотрение суду. Вы будете перенаправлены в личный кабинет...</p>
          </div>
        )}

        <div className={styles.formSection}>
          <h3>1. Информация о суде</h3>
          <div className={styles.formGroup}>
            <label htmlFor="court_name">Наименование суда *</label>
            <input
              type="text"
              id="court_name"
              name="court_name"
              value={formData.court_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Например: Центральный районный суд г. Москвы"
              disabled={submitting || success}
            />
            <p className={styles.hint}>Укажите полное наименование суда, в который подается заявление</p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>2. Сведения об истце (ст. 131 ГПК РФ)</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.full_name">ФИО истца *</label>
              <input
                type="text"
                id="plaintiff_info.full_name"
                name="plaintiff_info.full_name"
                value={formData.plaintiff_info.full_name}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.birth_date">Дата рождения</label>
              <input
                type="date"
                id="plaintiff_info.birth_date"
                name="plaintiff_info.birth_date"
                value={formData.plaintiff_info.birth_date}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.passport_series">Серия паспорта</label>
              <input
                type="text"
                id="plaintiff_info.passport_series"
                name="plaintiff_info.passport_series"
                value={formData.plaintiff_info.passport_series}
                onChange={handleChange}
                className={styles.input}
                placeholder="0000"
                disabled={submitting || success}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.passport_number">Номер паспорта</label>
              <input
                type="text"
                id="plaintiff_info.passport_number"
                name="plaintiff_info.passport_number"
                value={formData.plaintiff_info.passport_number}
                onChange={handleChange}
                className={styles.input}
                placeholder="000000"
                disabled={submitting || success}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="plaintiff_info.address">Адрес места жительства *</label>
            <textarea
              id="plaintiff_info.address"
              name="plaintiff_info.address"
              value={formData.plaintiff_info.address}
              onChange={handleChange}
              rows={2}
              className={styles.textarea}
              placeholder="Индекс, город, улица, дом, квартира"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.phone">Телефон</label>
              <input
                type="tel"
                id="plaintiff_info.phone"
                name="plaintiff_info.phone"
                value={formData.plaintiff_info.phone}
                onChange={handleChange}
                className={styles.input}
                placeholder="+7 (XXX) XXX-XX-XX"
                disabled={submitting || success}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="plaintiff_info.email">Email</label>
              <input
                type="email"
                id="plaintiff_info.email"
                name="plaintiff_info.email"
                value={formData.plaintiff_info.email}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>3. Сведения об ответчике</h3>
          <div className={styles.formGroup}>
            <label htmlFor="defendant_info.full_name">ФИО/Наименование ответчика *</label>
            <input
              type="text"
              id="defendant_info.full_name"
              name="defendant_info.full_name"
              value={formData.defendant_info.full_name}
              onChange={handleChange}
              className={styles.input}
              placeholder="Для юрлиц - полное наименование"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="defendant_info.address">Адрес ответчика *</label>
            <textarea
              id="defendant_info.address"
              name="defendant_info.address"
              value={formData.defendant_info.address}
              onChange={handleChange}
              rows={2}
              className={styles.textarea}
              placeholder="Место жительства или место нахождения"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="defendant_info.phone">Телефон ответчика</label>
              <input
                type="tel"
                id="defendant_info.phone"
                name="defendant_info.phone"
                value={formData.defendant_info.phone}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="defendant_info.email">Email ответчика</label>
              <input
                type="email"
                id="defendant_info.email"
                name="defendant_info.email"
                value={formData.defendant_info.email}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="defendant_info.inn">ИНН (для юрлиц)</label>
              <input
                type="text"
                id="defendant_info.inn"
                name="defendant_info.inn"
                value={formData.defendant_info.inn}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="defendant_info.ogrn">ОГРН (для юрлиц)</label>
              <input
                type="text"
                id="defendant_info.ogrn"
                name="defendant_info.ogrn"
                value={formData.defendant_info.ogrn}
                onChange={handleChange}
                className={styles.input}
                disabled={submitting || success}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>4. Третьи лица</h3>
          <div className={styles.formGroup}>
            <label>Добавить третье лицо</label>
            <div className={styles.addRow}>
              <input
                type="text"
                value={thirdPersonInput}
                onChange={(e) => setThirdPersonInput(e.target.value)}
                className={styles.input}
                placeholder="ФИО третьего лица"
                disabled={submitting || success}
              />
              <button
                type="button"
                onClick={addThirdPerson}
                className={styles.addButton}
                disabled={submitting || success}
              >
                +
              </button>
            </div>
            {formData.third_persons.length > 0 && (
              <div className={styles.listItems}>
                {formData.third_persons.map((person, idx) => (
                  <div key={idx} className={styles.listItem}>
                    <span>{person}</span>
                    <button
                      type="button"
                      onClick={() => removeThirdPerson(idx)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>5. Предмет и цена иска</h3>
          <div className={styles.formGroup}>
            <label htmlFor="claim_subject">Предмет иска *</label>
            <input
              type="text"
              id="claim_subject"
              name="claim_subject"
              value={formData.claim_subject}
              onChange={handleChange}
              className={styles.input}
              placeholder="Например: Взыскание задолженности по договору займа"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="claim_amount">Цена иска (руб.)</label>
            <input
              type="number"
              id="claim_amount"
              name="claim_amount"
              value={formData.claim_amount}
              onChange={handleChange}
              className={styles.input}
              step="0.01"
              placeholder="Сумма в рублях"
              disabled={submitting || success}
            />
            {formData.claim_amount > 0 && (
              <p className={styles.hint}>
                Государственная пошлина: ≈ {formatNumber(formData.claim_amount * 0.01)} руб.
                (расчет: 1% от цены иска, но не менее 100 руб.)
              </p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="claim_calculation">Расчет цены иска</label>
            <textarea
              id="claim_calculation"
              name="claim_calculation"
              value={formData.claim_calculation}
              onChange={handleChange}
              rows={4}
              className={styles.textarea}
              placeholder="Подробный расчет взыскиваемой суммы с указанием периода и методики расчета"
              disabled={submitting || success}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>6. Обстоятельства дела (ст. 131 ГПК РФ)</h3>
          <div className={styles.formGroup}>
            <label htmlFor="circumstances">Обстоятельства, на которых основан иск *</label>
            <textarea
              id="circumstances"
              name="circumstances"
              value={formData.circumstances}
              onChange={handleChange}
              rows={6}
              className={styles.textarea}
              placeholder="Подробно опишите, что, когда, где произошло, какие действия совершили стороны"
              disabled={submitting || success}
            />
            <p className={styles.hint}>Укажите время, место, способ совершения нарушения, вину ответчика</p>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rights_violation">Нарушение прав истца</label>
            <textarea
              id="rights_violation"
              name="rights_violation"
              value={formData.rights_violation}
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
              placeholder="Какие права истца нарушены и в чем конкретно выражается нарушение"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="evidence">Доказательства</label>
            <textarea
              id="evidence"
              name="evidence"
              value={formData.evidence}
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
              placeholder="Какими доказательствами подтверждаются обстоятельства дела"
              disabled={submitting || success}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>7. Требования истца</h3>
          <div className={styles.formGroup}>
            <label htmlFor="claims">Конкретные требования *</label>
            <textarea
              id="claims"
              name="claims"
              value={formData.claims}
              onChange={handleChange}
              rows={4}
              className={styles.textarea}
              placeholder="Четко сформулируйте, что вы просите суд:\n- Взыскать сумму...\n- Обязать совершить действия...\n- Признать право..."
              disabled={submitting || success}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>8. Досудебный порядок</h3>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="pre_trial_compliance"
                checked={formData.pre_trial_compliance}
                onChange={handleChange}
                disabled={submitting || success}
              />
              Мной соблюден досудебный порядок урегулирования спора
            </label>
          </div>
          
          {formData.pre_trial_compliance && (
            <div className={styles.formGroup}>
              <label htmlFor="pre_trial_details">Подробности досудебного урегулирования</label>
              <textarea
                id="pre_trial_details"
                name="pre_trial_details"
                value={formData.pre_trial_details}
                onChange={handleChange}
                rows={3}
                className={styles.textarea}
                placeholder="Когда и кому направлялась претензия, какой получен ответ"
                disabled={submitting || success}
              />
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h3>9. Прилагаемые документы</h3>
          <div className={styles.formGroup}>
            <button
              type="button"
              onClick={addAttachedDocument}
              className={styles.attachButton}
              disabled={submitting || success}
            >
              📎 Приложить документы
            </button>
            
            {formData.attached_documents.length > 0 && (
              <div className={styles.documentsList}>
                <p className={styles.documentsTitle}>Приложенные документы:</p>
                {formData.attached_documents.map((doc, idx) => (
                  <div key={idx} className={styles.documentItem}>
                    <span>📄 {doc}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachedDocument(idx)}
                      className={styles.removeDocButton}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className={styles.hint}>
              Приложите: квитанцию об оплате госпошлины, доверенность (если подает представитель),
              документы, подтверждающие обстоятельства дела, расчет цены иска и т.д.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>10. Дополнительная информация</h3>
          <div className={styles.formGroup}>
            <label htmlFor="additional_notes">Иные сведения</label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
              placeholder="Любые дополнительные сведения, имеющие значение для дела"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="signer_info">Подпись/Представитель</label>
            <input
              type="text"
              id="signer_info"
              name="signer_info"
              value={formData.signer_info}
              onChange={handleChange}
              className={styles.input}
              placeholder="ФИО подателя или лица, подписывающего заявление"
              disabled={submitting || success}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="submission_date">Дата подачи</label>
            <input
              type="date"
              id="submission_date"
              name="submission_date"
              value={formData.submission_date}
              onChange={handleChange}
              className={styles.input}
              disabled={submitting || success}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleSubmit}
            disabled={submitting || success || uploadingFiles}
            className={styles.submitButton}
          >
            {uploadingFiles ? 'Загрузка документов...' :
             submitting ? 'Отправка искового заявления...' : 
             '📋 Подать исковое заявление'}
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
          <p>📌 В соответствии со ст. 131 ГПК РФ:</p>
          <ul>
            <li>Исковое заявление подается в письменной форме</li>
            <li>Должно содержать все обязательные реквизиты</li>
            <li>К заявлению прилагаются документы по числу ответчиков</li>
            <li>Несоблюдение требований может повлечь оставление заявления без движения</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SideClaimForm;