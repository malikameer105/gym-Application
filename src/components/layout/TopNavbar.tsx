import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, CheckCircle, Clock, UserCheck, ShieldCheck, X } from 'lucide-react';
import { NotificationItem } from '../../types';

interface TopNavbarProps {
  onToggleMobileMenu: () => void;
  onOpenQuickCheckIn: () => void;
  onNavigateToNotifications: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleMobileMenu,
  onOpenQuickCheckIn,
  onNavigateToNotifications
}) => {
  const { user } = useAuth();
  const [time, setTime] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecentNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecentNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle-btn"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="font-mono text-slate-700 font-medium">{time}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Check-In CTA Button */}
        <button
          id="top-quick-checkin-btn"
          onClick={onOpenQuickCheckIn}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden xs:inline">Quick Check-In</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotificationsDropdown(prev => !prev)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>

          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Notifications</span>
                <button
                  onClick={() => setShowNotificationsDropdown(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No recent notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${n.read ? 'bg-white opacity-70' : 'bg-indigo-50/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 shrink-0"
                          >
                            <CheckCircle className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(false);
                    onNavigateToNotifications();
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  View All Notifications &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account Info Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-slate-500 font-medium capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
