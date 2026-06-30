// TransferForm.jsx - исправленная версия
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTransfer, getCourts, getTransferTypes, getMyCourt,
  getCourtDirectory
} from '../../../API/courtRegistryService';
import CaseSearchInput from './CaseSearchInput';
import '../courtRegistry.shared.css';

const TransferForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courts, setCourts] = useState([]);
  const [directoryCourts, setDirectoryCourts] = useState([]);
  const [types, setTypes] = useState([]);

  const [form, setForm] = useState({
    source_court: '',
    destination_court: '',
    transfer_type: '',
    basis: '',
    basis_document: '',
    is_batch: false,
    notes: '',
    items: [],
  });

  const [newItem, setNewItem] = useState({
    case_number: '',
    case_category: 'civil',
    case_description: '',
    content_type: '',
    object_id: null,
  });

  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    getCourts({ page_size: 200 })
      .then(r => setCourts(r.data.results || r.data))
      .catch(() => {});
    
    getCourtDirectory({ page_size: 500, is_active: true })
      .then(r => setDirectoryCourts(r.data.results || r.data))
      .catch(() => {});
    
    getTransferTypes()
      .then(r => setTypes(r.data))
      .catch(err => console.error('Error loading transfer types:', err));
    
    getMyCourt()
      .then(r => {
        if (r.data) {
          setForm(prev => ({
            ...prev,
            source_court: r.data.id,
            _myCourtLoaded: true
          }));
        }
      })
      .catch(() => setForm(prev => ({ ...prev, _myCourtLoaded: false })));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCaseSelect = (caseData) => {
    console.log('Case selected:', caseData);
    
    setSelectedCase(caseData);
    setNewItem(prev => ({
      ...prev,
      case_number: caseData.case_number,
      content_type: caseData.content_type,
      object_id: caseData.object_id,
      case_description: caseData.description || prev.case_description,
    }));
  };

  const addItem = () => {
    if (!newItem.case_number.trim()) {
      setError('Введите номер дела');
      return;
    }
    
    if (!newItem.content_type || !newItem.object_id) {
      setError('Выберите дело из списка (начните вводить номер для поиска)');
      return;
    }
    
    console.log('Adding item:', newItem);
    
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));
    
    setNewItem({
      case_number: '',
      case_category: 'civil',
      case_description: '',
      content_type: '',
      object_id: null,
    });
    setSelectedCase(null);
    setError(null);
  };

  const removeItem = (idx) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.items.length === 0) {
      setError('Добавьте хотя бы одно дело');
      return;
    }
    
    const invalidItems = form.items.filter(item => !item.content_type || !item.object_id);
    if (invalidItems.length > 0) {
      setError(`У ${invalidItems.length} дел не указан тип или ID. Удалите их и добавьте заново через поиск.`);
      return;
    }
    
    if (!form.source_court || !form.destination_court) {
      setError('Выберите суд-отправитель и суд-получатель');
      return;
    }
    if (!form.transfer_type) {
      setError('Выберите тип передачи');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        source_court: parseInt(form.source_court),
        destination_court: parseInt(form.destination_court),
        transfer_type: parseInt(form.transfer_type),
        items: form.items.map(item => ({
          case_number: item.case_number,
          case_category: item.case_category,
          case_description: item.case_description,
          content_type: item.content_type,
          object_id: item.object_id,
        })),
      };
      
      console.log('Submitting transfer data:', JSON.stringify(data, null, 2));
      
      const response = await createTransfer(data);
      console.log('Transfer created:', response.data);
      navigate('/court-registry/transfers');
    } catch (err) {
      console.error('Error creating transfer:', err);
      console.error('Response data:', err.response?.data);
      
      const msg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('; ')
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Новая передача дел</h1>
          <p className="cr-page-subtitle">Создание передачи дел между судами</p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-header"><h3>Суды и основание</h3></div>
          <div className="cr-card-body">
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Суд-отправитель</label>
                <select className="cr-select" name="source_court" value={form.source_court} onChange={handleChange} required>
                  <option value="">Выберите суд</option>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name_short || c.name || c.code} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="cr-form-group">
                <label className="cr-required">Суд-получатель</label>
                <select className="cr-select" name="destination_court" value={form.destination_court} onChange={handleChange} required>
                  <option value="">Выберите суд из справочника</option>
                  {directoryCourts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.name_short || c.code} ({c.code}) — {c.region_name || c.region?.name || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Тип передачи</label>
                <select className="cr-select" name="transfer_type" value={form.transfer_type} onChange={handleChange} required>
                  <option value="">Выберите тип</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="cr-form-group">
                <label>Документ-основание</label>
                <input className="cr-input" name="basis_document" value={form.basis_document} onChange={handleChange} placeholder="Номер и дата документа" />
              </div>
            </div>
            <div className="cr-form-group">
              <label className="cr-required">Основание передачи</label>
              <textarea className="cr-textarea" name="basis" value={form.basis} onChange={handleChange} required placeholder="Опишите основание передачи дел" />
            </div>
            <div className="cr-form-group">
              <label>Примечания</label>
              <textarea className="cr-textarea" name="notes" value={form.notes} onChange={handleChange} />
            </div>
            <div className="cr-form-group">
              <label>
                <input type="checkbox" name="is_batch" checked={form.is_batch} onChange={handleChange} style={{ marginRight: 8 }} />
                Групповая передача
              </label>
            </div>
          </div>
        </div>

        <div className="cr-card" style={{ marginTop: 20 }}>
          <div className="cr-card-header"><h3>Дела ({form.items.length})</h3></div>
          <div className="cr-card-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Номер дела</label>
                <CaseSearchInput
                  value={newItem.case_number}
                  category={newItem.case_category}
                  placeholder="Введите номер дела для поиска..."
                  onSelect={handleCaseSelect}
                />
                {selectedCase && (
                  <div style={{ fontSize: 12, color: 'var(--cr-success)', marginTop: 4 }}>
                    ✓ Выбрано дело: {selectedCase.description}
                    <span style={{ fontSize: 11, color: 'var(--cr-text-muted)', marginLeft: 8 }}>
                      (ID: {selectedCase.object_id})
                    </span>
                  </div>
                )}
              </div>
              <div style={{ width: 150 }}>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Категория</label>
                <select 
                  className="cr-select" 
                  value={newItem.case_category} 
                  onChange={e => setNewItem(i => ({ ...i, case_category: e.target.value }))}
                >
                  <option value="criminal">Уголовное</option>
                  <option value="civil">Гражданское</option>
                  <option value="admin_code">КоАП</option>
                  <option value="kas">КАС РФ</option>
                </select>
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Описание</label>
                <input 
                  className="cr-input" 
                  value={newItem.case_description} 
                  onChange={e => setNewItem(i => ({ ...i, case_description: e.target.value }))} 
                  placeholder="Краткое описание" 
                />
              </div>
              <button type="button" className="cr-btn cr-btn-primary" onClick={addItem} style={{ height: 40 }}>
                + Добавить
              </button>
            </div>

            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--cr-border)', fontSize: 14 }}>
                <code style={{ minWidth: 120 }}>{item.case_number}</code>
                <span className="cr-badge cr-badge-neutral">{item.case_category}</span>
                <span style={{ flex: 1, color: 'var(--cr-text-secondary)' }}>{item.case_description || '—'}</span>
                {item.content_type && item.object_id ? (
                  <span style={{ fontSize: 11, color: 'var(--cr-success)' }}>✓ привязано (ID: {item.object_id})</span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--cr-danger)' }}>⚠️ не привязано</span>
                )}
                <button type="button" className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => removeItem(i)}>×</button>
              </div>
            ))}
            {form.items.length === 0 && (
              <div className="cr-empty-text">Добавьте дела для передачи (начните вводить номер для поиска)</div>
            )}
          </div>
        </div>

        <div className="cr-form-actions">
          <button type="submit" className="cr-btn cr-btn-primary" disabled={loading}>
            {loading ? 'Создание...' : 'Создать передачу'}
          </button>
          <button type="button" className="cr-btn cr-btn-secondary" onClick={() => navigate('/court-registry/transfers')}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransferForm;