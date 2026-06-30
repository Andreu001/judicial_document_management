// communication-frontend/src/components/Messenger/Modals/DocumentExchangeModal.jsx
import React, { useState, useEffect } from 'react';
import { documentExchangeService, searchService } from '../services/messengerService';
import styles from '../MessengerApp.module.css';

const DocumentExchangeModal = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('official_letter');
  const [targetCourtCode, setTargetCourtCode] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [requiresResponse, setRequiresResponse] = useState(false);
  const [responseDeadline, setResponseDeadline] = useState('');
  const [courtSearch, setCourtSearch] = useState('');
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async (q = '') => {
    try {
      const res = await searchService.courts({ q });
      setCourts(res.data);
    } catch (e) { console.error(e); }
  };

  const handleCourtSearch = () => {
    loadCourts(courtSearch);
  };

  const handleSend = async () => {
    if (!title.trim() || !targetCourtCode) return;
    setLoading(true);
    try {
      await documentExchangeService.create({
        target_court_code: targetCourtCode,
        target_department: targetDepartment,
        title, description, document_type: documentType,
        reference_number: referenceNumber,
        case_number: caseNumber,
        is_urgent: isUrgent,
        requires_response: requiresResponse,
        response_deadline: responseDeadline || undefined,
      });
      onClose();
    } catch (e) {
      alert('Ошибка отправки документа');
    }
    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span>Межсудебный обмен документом</span>
          <button className={styles.closePanelBtn} onClick={onClose}>&#x2715;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Заголовок</label>
            <input className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <textarea className={styles.formTextarea} value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Тип документа</label>
            <select className={styles.formSelect} value={documentType} onChange={e => setDocumentType(e.target.value)}>
              <option value="official_letter">Служебное письмо</option>
              <option value="ruling">Определение/постановление</option>
              <option value="request">Запрос</option>
              <option value="response">Ответ на запрос</option>
              <option value="notification">Уведомление</option>
              <option value="court_order">Судебное поручение</option>
              <option value="case_materials">Материалы дела</option>
              <option value="stat_report">Статистический отчёт</option>
              <option value="vks_request">Запрос ВКС</option>
              <option value="other">Иное</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Суд-получатель</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className={styles.formInput}
                placeholder="Поиск суда..."
                value={courtSearch}
                onChange={e => setCourtSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCourtSearch()}
              />
              <button className={styles.btnPrimary + ' ' + styles.btnSmall} onClick={handleCourtSearch}>Найти</button>
            </div>
            {selectedCourt && (
              <div className={styles.recipientChip} style={{ marginTop: 8 }}>
                {selectedCourt.name}
                <button onClick={() => { setSelectedCourt(null); setTargetCourtCode(''); }}>&#x2715;</button>
              </div>
            )}
            {courts.slice(0, 5).map(c => (
              <div
                key={c.id}
                className={styles.searchResultItem}
                onClick={() => { setSelectedCourt(c); setTargetCourtCode(c.code); }}
              >
                <div>{c.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{c.region} · {c.level}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Исх. номер</label>
              <input className={styles.formInput} value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>Номер дела</label>
              <input className={styles.formInput} value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Отдел-получатель</label>
            <input className={styles.formInput} value={targetDepartment} onChange={e => setTargetDepartment(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
              Срочно
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={requiresResponse} onChange={e => setRequiresResponse(e.target.checked)} />
              Требует ответа
            </label>
          </div>

          {requiresResponse && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Срок ответа</label>
              <input className={styles.formInput} type="datetime-local" value={responseDeadline} onChange={e => setResponseDeadline(e.target.value)} />
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary + ' ' + styles.btn} onClick={onClose}>Отмена</button>
          <button className={styles.btnPrimary + ' ' + styles.btn} onClick={handleSend} disabled={loading || !title.trim() || !targetCourtCode}>
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentExchangeModal;
