// src/components/SideAuth/SideClaimForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import baseService from '../../API/baseService';
import SideCaseService from '../../API/SideCaseService';
import styles from './SideClaimForm.module.css';

const SideClaimForm = () => {
  const { caseType, caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { caseNumber, sideName, defendantName } = location.state || {};
  
  // ===== ОСНОВНЫЕ ДАННЫЕ ФОРМЫ =====
  const [formData, setFormData] = useState({
    // Информация о суде (заполняется автоматически из выбора)
    court_name: '',
    court_id: '',
    region_id: '',
    
    // Сведения об истце
    plaintiff_info: {
      full_name: '',
      address: '',
      phone: '',
      email: '',
      birth_date: '',
    },
    
    // Сведения об ответчике
    defendant_info: {
      full_name: '',
      address: '',
      phone: '',
      email: '',
    },
    
    // Третьи лица
    third_persons: [],
    
    // Суть иска
    claim_subject: '',
    claim_amount: '',
    
    // Обстоятельства дела
    circumstances: '',
    
    // Требования истца
    claims: '',
    
    // Прилагаемые документы
    attached_documents: [],
    additional_notes: '',
    
    // Информация о подателе
    signer_info: '',
    submission_date: new Date().toISOString().split('T')[0],
  });
  
  // ===== СОСТОЯНИЯ ДЛЯ РЕГИОНОВ И СУДОВ =====
  const [regions, setRegions] = useState([]);
  const [courtsByRegion, setCourtsByRegion] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  
  // ===== ОСТАЛЬНЫЕ СОСТОЯНИЯ =====
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [thirdPersonInput, setThirdPersonInput] = useState('');
  const [documentFiles, setDocumentFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // ===== ЗАГРУЗКА ДАННЫХ ПРИ МОНТИРОВАНИИ =====
  useEffect(() => {
    loadUserInfo();
    loadRegions();
  }, []);

  // ===== ЗАГРУЗКА ИНФОРМАЦИИ О ПОЛЬЗОВАТЕЛЕ =====
  const loadUserInfo = async () => {
    try {
      const userData = await SideCaseService.getProfile();
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
      console.error('Error loading user:', err);
    }
  };

  // ===== ЗАГРУЗКА СПИСКА РЕГИОНОВ =====
  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const data = await SideCaseService.getRegions();
      setRegions(data);
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  // ===== ЗАГРУЗКА СУДОВ ПО РЕГИОНУ =====
  const loadCourtsByRegion = async (regionId) => {
    if (!regionId) {
      setCourtsByRegion([]);
      setSelectedCourtId('');
      setFormData(prev => ({ ...prev, court_name: '', court_id: '' }));
      return;
    }
    
    try {
      setLoadingCourts(true);
      const data = await SideCaseService.getCourtsByRegion(regionId);
      setCourtsByRegion(data);
      setSelectedCourtId('');
      setFormData(prev => ({ ...prev, court_name: '', court_id: '' }));
    } catch (error) {
      console.error('Error loading courts:', error);
      setCourtsByRegion([]);
    } finally {
      setLoadingCourts(false);
    }
  };

  // ===== ОБРАБОТЧИК СМЕНЫ РЕГИОНА =====
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setSelectedRegionId(regionId);
    loadCourtsByRegion(regionId);
  };

  // ===== ОБРАБОТЧИК СМЕНЫ СУДА =====
  const handleCourtChange = (e) => {
    const courtId = e.target.value;
    setSelectedCourtId(courtId);
    
    // Находим выбранный суд и сохраняем его данные
    const selectedCourt = courtsByRegion.find(c => c.id === parseInt(courtId));
    setFormData(prev => ({
      ...prev,
      court_name: selectedCourt ? selectedCourt.name : '',
      court_id: courtId,
      region_id: selectedRegionId,
    }));
  };

  // ===== НОРМАЛИЗАЦИЯ ТИПА ДЕЛА =====
  const normalizeCaseType = (type) => {
    const typeMap = {
      'criminal': 'criminal',
      'civil': 'civil',
      'kas': 'kas',
      'administrative': 'administrative',
      'coap': 'administrative',
      'admin': 'administrative'
    };
    return typeMap[type] || 'civil';
  };

  // ===== ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЕЙ =====
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

  // ===== ТРЕТЬИ ЛИЦА =====
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

  // ===== ПРИЛОЖЕННЫЕ ДОКУМЕНТЫ =====
  const addAttachedDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setDocumentFiles(prev => [...prev, ...files]);
      
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

  // ===== ВАЛИДАЦИЯ ФОРМЫ =====
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

  // ===== ЗАГРУЗКА ДОКУМЕНТОВ =====
  const uploadDocuments = async () => {
    if (documentFiles.length === 0) return [];
    
    const uploadedIds = [];
    const normalizedType = normalizeCaseType(caseType);
    
    for (const file of documentFiles) {
      try {
        const result = await SideCaseService.uploadDocument(
          normalizedType,
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

  // ===== ГЕНЕРАЦИЯ ТЕКСТА ИСКА =====
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

Требования истца:
${formData.claims}

${formData.additional_notes ? `Дополнительно:\n${formData.additional_notes}` : ''}

Дата: ${new Date(formData.submission_date).toLocaleDateString('ru-RU')}
Подпись: ${formData.signer_info}`;
  };

  // ===== ОТПРАВКА ФОРМЫ =====
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      setUploadingFiles(true);
      const documentIds = await uploadDocuments();
      setUploadingFiles(false);
      
      const claimText = generateClaimText();
      const normalizedCaseType = normalizeCaseType(caseType);
      
      const claimData = {
        case_type: normalizedCaseType || 'civil',
        case_id: caseId ? parseInt(caseId) : null,
        case_number: caseNumber || '',
        
        claim_text: claimText,
        claim_amount: parseFloat(formData.claim_amount) || 0,
        claim_subject: formData.claim_subject,
        claim_requirements: formData.claims,
        
        // Информация о суде
        court_name: formData.court_name,
        court_id: formData.court_id,
        region_id: formData.region_id,
        
        plaintiff_name: formData.plaintiff_info.full_name,
        plaintiff_address: formData.plaintiff_info.address,
        plaintiff_phone: formData.plaintiff_info.phone || '',
        plaintiff_email: formData.plaintiff_info.email || '',
        plaintiff_passport_series: '',
        plaintiff_passport_number: '',
        plaintiff_birth_date: formData.plaintiff_info.birth_date || null,
        plaintiff_birth_place: '',
        
        defendant_name: formData.defendant_info.full_name,
        defendant_address: formData.defendant_info.address,
        defendant_phone: formData.defendant_info.phone || '',
        defendant_email: formData.defendant_info.email || '',
        
        third_persons: formData.third_persons || [],
        attached_documents: formData.attached_documents || [],
        uploaded_document_ids: documentIds,
        
        submission_date: formData.submission_date,
        signer_info: formData.signer_info || formData.plaintiff_info.full_name,
        additional_notes: formData.additional_notes || '',
      };
      
      console.log('Submitting claim data:', claimData);
      
      const response = await baseService.post('/side_case/civil-claim/', claimData);
      
      console.log('Claim submitted successfully:', response.data);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/my-cases');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting claim:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
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

        {/* ===== РАЗДЕЛ 1. ИНФОРМАЦИЯ О СУДЕ ===== */}
        <div className={styles.formSection}>
          <h3>1. Информация о суде</h3>
          
          {/* Выбор региона */}
          <div className={styles.formGroup}>
            <label htmlFor="region">Регион *</label>
            <select
              id="region"
              value={selectedRegionId}
              onChange={handleRegionChange}
              className={styles.select}
              disabled={submitting || success || loadingRegions}
            >
              <option value="">Выберите регион</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            {loadingRegions && <span className={styles.hint}>Загрузка регионов...</span>}
          </div>
          
          {/* Выбор суда */}
          <div className={styles.formGroup}>
            <label htmlFor="court">Наименование суда *</label>
            <select
              id="court"
              value={selectedCourtId}
              onChange={handleCourtChange}
              className={styles.select}
              disabled={
                submitting || 
                success || 
                !selectedRegionId || 
                loadingCourts || 
                courtsByRegion.length === 0
              }
            >
              <option value="">
                {!selectedRegionId ? 'Сначала выберите регион' :
                 loadingCourts ? 'Загрузка судов...' :
                 courtsByRegion.length === 0 ? 'Нет судов в этом регионе' :
                 'Выберите суд'}
              </option>
              {courtsByRegion.map(court => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
            {selectedRegionId && courtsByRegion.length === 0 && !loadingCourts && (
              <span className={styles.hint} style={{ color: '#e53e3e' }}>
                ⚠️ В выбранном регионе нет судов
              </span>
            )}
          </div>
          
          {/* Отображение выбранного суда (только для информации) */}
          {formData.court_name && (
            <div className={styles.selectedCourt}>
              <span className={styles.selectedCourtLabel}>Выбран суд:</span>
              <span className={styles.selectedCourtName}>{formData.court_name}</span>
            </div>
          )}
        </div>

        {/* ===== РАЗДЕЛ 2. СВЕДЕНИЯ ОБ ИСТЦЕ ===== */}
        <div className={styles.formSection}>
          <h3>2. Сведения об истце</h3>
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

        {/* ===== РАЗДЕЛ 3. СВЕДЕНИЯ ОБ ОТВЕТЧИКЕ ===== */}
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
        </div>

        {/* ===== РАЗДЕЛ 4. ТРЕТЬИ ЛИЦА ===== */}
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

        {/* ===== РАЗДЕЛ 5. ПРЕДМЕТ И ЦЕНА ИСКА ===== */}
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
          </div>
        </div>

        {/* ===== РАЗДЕЛ 6. ОБСТОЯТЕЛЬСТВА ДЕЛА ===== */}
        <div className={styles.formSection}>
          <h3>6. Обстоятельства дела</h3>
          <div className={styles.formGroup}>
            <label htmlFor="circumstances">Обстоятельства, на которых основан иск *</label>
            <textarea
              id="circumstances"
              name="circumstances"
              value={formData.circumstances}
              onChange={handleChange}
              rows={5}
              className={styles.textarea}
              placeholder="Подробно опишите, что, когда, где произошло"
              disabled={submitting || success}
            />
          </div>
        </div>

        {/* ===== РАЗДЕЛ 7. ТРЕБОВАНИЯ ИСТЦА ===== */}
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
              placeholder="Четко сформулируйте, что вы просите суд"
              disabled={submitting || success}
            />
          </div>
        </div>

        {/* ===== РАЗДЕЛ 8. ПРИЛАГАЕМЫЕ ДОКУМЕНТЫ ===== */}
        <div className={styles.formSection}>
          <h3>8. Прилагаемые документы</h3>
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
          </div>
        </div>

        {/* ===== РАЗДЕЛ 9. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===== */}
        <div className={styles.formSection}>
          <h3>9. Дополнительная информация</h3>
          <div className={styles.formGroup}>
            <label htmlFor="additional_notes">Иные сведения</label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
              placeholder="Любые дополнительные сведения"
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
              placeholder="ФИО подателя"
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

        {/* ===== КНОПКИ ===== */}
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
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SideClaimForm;