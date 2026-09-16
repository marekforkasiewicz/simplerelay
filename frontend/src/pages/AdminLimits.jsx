import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Mail, Settings, X, Check } from 'lucide-react';

export default function AdminLimits({ token }) {
  const { t } = useTranslation();
  const [limits, setLimits] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saved, setSaved] = useState(null);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = () => {
    fetch('/api/admin/provider-limits', { headers }).then(r => r.json()).then(setLimits);
  };

  useEffect(load, []);

  const save = async (providerType) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) return;
    await fetch(`/api/admin/provider-limits/${providerType}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ daily_limit: val }),
    });
    setEditing(null);
    setSaved(providerType);
    setTimeout(() => setSaved(null), 2000);
    load();
  };

  const providerIcons = {
    gmail: <Mail size={14} />, outlook: <Mail size={14} />, yahoo: <Mail size={14} />, seznam: <Mail size={14} />,
    mailcz: <Mail size={14} />, icloud: <Mail size={14} />, amazon_ses: <Mail size={14} />, sendgrid: <Mail size={14} />,
    custom: <Settings size={14} />,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('admin.provider_limits')}</h1>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
        {t('admin.provider_limits_desc')}
      </p>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.provider_type')}</th>
              <th style={{ width: 200 }}>{t('admin.daily_limit')}</th>
              <th style={{ width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {limits.map(lim => (
              <tr key={lim.provider_type}>
                <td>
                  <span style={{ marginRight: 8, display: 'inline-flex', verticalAlign: 'middle' }}>{providerIcons[lim.provider_type] || <Mail size={14} />}</span>
                  <strong>{lim.provider_type}</strong>
                </td>
                <td>
                  {editing === lim.provider_type ? (
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      style={{ width: 120, padding: '4px 8px' }}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && save(lim.provider_type)}
                      autoFocus
                    />
                  ) : (
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {lim.daily_limit.toLocaleString()}
                    </span>
                  )}
                </td>
                <td>
                  {editing === lim.provider_type ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => save(lim.provider_type)}>
                        {t('admin.daily_limit_save')}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}><X size={12} /></button>
                    </div>
                  ) : saved === lim.provider_type ? (
                    <span style={{ color: 'var(--success)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={14} /> {t('admin.daily_limit_saved')}</span>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => { setEditing(lim.provider_type); setEditValue(String(lim.daily_limit)); }}
                    >{t('common.edit')}</button>
                  )}
                </td>
              </tr>
            ))}
            {limits.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
