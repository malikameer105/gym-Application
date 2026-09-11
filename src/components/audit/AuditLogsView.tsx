import React, { useState, useEffect } from 'react';
import { AuditLogItem } from '../../types';
import { ScrollText, Search, Filter, Clock, Shield, User } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(term) ||
      log.description.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.recordId && log.recordId.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-600" />
            <span>Security &amp; Operational Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs capturing user actions, administrative adjustments, and sensitive data transactions.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by operator, action, description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          {['ALL', 'AUTH', 'MEMBERS', 'MEMBERSHIPS', 'PAYMENTS', 'EXPENSES', 'USERS', 'ATTENDANCE'].map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors shrink-0 ${
                moduleFilter === mod
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Operator</th>
                <th className="py-3 px-4 font-semibold">Module</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Details</th>
                <th className="py-3 px-4 font-semibold text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-sans text-xs">Loading audit records...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-sans text-xs">No audit logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700' :
                        log.action === 'DELETE' ? 'bg-rose-50 text-rose-700' :
                        log.action === 'LOGIN' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-md break-words">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
