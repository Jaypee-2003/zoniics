import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Phone, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, FileText } from 'lucide-react';
import client from '../api/client';

const LIMIT = 20;

function ChannelBadge({ channel }) {
  return channel === 'whatsapp'
    ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <MessageSquare size={11} />WhatsApp
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <Phone size={11} />Voice
      </span>
    );
}

function RoleBadge({ role }) {
  return role === 'user'
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">User</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-z-surface text-z-purple border border-z-border">AI</span>;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function truncate(str, n = 80) {
  return str?.length > n ? str.slice(0, n) + '…' : (str || '');
}

export default function LogsPage() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const fetchLogs = useCallback((p = 1) => {
    setLoading(true);
    setError('');
    client.get('/api/interactions', { params: { page: p, limit: LIMIT } })
      .then(r => {
        setRows(r.data.interactions);
        setTotal(r.data.total);
        setPage(p);
      })
      .catch(err => {
        if (!err.response) setError('Cannot reach the backend server. Is it running on port 8000?');
        else setError(err.response.data?.error || 'Failed to load interactions.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-z-text">Chat Logs</h1>
          <p className="text-z-muted text-sm mt-0.5">
            {total > 0 ? `${total.toLocaleString()} total interactions` : 'All customer interactions'}
          </p>
        </div>
        <button onClick={() => fetchLogs(page)} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-z-border rounded-xl text-sm text-z-muted hover:text-z-text hover:border-z-blue hover:shadow-sm transition-all disabled:opacity-40">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <span>{error}</span>
            <button onClick={() => fetchLogs(page)} className="ml-3 underline underline-offset-2 font-medium">Retry</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-z-border rounded-2xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-z-border bg-z-bg">
                {['Phone', 'Channel', 'Role', 'Message', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-z-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-z-border/60">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-14">
                    <div className="flex items-center justify-center gap-2 text-z-muted text-sm">
                      <RefreshCw size={15} className="animate-spin text-z-blue" /> Loading…
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-z-muted text-sm">
                      <FileText size={28} className="opacity-30" />
                      No interactions yet. Send a WhatsApp message to get started.
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.map((row, i) => (
                <tr key={row._id}
                  className={`hover:bg-z-bg transition-colors ${i % 2 !== 0 ? 'bg-z-bg/40' : ''}`}>
                  <td className="px-5 py-3.5 font-mono text-z-text text-xs">{row.customerPhone}</td>
                  <td className="px-5 py-3.5"><ChannelBadge channel={row.channel} /></td>
                  <td className="px-5 py-3.5"><RoleBadge role={row.role} /></td>
                  <td className="px-5 py-3.5 text-z-muted max-w-xs">{truncate(row.message)}</td>
                  <td className="px-5 py-3.5 text-z-muted whitespace-nowrap text-xs">{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden">
          {loading && (
            <div className="flex items-center justify-center py-14 gap-2 text-z-muted text-sm">
              <RefreshCw size={15} className="animate-spin text-z-blue" /> Loading…
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="flex flex-col items-center py-14 gap-2 text-z-muted text-sm">
              <FileText size={28} className="opacity-30" />
              No interactions yet.
            </div>
          )}
          {!loading && rows.map((row, i) => (
            <div key={row._id} className={`p-4 border-b border-z-border/60 last:border-0 ${i % 2 !== 0 ? 'bg-z-bg/40' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-medium text-z-text">{row.customerPhone}</span>
                <span className="text-xs text-z-muted">{formatDate(row.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <ChannelBadge channel={row.channel} />
                <RoleBadge role={row.role} />
              </div>
              <p className="text-xs text-z-muted leading-relaxed">{truncate(row.message, 120)}</p>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-t border-z-border bg-z-bg/50">
            <span className="text-xs text-z-muted">Page {page} of {totalPages} ({total.toLocaleString()} total)</span>
            <div className="flex gap-2">
              <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-z-border text-z-muted hover:text-z-text hover:border-z-blue hover:bg-white disabled:opacity-30 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg border border-z-border text-z-muted hover:text-z-text hover:border-z-blue hover:bg-white disabled:opacity-30 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
