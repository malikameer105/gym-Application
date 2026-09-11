import React, { useState, useEffect } from 'react';
import { NotificationItem } from '../../types';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Notification Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational alerts, upcoming membership expirations, and financial logs.
          </p>
        </div>

        <button
          id="mark-all-read-btn"
          onClick={markAllAsRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-xs text-slate-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center py-10 text-xs text-slate-400">No notifications found.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-white opacity-80' : 'bg-indigo-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                  n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-indigo-100 text-indigo-600'
                }`}>
                  {n.type === 'WARNING' ? <AlertTriangle className="w-4 h-4" /> :
                   n.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> :
                   <Info className="w-4 h-4" />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markOneRead(n.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
