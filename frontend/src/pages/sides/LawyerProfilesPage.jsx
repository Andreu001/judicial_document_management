import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerService from '../../API/LawyerService';
import styles from './LawyerProfilesPage.module.css';

const LawyerProfilesPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await LawyerService.searchLawyerProfiles(query);
      setProfiles(data || []);
    } catch (err) {
      console.error('Ошибка загрузки реестра адвокатов:', err);
      setError('Не удалось загрузить реестр адвокатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  // debounce поиска
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить запись из реестра?')) return;
    try {
      await LawyerService.deleteLawyerProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить запись');
    }
  };

  const handleSaved = (saved) => {
    setProfiles(prev => {
      const exists = prev.find(p => p.id === saved.id);
      if (exists) {
        return prev.map(p => p.id === saved.id ? saved : p);
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingProfile(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Реестр адвокатов</h1>
        <div className={styles.headerActions}>
          <button
            onClick={() => { setEditingProfile(null); setShowForm(true); }}
            className={styles.addButton}
          >
            + Добавить адвоката
          </button>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Назад
          </button>
        </div>
      </div>

      <div className={styles.searchBlock}>
        <input
          type="text"
          placeholder="Поиск по ФИО, названию фирмы, номеру удостоверения..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading && <div className={styles.loading}>Загрузка...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && profiles.length === 0 && (
        <div className={styles.emptyState}>
          В реестре пока нет адвокатов. Добавьте первого.
        </div>
      )}

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div>ФИО</div>
          <div>Адвокатское образование</div>
          <div>Телефон</div>
          <div>Удостоверение</div>
          <div>Действия</div>
        </div>
        {profiles.map(p => (
          <div key={p.id} className={styles.tableRow}>
            <div className={styles.cellName}>{p.full_name}</div>
            <div>{p.law_firm_name || '—'}</div>
            <div>{p.law_firm_phone || '—'}</div>
            <div>
              {p.lawyer_certificate_number || '—'}
              {p.lawyer_certificate_date && ` от ${new Date(p.lawyer_certificate_date).toLocaleDateString('ru-RU')}`}
            </div>
            <div className={styles.cellActions}>
              <button
                onClick={() => { setEditingProfile(p); setShowForm(true); }}
                className={styles.editButton}
              >
                Редактировать
              </button>
              <button onClick={() => handleDelete(p.id)} className={styles.deleteButton}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <LawyerProfileForm
          initial={editingProfile}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingProfile(null); }}
        />
      )}
    </div>
  );
};

// ---- Внутренняя форма ----
const LawyerProfileForm = ({ initial, onSaved, onCancel }) => {
  const [data, setData] = useState({
    full_name: initial?.full_name || '',
    law_firm_name: initial?.law_firm_name || '',
    law_firm_address: initial?.law_firm_address || '',
    law_firm_phone: initial?.law_firm_phone || '',
    law_firm_email: initial?.law_firm_email || '',
    bank_name: initial?.bank_name || '',
    bank_bik: initial?.bank_bik || '',
    correspondent_account: initial?.correspondent_account || '',
    payment_account: initial?.payment_account || '',
    lawyer_certificate_number: initial?.lawyer_certificate_number || '',
    lawyer_certificate_date: initial?.lawyer_certificate_date || '',
    notes: initial?.notes || '',
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let saved;
      if (initial?.id) {
        saved = await LawyerService.updateLawyerProfile(initial.id, data);
      } else {
        saved = await LawyerService.createLawyerProfile(data);
      }
      onSaved(saved);
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{initial?.id ? 'Редактирование адвоката' : 'Новый адвокат'}</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <Field label="ФИО *" name="full_name" value={data.full_name} onChange={handleChange} required />
            <Field label="Адвокатское образование" name="law_firm_name" value={data.law_firm_name} onChange={handleChange} />
            <Field label="Адрес" name="law_firm_address" value={data.law_firm_address} onChange={handleChange} />
            <Field label="Телефон" name="law_firm_phone" value={data.law_firm_phone} onChange={handleChange} />
            <Field label="Email" name="law_firm_email" type="email" value={data.law_firm_email} onChange={handleChange} />
            <Field label="№ удостоверения" name="lawyer_certificate_number" value={data.lawyer_certificate_number} onChange={handleChange} />
            <Field label="Дата выдачи" name="lawyer_certificate_date" type="date" value={data.lawyer_certificate_date} onChange={handleChange} />
            <Field label="Банк" name="bank_name" value={data.bank_name} onChange={handleChange} />
            <Field label="БИК" name="bank_bik" value={data.bank_bik} onChange={handleChange} />
            <Field label="Корр. счёт" name="correspondent_account" value={data.correspondent_account} onChange={handleChange} />
            <Field label="Расчётный счёт" name="payment_account" value={data.payment_account} onChange={handleChange} />
            <Field label="Примечания" name="notes" value={data.notes} onChange={handleChange} textarea />
          </div>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="is_active" checked={data.is_active} onChange={handleChange} />
            Активен
          </label>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, type = 'text', required = false, textarea = false }) => (
  <div className={styles.field}>
    <label>{label}</label>
    {textarea ? (
      <textarea name={name} value={value || ''} onChange={onChange} rows={3} className={styles.textarea} />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        className={styles.input}
      />
    )}
  </div>
);

export default LawyerProfilesPage;