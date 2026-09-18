import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { MembersView } from './components/members/MembersView';
import { MembershipsView } from './components/memberships/MembershipsView';
import { PaymentsView } from './components/payments/PaymentsView';
import { PendingFeesView } from './components/pending/PendingFeesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { TrainersView } from './components/trainers/TrainersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { GymSettingsData } from './types';
import { X, Search, CheckCircle2, AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading, isSuperAdmin, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<GymSettingsData | null>(null);
  const [showLandingPagePreview, setShowLandingPagePreview] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Quick check-in modal state
  const [showQuickCheckInModal, setShowQuickCheckInModal] = useState(false);
  const [quickCheckInCode, setQuickCheckInCode] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Notifications and pending fees counts for sidebar badges
  const [pendingFeesCount, setPendingFeesCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const fetchGymSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBadgeCounts = async () => {
    try {
      const [pendingRes, notifRes] = await Promise.all([
        fetch('/api/reports/pending-fees'),
        fetch('/api/notifications')
      ]);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingFeesCount(pendingData.length);
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotificationsCount(notifData.filter((n: any) => !n.read).length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGymSettings();
      fetchBadgeCounts();
    }
  }, [user]);

  const handleQuickCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCheckInCode.trim()) return;

    setIsCheckingIn(true);
    setCheckInResult(null);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberCode: quickCheckInCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCheckInResult({
          text: `Check-in confirmed for ${data.attendance?.member?.fullName}!`
        });
        setQuickCheckInCode('');
      } else {
        setCheckInResult({ text: data.error || 'Check-in failed', isError: true });
      }
    } catch (err: any) {
      setCheckInResult({ text: err.message || 'Error recording check-in', isError: true });
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Loading TitanForge Gym Management...
        </p>
      </div>
    );
  }

  if (!user) {
    if (showLoginModal) {
      return <LoginPage onBackToLanding={() => setShowLoginModal(false)} />;
    }
    return <LandingPage onLaunchApp={() => setShowLoginModal(true)} />;
  }

  if (showLandingPagePreview) {
    return <LandingPage onLaunchApp={() => setShowLandingPagePreview(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingCount={pendingFeesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopNavbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenQuickCheckIn={() => {
            setQuickCheckInCode('');
            setCheckInResult(null);
            setShowQuickCheckInModal(true);
          }}
          onNavigateToNotifications={() => setCurrentView('notifications')}
          onViewWebsite={() => setShowLandingPagePreview(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={(view) => setCurrentView(view)}
              settings={settings}
            />
          )}

          {currentView === 'members' && (
            <MembersView settings={settings} />
          )}

          {currentView === 'memberships' && (
            <MembershipsView settings={settings} />
          )}

          {currentView === 'payments' && (
            <PaymentsView settings={settings} />
          )}

          {currentView === 'pending' && (
            <PendingFeesView settings={settings} />
          )}

          {currentView === 'attendance' && (
            <AttendanceView settings={settings} />
          )}

          {currentView === 'trainers' && (
            <TrainersView settings={settings} />
          )}

          {currentView === 'expenses' && (
            <ExpensesView settings={settings} />
          )}

          {currentView === 'reports' && (
            <ReportsView settings={settings} />
          )}

          {currentView === 'users' && isSuperAdmin && (
            <UsersView />
          )}

          {currentView === 'notifications' && (
            <NotificationsView />
          )}

          {currentView === 'audit' && isSuperAdmin && (
            <AuditLogsView />
          )}

          {currentView === 'settings' && isSuperAdmin && (
            <SettingsView onSettingsUpdated={(updated) => setSettings(updated)} />
          )}
        </main>
      </div>

      {/* Quick Check-In Modal from Navbar */}
      {showQuickCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Quick Check-In Terminal</h3>
              <button
                onClick={() => setShowQuickCheckInModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCheckInSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-500">
                Scan member badge or type Member ID (e.g. MBR-1001) or phone number:
              </p>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="modal-quick-checkin-input"
                  type="text"
                  autoFocus
                  required
                  value={quickCheckInCode}
                  onChange={(e) => setQuickCheckInCode(e.target.value)}
                  placeholder="Scan barcode or enter ID / Phone..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {checkInResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    checkInResult.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {checkInResult.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{checkInResult.text}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCheckInModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={isCheckingIn || !quickCheckInCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCheckingIn ? 'Checking...' : 'Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
