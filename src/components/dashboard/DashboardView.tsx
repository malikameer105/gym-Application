import React, { useState, useEffect } from 'react';
import { DashboardStats, Payment, GymSettingsData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CalendarCheck,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Eye,
  UserCheck
} from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  settings?: GymSettingsData | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, settings }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // Quick Check-In state inside dashboard
  const [quickCheckInCode, setQuickCheckInCode] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCheckInCode.trim()) return;

    setIsCheckingIn(true);
    setCheckInMessage(null);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberCode: quickCheckInCode.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setCheckInMessage({
          text: `Check-in recorded for ${data.attendance?.member?.fullName}!`
        });
        setQuickCheckInCode('');
        fetchStats();
      } else {
        setCheckInMessage({ text: data.error || 'Check-in failed', isError: true });
      }
    } catch (err: any) {
      setCheckInMessage({ text: err.message || 'Error recording check-in', isError: true });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const currency = settings?.currency || '$';

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  const { members, payments, expenses, profit } = stats || {
    members: { total: 0, active: 0, inactive: 0, expired: 0, newThisMonth: 0, expiringSoonCount: 0, expiring15DaysCount: 0, expiring30DaysCount: 0, expiringSoonList: [] },
    payments: { todayCollection: 0, monthlyCollection: 0, totalReceived: 0, pendingFees: 0, overdueFees: 0 },
    expenses: { todayExpenses: 0, monthlyExpenses: 0, yearlyExpenses: 0 },
    profit: { monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0 },
    todayAttendanceCount: 0,
    recentPayments: [],
    recentCheckins: []
  };

  const isProfitPositive = profit.monthlyProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance, membership renewals, and financial metrics.
          </p>
        </div>

        {/* Quick Check-In Form */}
        <form onSubmit={handleQuickCheckIn} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="dashboard-checkin-input"
              type="text"
              value={quickCheckInCode}
              onChange={(e) => setQuickCheckInCode(e.target.value)}
              placeholder="Enter Member ID or Phone..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            id="dashboard-checkin-submit-btn"
            type="submit"
            disabled={isCheckingIn || !quickCheckInCode.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
          >
            {isCheckingIn ? '...' : 'Check-In'}
          </button>
        </form>
      </div>

      {checkInMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            checkInMessage.isError
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{checkInMessage.text}</span>
          <button
            onClick={() => setCheckInMessage(null)}
            className="font-bold ml-2 text-slate-500 hover:text-slate-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Expiring Memberships Alert Banner if any */}
      {members.expiringSoonCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-900">
              {members.expiringSoonCount} Membership{members.expiringSoonCount > 1 ? 's' : ''} Expiring Within 7 Days
            </p>
            <p className="text-amber-700 mt-0.5">
              Review expiring subscriptions to follow up for renewals and maintain recurring revenue.
            </p>
          </div>
          <button
            onClick={() => onNavigate('pending')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0 cursor-pointer"
          >
            Review Renewals
          </button>
        </div>
      )}

      {/* PRIMARY STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members Metric Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Members</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {members.active} <span className="text-xs font-normal text-slate-400">/ {members.total} total</span>
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span>{members.newThisMonth} new this month</span>
              <span className="text-amber-600 font-semibold">{members.expired} expired</span>
            </div>
          </div>
        </div>

        {/* Collections Metric Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {currency}{payments.monthlyCollection.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span>Today: {currency}{payments.todayCollection.toFixed(2)}</span>
              <span className="font-medium text-slate-700">Total: {currency}{payments.totalReceived.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Metric Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {currency}{expenses.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span>Today: {currency}{expenses.todayExpenses.toFixed(2)}</span>
              <span className="text-slate-700">Yearly: {currency}{expenses.yearlyExpenses.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit Metric Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net Profit (Monthly)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isProfitPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-bold tracking-tight ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {currency}{profit.monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span>Formula: Revenue &minus; Expenses</span>
              <span className="font-semibold text-indigo-600 cursor-pointer" onClick={() => onNavigate('reports')}>
                Details &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: PENDING FEES & TODAY'S ATTENDANCE HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Fee Callout */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Pending Fees</span>
            <p className="text-xl font-bold text-amber-600 mt-1">
              {currency}{payments.pendingFees.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {payments.overdueFees > 0 ? `${currency}${payments.overdueFees.toFixed(2)} overdue` : 'No overdue accounts'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('pending')}
            className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Check-ins Today */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Today's Check-Ins</span>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {stats?.todayAttendanceCount || 0} Members
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active gym floor attendance</p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Membership Renewals Outlook */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Expiring in 30 Days</span>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {members.expiring30DaysCount} Subscriptions
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Retention pipeline</p>
          </div>
          <button
            onClick={() => onNavigate('memberships')}
            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Plans</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITY TABLES (PAYMENTS & RECENT ATTENDANCE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Received */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Payments Received</h3>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              All Payments &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No payment records yet</p>
            ) : (
              stats?.recentPayments?.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{p.member?.fullName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{p.receiptNumber}</span>
                      <span>&bull;</span>
                      <span>{p.paymentMethod}</span>
                      <span>&bull;</span>
                      <span>{new Date(p.paymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-emerald-600">
                      +{currency}{p.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setSelectedReceiptPayment(p)}
                      title="View Receipt"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Gym Floor Check-ins */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Recent Check-Ins</h3>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Attendance Log &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentCheckins?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No check-in entries today</p>
            ) : (
              stats?.recentCheckins?.map((att) => (
                <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{att.member?.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {att.member?.memberId}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {att.checkOut ? 'Checked Out' : 'Active On Floor'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Receipt View Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          payment={selectedReceiptPayment}
          settings={settings}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}
    </div>
  );
};
