import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Receipt,
  FileBarChart2,
  UserCog,
  Bell,
  ScrollText,
  Settings,
  LogOut,
  AlertCircle,
  BadgePercent,
  X
} from 'lucide-react';

export type NavView =
  | 'dashboard'
  | 'members'
  | 'memberships'
  | 'payments'
  | 'pending'
  | 'attendance'
  | 'trainers'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'notifications'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  pendingCount = 0,
  unreadNotificationsCount = 0
}) => {
  const { user, logout, isSuperAdmin, isAdmin, isReceptionist } = useAuth();

  const handleNav = (view: NavView) => {
    onNavigate(view);
    onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'members' as NavView,
      label: 'Members',
      icon: Users,
      visible: true
    },
    {
      id: 'memberships' as NavView,
      label: 'Memberships',
      icon: BadgePercent,
      visible: !user?.role || user.role !== 'TRAINER'
    },
    {
      id: 'payments' as NavView,
      label: 'Payments',
      icon: CreditCard,
      visible: !user?.role || user.role !== 'TRAINER'
    },
    {
      id: 'pending' as NavView,
      label: 'Pending Fees',
      icon: AlertCircle,
      badge: pendingCount > 0 ? pendingCount : undefined,
      visible: !user?.role || user.role !== 'TRAINER'
    },
    {
      id: 'attendance' as NavView,
      label: 'Attendance',
      icon: CalendarCheck,
      visible: true
    },
    {
      id: 'trainers' as NavView,
      label: 'Trainers',
      icon: Dumbbell,
      visible: isSuperAdmin || isAdmin
    },
    {
      id: 'expenses' as NavView,
      label: 'Expenses',
      icon: Receipt,
      visible: isSuperAdmin || isAdmin
    },
    {
      id: 'reports' as NavView,
      label: 'Reports & P&L',
      icon: FileBarChart2,
      visible: isSuperAdmin || isAdmin
    },
    {
      id: 'notifications' as NavView,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      visible: true
    },
    {
      id: 'users' as NavView,
      label: 'User Management',
      icon: UserCog,
      visible: isSuperAdmin
    },
    {
      id: 'audit' as NavView,
      label: 'Audit Logs',
      icon: ScrollText,
      visible: isSuperAdmin
    },
    {
      id: 'settings' as NavView,
      label: 'Settings',
      icon: Settings,
      visible: isSuperAdmin
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md font-black text-lg tracking-wider">
              TF
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight uppercase leading-none">TitanForge</h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Gym Management</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Pill */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  user?.role === 'SUPER_ADMIN' ? 'bg-amber-400' :
                  user?.role === 'ADMIN' ? 'bg-indigo-400' :
                  user?.role === 'RECEPTIONIST' ? 'bg-emerald-400' : 'bg-cyan-400'
                }`} />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {user?.role ? user.role.replace('_', ' ') : 'STAFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-indigo-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Logout Footer Button */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
