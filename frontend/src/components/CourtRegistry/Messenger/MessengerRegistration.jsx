import React, { useState, useEffect } from 'react';
import {
  getMyRegistration, registerMessenger, pingMessenger,
  updateMessengerSettings, syncMessengerData,
} from '../../../API/courtRegistryService';
import '../courtRegistry.shared.css';

const MessengerRegistration = () => {
  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [settings, setSettings] = useState({
    court_name_in_messenger: '',
    court_code_in_messenger: '',
    allow_intercourt_chats: true,
    allow_interregional_chats: true,
    allow_higher_instance_chats: true,
  });

  useEffect(() => { loadRegistration(); }, []);

  const loadRegistration = async () => {
    setLoading(true);
    try {
      const res = await getMyRegistration();
      setReg(res.data);
      setSettings({
        court_name_in_messenger: res.data.court_name_in_messenger || '',
        court_code_in_messenger: res.data.court_code_in_messenger || '',
        allow_intercourt_chats: res.data.allow_intercourt_chats,
        allow_interregional_chats: res.data.allow_interregional_chats,
        allow_higher_instance_chats: res.data.allow_higher_instance_chats,
      });
    } catch (err) {
      setError('Пользователь не привязан к суду или нет доступа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setActionLoading(true);
    try { await registerMessenger(); alert('Мессенджер зарегистрирован в сети'); loadRegistration(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.error || err.message)); }
    finally { setActionLoading(false); }
  };

  const handlePing = async () => {
    setActionLoading(true);
    try {
      const res = await pingMessenger();
      alert(`Pong! ${new Date(res.data.timestamp).toLocaleTimeString('ru-RU')}`);
      loadRegistration();
    } catch (err) { alert('Ошибка ping'); }
    finally { setActionLoading(false); }
  };

  const handleSync = async () => {
    setActionLoading(true);
    try { const res = await syncMessengerData(); alert(`Синхронизировано: ${res.data.registration?.synced_departments_count} отделов, ${res.data.registration?.synced_employees_count} сотрудников`); loadRegistration(); }
    catch (err) { alert('Ошибка синхронизации'); }
    finally { setActionLoading(false); }
  };

  const handleSaveSettings = async () => {
    setActionLoading(true);
    try { await updateMessengerSettings(settings); alert('Настройки сохранены'); loadRegistration(); }
    catch (err) { alert('Ошибка: ' + (err.response?.data?.error || err.message)); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="cr-container"><div className="cr-loading">Загрузка...</div></div>;
  if (error) return <div className="cr-container"><div className="cr-error">{error}</div></div>;

  return (
    <div className="cr-container">
      <div className="cr-page-header">
        <div>
          <h1 className="cr-page-title">Регистрация мессенджера</h1>
          <p className="cr-page-subtitle">
            {reg?.court_info?.name_short || reg?.court_info?.name}
            {' '}
            {reg?.is_online ? <span className="cr-badge cr-badge-success">Онлайн</span> : <span className="cr-badge cr-badge-neutral">Офлайн</span>}
            {' '}
            {reg?.is_registered ? <span className="cr-badge cr-badge-success">В сети</span> : <span className="cr-badge cr-badge-warning">Не в сети</span>}
          </p>
        </div>
      </div>

      <div className="cr-grid-2" style={{ marginBottom: 24 }}>
        <div className="cr-card">
          <div className="cr-card-header"><h3>Статус</h3></div>
          <div className="cr-card-body">
            <div className="cr-detail-grid">
              <div className="cr-detail-item"><span className="cr-detail-label">Статус</span><span className="cr-detail-value">{reg?.is_online ? '🟢 Онлайн' : '⚫ Офлайн'}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Зарегистрирован</span><span className="cr-detail-value">{reg?.is_registered ? 'Да' : 'Нет'}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Дата регистрации</span><span className="cr-detail-value">{reg?.registered_at ? new Date(reg.registered_at).toLocaleString('ru-RU') : '—'}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Последний ping</span><span className="cr-detail-value">{reg?.last_ping ? new Date(reg.last_ping).toLocaleString('ru-RU') : '—'}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Синхр. отделов</span><span className="cr-detail-value">{reg?.synced_departments_count || 0}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Синхр. сотрудников</span><span className="cr-detail-value">{reg?.synced_employees_count || 0}</span></div>
              <div className="cr-detail-item"><span className="cr-detail-label">Посл. синхронизация</span><span className="cr-detail-value">{reg?.last_sync_at ? new Date(reg.last_sync_at).toLocaleString('ru-RU') : '—'}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {!reg?.is_registered && <button className="cr-btn cr-btn-primary" onClick={handleRegister} disabled={actionLoading}>Зарегистрировать</button>}
              <button className="cr-btn cr-btn-secondary" onClick={handlePing} disabled={actionLoading}>Ping</button>
              <button className="cr-btn cr-btn-secondary" onClick={handleSync} disabled={actionLoading}>Синхронизировать</button>
            </div>
          </div>
        </div>

        <div className="cr-card">
          <div className="cr-card-header"><h3>Настройки</h3></div>
          <div className="cr-card-body">
            <div className="cr-form-group">
              <label>Название в мессенджере</label>
              <input className="cr-input" value={settings.court_name_in_messenger} onChange={e => setSettings(s => ({ ...s, court_name_in_messenger: e.target.value }))} />
            </div>
            <div className="cr-form-group">
              <label>Код в мессенджере</label>
              <input className="cr-input" value={settings.court_code_in_messenger} onChange={e => setSettings(s => ({ ...s, court_code_in_messenger: e.target.value }))} />
            </div>
            <div className="cr-form-group">
              <label><input type="checkbox" checked={settings.allow_intercourt_chats} onChange={e => setSettings(s => ({ ...s, allow_intercourt_chats: e.target.checked }))} style={{ marginRight: 8 }} />Межсудебные чаты</label>
            </div>
            <div className="cr-form-group">
              <label><input type="checkbox" checked={settings.allow_interregional_chats} onChange={e => setSettings(s => ({ ...s, allow_interregional_chats: e.target.checked }))} style={{ marginRight: 8 }} />Межрегиональные чаты</label>
            </div>
            <div className="cr-form-group">
              <label><input type="checkbox" checked={settings.allow_higher_instance_chats} onChange={e => setSettings(s => ({ ...s, allow_higher_instance_chats: e.target.checked }))} style={{ marginRight: 8 }} />Чаты с вышестоящими инстанциями</label>
            </div>
            <button className="cr-btn cr-btn-primary" onClick={handleSaveSettings} disabled={actionLoading}>Сохранить настройки</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerRegistration;
