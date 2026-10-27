import React, { useState, useEffect } from 'react';
import type { AuditLogRecord } from '@shared/types/case.js';
import apiClient from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ScrollText,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Activity,
  User,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { user, isAdmin, switchDemoUser } = useAuth();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Audit logs fetch failed or not authorized', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('FORBIDDEN')) {
      return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
    }
    if (action.includes('create')) {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    }
    if (action.includes('update')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
    }
    return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold font-sans text-slate-100">
              System Forensic Audit Log
            </h1>
            <span
              className={`text-xs font-tactical-mono px-2 py-0.5 rounded border ${
                isAdmin
                  ? 'bg-amber-950 text-amber-300 border-amber-600/50'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {isAdmin ? 'ADMIN PRIVILEGES GRANTED' : 'AUDIT RESTRICTED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-tactical-mono mt-1">
            Immutable SQLite transaction log tracking entity access, mutations, and security boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <button
              onClick={() => switchDemoUser('admin')}
              className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 text-xs font-tactical-mono flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Elevate to Admin</span>
            </button>
          )}

          <button
            onClick={fetchLogs}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 text-xs"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by action, user ID, resource..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-64 font-tactical-mono"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-tactical-mono"
          >
            <option value="all">ALL ACTIONS</option>
            <option value="case.create">CASE CREATE</option>
            <option value="case.read">CASE READ</option>
            <option value="case.update">CASE UPDATE</option>
            <option value="case.delete">CASE DELETE</option>
            <option value="dossier.create">DOSSIER CREATE</option>
            <option value="evidence.create">EVIDENCE CREATE</option>
            <option value="note.create">NOTE CREATE</option>
            <option value="timeline.create">TIMELINE CREATE</option>
          </select>
        </div>

        <div className="text-xs font-tactical-mono text-slate-400">
          LOG ENTRIES: <strong className="text-cyan-400">{filteredLogs.length}</strong>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-tactical-mono text-xs animate-pulse">
            Querying SQLite Audit Repositories...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-tactical-mono text-xs space-y-2">
            <ScrollText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No audit events match the selected filters or currently logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-tactical-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Resource Type</th>
                  <th className="p-3">Resource ID</th>
                  <th className="p-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">
                      {log.userId ? log.userId.slice(0, 16) + '...' : 'SYSTEM'}
                    </td>
                    <td className="p-3 uppercase text-slate-400">{log.resourceType}</td>
                    <td className="p-3 text-cyan-400 font-mono text-[11px] truncate max-w-[150px]">
                      {log.resourceId}
                    </td>
                    <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated p-6 rounded-2xl border border-cyan-500/40 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-tactical-mono text-sm font-bold text-cyan-300">
                Audit Record Inspection: {selectedLog.id}
              </h4>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-tactical-mono">
              <div className="flex justify-between"><span className="text-slate-400">Action:</span><span className="text-cyan-300">{selectedLog.action}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Resource:</span><span className="text-slate-200">{selectedLog.resourceType} ({selectedLog.resourceId})</span></div>
              <div className="flex justify-between"><span className="text-slate-400">User:</span><span className="text-slate-200">{selectedLog.userId || 'ANONYMOUS'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Timestamp:</span><span className="text-slate-200">{selectedLog.createdAt}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">IP / User Agent:</span><span className="text-slate-200">{selectedLog.ipAddress || 'local'}</span></div>

              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Payload Details:</span>
                <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
