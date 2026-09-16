import { apiFetch } from '../api';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Search, X, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Logs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 50;

  const loadLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (filter) params.set('status', filter);
    if (search) params.set('search', search);

    Promise.all([
      apiFetch(`/api/logs?${params}`).then(r => r.json()),
      apiFetch(`/api/logs/count?${new URLSearchParams(filter ? { status: filter, ...(search ? { search } : {}) } : (search ? { search } : {}))}`).then(r => r.json()),
    ]).then(([data, countData]) => {
      setLogs(data);
      setTotal(countData.count);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { setOffset(0); }, [filter, search]);
  useEffect(() => { loadLogs(); }, [filter, search, offset]);

  const doSearch = () => { setSearch(searchInput); };

  const statusBadge = (status) => {
    const cls = status === 'sent' ? 'badge-success'
      : status === 'failed' ? 'badge-error'
      : status === 'bounced' ? 'badge-error'
      : 'badge-warning';
    return <span className={`badge ${cls}`}>{t(`logs.status_${status}`)}</span>;
  };

  return (
    <div className="page-wide">
      <div className="page-header">
        <h1 className="page-title">{t('logs.title')}</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'sent', 'failed', 'bounced'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === '' ? t('logs.filter_all') : t(`logs.filter_${f}`)}
          </button>
        ))}
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            className="form-input"
            placeholder={t('logs.search_placeholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            style={{ padding: '4px 8px', fontSize: 13, width: 200 }}
          />
          <button className="btn btn-sm btn-secondary" onClick={doSearch}><Search size={14} /></button>
          {search && (
            <button className="btn btn-sm btn-secondary" onClick={() => { setSearchInput(''); setSearch(''); }}><X size={14} /></button>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {total} {t('logs.total_results')}
        </span>
      </div>

      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={48} /></div>
            <div className="empty-state-text">{t('logs.no_logs')}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('logs.time')}</th>
                  <th>{t('logs.sender')}</th>
                  <th>{t('logs.recipient')}</th>
                  <th>{t('logs.subject')}</th>
                  <th>{t('logs.provider')}</th>
                  <th>{t('logs.status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.sender}</td>
                      <td style={{ fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.recipient}</td>
                      <td style={{ fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.subject || '-'}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{log.provider_name || '-'}</td>
                      <td>{statusBadge(log.status)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          {expandedId === log.id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={7} style={{ background: 'var(--bg-secondary)', fontSize: 12, padding: 12 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><strong>{t('logs.client_ip')}:</strong> {log.client_ip || '-'}</div>
                            <div><strong>{t('logs.proxy_ip')}:</strong> {log.proxy_ip || '-'}</div>
                            <div><strong>{t('logs.queue_id')}:</strong> {log.queue_id || '-'}</div>
                            <div><strong>{t('logs.provider')}:</strong> {log.provider_name || '-'}</div>
                          </div>
                          {log.error_message && (
                            <div style={{ marginTop: 8, padding: 8, background: 'var(--bg)', borderRadius: 4, color: 'var(--error)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                              {log.error_message}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <button className="btn btn-sm btn-secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
              <ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> {t('common.back')}
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: '32px' }}>
              {offset + 1} - {offset + logs.length} / {total}
            </span>
            <button className="btn btn-sm btn-secondary" disabled={logs.length < limit} onClick={() => setOffset(offset + limit)}>
              {t('common.next')} <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}