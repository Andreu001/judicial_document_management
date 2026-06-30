import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVCSRequest, getCourts, getMyCourt } from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const VCSForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courts, setCourts] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '',
    initiator_court: '',
    participant_courts: [],
    scheduled_at: '', estimated_duration_minutes: 60,
    related_case_number: '', related_case_type: '',
    external_system: '', external_link: '',
  });

  useEffect(() => {
    getCourts({ page_size: 200 }).then(r => setCourts(r.data.results || r.data)).catch(() => {});
    // Автоопределение суда-инициатора (если доступно)
    getMyCourt()
      .then(r => setForm(prev => ({ ...prev, initiator_court: r.data.id, _myCourtLoaded: true })))
      .catch(() => setForm(prev => ({ ...prev, _myCourtLoaded: false })));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (courtId) => {
    setForm(prev => ({
      ...prev,
      participant_courts: prev.participant_courts.includes(courtId)
        ? prev.participant_courts.filter(id => id !== courtId)
        : [...prev.participant_courts, courtId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduled_at || !form.initiator_court) { setError('Заполните обязательные поля'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        initiator_court: parseInt(form.initiator_court),
        participant_courts: form.participant_courts.map(id => parseInt(id)),
        estimated_duration_minutes: parseInt(form.estimated_duration_minutes),
        related_case_type: form.related_case_type || null,
      };
      await createVCSRequest(data);
      navigate('/court-registry/vcs');
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
        : err.message;
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="cr-container">
      <div className="cr-page-header"><div><h1 className="cr-page-title">Новый запрос ВКС</h1></div></div>
      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-body">
            <div className="cr-form-group">
              <label className="cr-required">Тема ВКС</label>
              <input className="cr-input" name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Суд-инициатор</label>
                <select className="cr-select" name="initiator_court" value={form.initiator_court} onChange={handleChange} required disabled={form._myCourtLoaded !== false}>
                  <option value="">{form._myCourtLoaded === false ? 'Выберите суд' : 'Ваш суд (авто)'}</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.name_short || c.name}</option>)}
                </select>
              </div>
              <div className="cr-form-group">
                <label>Продолжительность (мин)</label>
                <input className="cr-input" type="number" name="estimated_duration_minutes" value={form.estimated_duration_minutes} onChange={handleChange} min={15} max={480} />
              </div>
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Дата и время</label>
                <input className="cr-input" type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} required />
              </div>
              <div className="cr-form-group">
                <label>Номер связанного дела</label>
                <input className="cr-input" name="related_case_number" value={form.related_case_number} onChange={handleChange} />
              </div>
            </div>
            <div className="cr-form-group">
              <label>Описание / Повестка</label>
              <textarea className="cr-textarea" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label>Внешняя система ВКС</label>
                <input className="cr-input" name="external_system" value={form.external_system} onChange={handleChange} placeholder="Напр. TrueConf, Vinteo" />
              </div>
              <div className="cr-form-group">
                <label>Ссылка на ВКС</label>
                <input className="cr-input" type="url" name="external_link" value={form.external_link} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="cr-card" style={{ marginTop: 20 }}>
          <div className="cr-card-header"><h3>Суды-участники ({form.participant_courts.length})</h3></div>
          <div className="cr-card-body">
            {courts.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.participant_courts.includes(c.id)} onChange={() => toggleParticipant(c.id)} />
                {c.name_short || c.name} <span style={{color:'var(--cr-text-muted)',fontSize:12}}>({c.code})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="cr-form-actions">
          <button type="submit" className="cr-btn cr-btn-primary" disabled={loading}>{loading ? 'Создание...' : 'Создать запрос ВКС'}</button>
          <button type="button" className="cr-btn cr-btn-secondary" onClick={() => navigate('/court-registry/vcs')}>Отмена</button>
        </div>
      </form>
    </div>
  );
};

export default VCSForm;
