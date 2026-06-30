import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCourt, createCourt, updateCourt,
  getRegions, getCourtLevels
} from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Пн', tuesday:'Вт', wednesday:'Ср', thursday:'Чт', friday:'Пт', saturday:'Сб', sunday:'Вс' };

const defaultWorkingHours = DAYS.map(d => ({
  day_of_week: d, work_start: '09:00', work_end: '18:00',
  break_start: '13:00', break_end: '14:00', is_working_day: d !== 'sunday',
  reception_start: '09:00', reception_end: '17:00'
}));

const CourtForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [levels, setLevels] = useState([]);

  const [form, setForm] = useState({
    name: '', name_short: '', code: '',
    region: '', level: '',
    address: '', address_juridical: '', postal_code: '',
    email_main: '', website: '',
    is_active: true,
    phones: [],
    emails: [],
    working_hours: defaultWorkingHours,
  });

  const [newPhone, setNewPhone] = useState({ phone: '', phone_type: 'main', description: '' });
  const [newEmail, setNewEmail] = useState({ email: '', email_type: 'general', description: '' });

  useEffect(() => {
    getRegions().then(r => setRegions(r.data.results || r.data)).catch(() => {});
    getCourtLevels().then(l => setLevels(l.data)).catch(() => {});
    if (isEdit) {
      setLoading(true);
      getCourt(id).then(r => {
        const d = r.data;
        setForm({
          name: d.name || '', name_short: d.name_short || '', code: d.code || '',
          region: d.region || '', level: d.level || '',
          address: d.address || '', address_juridical: d.address_juridical || '', postal_code: d.postal_code || '',
          email_main: d.email_main || '', website: d.website || '',
          is_active: d.is_active,
          phones: d.phones || [],
          emails: d.emails || [],
          working_hours: d.working_hours?.length ? d.working_hours : defaultWorkingHours,
        });
      }).catch(err => setError('Не удалось загрузить данные')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addPhone = () => {
    if (!newPhone.phone.trim()) return;
    setForm(prev => ({ ...prev, phones: [...prev.phones, { ...newPhone }] }));
    setNewPhone({ phone: '', phone_type: 'main', description: '' });
  };

  const removePhone = (idx) => {
    setForm(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== idx) }));
  };

  const addEmail = () => {
    if (!newEmail.email.trim()) return;
    setForm(prev => ({ ...prev, emails: [...prev.emails, { ...newEmail }] }));
    setNewEmail({ email: '', email_type: 'general', description: '' });
  };

  const removeEmail = (idx) => {
    setForm(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== idx) }));
  };

  const handleWHChange = (dayIdx, field, value) => {
    setForm(prev => ({
      ...prev,
      working_hours: prev.working_hours.map((wh, i) =>
        i === dayIdx ? { ...wh, [field]: value } : wh
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        region: parseInt(form.region),
        level: parseInt(form.level),
      };
      if (isEdit) {
        await updateCourt(id, data);
      } else {
        await createCourt(data);
      }
      navigate('/court-registry/courts');
    } catch (err) {
      const msg = err.response?.data
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ')
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">{isEdit ? 'Редактирование суда' : 'Добавление суда'}</h1>
          <p className="cr-page-subtitle">{isEdit ? form.name : 'Заполните реквизиты нового суда'}</p>
        </div>
      </div>

      {error && <div className="cr-error">{error}</div>}

      <form className="cr-form" onSubmit={handleSubmit}>
        <div className="cr-card">
          <div className="cr-card-header"><h3>Основные реквизиты</h3></div>
          <div className="cr-card-body">
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Полное наименование</label>
                <input className="cr-input" name="name" value={form.name} onChange={handleChange} required placeholder="Например: Центральный районный суд г. Новосибирска" />
              </div>
              <div className="cr-form-group">
                <label>Краткое наименование</label>
                <input className="cr-input" name="name_short" value={form.name_short} onChange={handleChange} placeholder="Центральный районный суд" />
              </div>
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Код суда</label>
                <input className="cr-input" name="code" value={form.code} onChange={handleChange} required placeholder="Уникальный код" />
              </div>
              <div className="cr-form-group">
                <label>Почтовый индекс</label>
                <input className="cr-input" name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="630000" />
              </div>
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Регион</label>
                <select className="cr-select" name="region" value={form.region} onChange={handleChange} required>
                  <option value="">Выберите регион</option>
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="cr-form-group">
                <label className="cr-required">Уровень суда</label>
                <select className="cr-select" name="level" value={form.level} onChange={handleChange} required>
                  <option value="">Выберите уровень</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="cr-form-group">
              <label className="cr-required">Почтовый адрес</label>
              <input className="cr-input" name="address" value={form.address} onChange={handleChange} required placeholder="ул. Ленина, д. 1" />
            </div>
            <div className="cr-form-group">
              <label>Юридический адрес</label>
              <input className="cr-input" name="address_juridical" value={form.address_juridical} onChange={handleChange} />
            </div>
            <div className="cr-form-row">
              <div className="cr-form-group">
                <label className="cr-required">Основной email</label>
                <input className="cr-input" name="email_main" type="email" value={form.email_main} onChange={handleChange} required />
              </div>
              <div className="cr-form-group">
                <label>Сайт</label>
                <input className="cr-input" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
            <div className="cr-form-group">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{ marginRight: 8 }} />
                Суд активен
              </label>
            </div>
          </div>
        </div>

        <div className="cr-card" style={{ marginTop: 20 }}>
          <div className="cr-card-header"><h3>Телефоны</h3></div>
          <div className="cr-card-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input className="cr-input" style={{ flex: 1, minWidth: 150 }} placeholder="Номер" value={newPhone.phone} onChange={e => setNewPhone(p => ({ ...p, phone: e.target.value }))} />
              <select className="cr-select" style={{ width: 140 }} value={newPhone.phone_type} onChange={e => setNewPhone(p => ({ ...p, phone_type: e.target.value }))}>
                <option value="main">Основной</option><option value="fax">Факс</option><option value="department">Отдел</option><option value="vks">ВКС</option><option value="other">Другой</option>
              </select>
              <input className="cr-input" style={{ flex: 1, minWidth: 150 }} placeholder="Описание" value={newPhone.description} onChange={e => setNewPhone(p => ({ ...p, description: e.target.value }))} />
              <button type="button" className="cr-btn cr-btn-sm cr-btn-primary" onClick={addPhone}>+</button>
            </div>
            {form.phones.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 14 }}>
                <span>{p.phone}</span>
                <span className="cr-badge cr-badge-neutral">{p.phone_type}</span>
                <span style={{ color: 'var(--cr-text-muted)' }}>{p.description}</span>
                <button type="button" className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => removePhone(i)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="cr-card" style={{ marginTop: 20 }}>
          <div className="cr-card-header"><h3>Email-адреса</h3></div>
          <div className="cr-card-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input className="cr-input" style={{ flex: 1, minWidth: 200 }} type="email" placeholder="Email" value={newEmail.email} onChange={e => setNewEmail(p => ({ ...p, email: e.target.value }))} />
              <select className="cr-select" style={{ width: 140 }} value={newEmail.email_type} onChange={e => setNewEmail(p => ({ ...p, email_type: e.target.value }))}>
                <option value="general">Общий</option><option value="department">Отдел</option><option value="vks">ВКС</option><option value="reception">Приёмная</option><option value="other">Другой</option>
              </select>
              <input className="cr-input" style={{ flex: 1, minWidth: 150 }} placeholder="Описание" value={newEmail.description} onChange={e => setNewEmail(p => ({ ...p, description: e.target.value }))} />
              <button type="button" className="cr-btn cr-btn-sm cr-btn-primary" onClick={addEmail}>+</button>
            </div>
            {form.emails.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 14 }}>
                <span>{e.email}</span>
                <span className="cr-badge cr-badge-neutral">{e.email_type}</span>
                <span style={{ color: 'var(--cr-text-muted)' }}>{e.description}</span>
                <button type="button" className="cr-btn cr-btn-sm cr-btn-danger" onClick={() => removeEmail(i)}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="cr-card" style={{ marginTop: 20 }}>
          <div className="cr-card-header"><h3>Режим работы</h3></div>
          <div className="cr-card-body">
            <div className="cr-table-wrap">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>День</th><th>Начало</th><th>Конец</th><th>Перерыв с</th><th>Перерыв по</th><th>Приём с</th><th>Приём по</th><th>Рабочий</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.working_hours || []).map((wh, i) => (
                    <tr key={wh.day_of_week}>
                      <td>{DAY_LABELS[wh.day_of_week]}</td>
                      <td><input className="cr-input" type="time" value={wh.work_start} onChange={e => handleWHChange(i, 'work_start', e.target.value)} /></td>
                      <td><input className="cr-input" type="time" value={wh.work_end} onChange={e => handleWHChange(i, 'work_end', e.target.value)} /></td>
                      <td><input className="cr-input" type="time" value={wh.break_start || ''} onChange={e => handleWHChange(i, 'break_start', e.target.value || null)} /></td>
                      <td><input className="cr-input" type="time" value={wh.break_end || ''} onChange={e => handleWHChange(i, 'break_end', e.target.value || null)} /></td>
                      <td><input className="cr-input" type="time" value={wh.reception_start || ''} onChange={e => handleWHChange(i, 'reception_start', e.target.value || null)} /></td>
                      <td><input className="cr-input" type="time" value={wh.reception_end || ''} onChange={e => handleWHChange(i, 'reception_end', e.target.value || null)} /></td>
                      <td><input type="checkbox" checked={wh.is_working_day} onChange={e => handleWHChange(i, 'is_working_day', e.target.checked)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="cr-form-actions">
          <button type="submit" className="cr-btn cr-btn-primary" disabled={loading}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать суд'}
          </button>
          <button type="button" className="cr-btn cr-btn-secondary" onClick={() => navigate('/court-registry/courts')}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourtForm;
