import React, { useState, useEffect } from 'react';
import { Payment, Member, Membership, GymSettingsData, PaymentMethod, PaymentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  DollarSign,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

interface PaymentsViewProps {
  settings?: GymSettingsData | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ settings }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Receipt modal state
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // New Payment Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');
  const [memberMemberships, setMemberMemberships] = useState<Membership[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (methodFilter !== 'ALL') query.append('method', methodFilter);
      if (searchTerm.trim()) query.append('search', searchTerm.trim());

      const res = await fetch(`/api/payments?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, statusFilter]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  // When member is selected in Add Payment modal, fetch their memberships and balance
  const handleMemberChange = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setSelectedMembershipId('');
    setPreviousBalance(0);
    setAmount(0);

    if (!memberId) return;

    try {
      const res = await fetch(`/api/members/${memberId}`);
      if (res.ok) {
        const memberData: Member = await res.json();
        const mems = memberData.memberships || [];
        setMemberMemberships(mems);

        // Calculate pending balance across memberships
        const pending = mems.reduce((acc, curr) => acc + curr.remainingAmount, 0);
        setPreviousBalance(pending);
        setAmount(pending > 0 ? pending : 0);
        if (mems.length > 0) {
          setSelectedMembershipId(mems[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const remainingBalance = Math.max(0, previousBalance - amount);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedMemberId) {
      setFormError('Please select a member.');
      return;
    }
    if (amount <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          membershipId: selectedMembershipId || null,
          amount,
          paymentMethod,
          previousBalance,
          remainingBalance,
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record payment');
      } else {
        setShowAddModal(false);
        fetchPayments();
        // Immediately show the receipt for printing!
        setSelectedReceiptPayment(data);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Receipt No', 'Member Name', 'Member ID', 'Date', 'Amount', 'Method', 'Remaining Balance', 'Status'];
    const rows = payments.map(p => [
      p.receiptNumber,
      `"${p.member?.fullName || ''}"`,
      p.member?.memberId || '',
      new Date(p.paymentDate).toLocaleDateString(),
      p.amount,
      p.paymentMethod,
      p.remainingBalance,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currency = settings?.currency || '$';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>Fee &amp; Payment Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track transactions, record incoming payments, print official receipts, and audit balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="add-payment-btn"
            onClick={() => {
              setSelectedMemberId('');
              setSelectedMembershipId('');
              setAmount(0);
              setPreviousBalance(0);
              setRemarks('');
              setFormError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="payments-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search receipt, member name or ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="ALL">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="BankTransfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            >
              <option value="ALL">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Receipt No</th>
                <th className="py-3 px-4 font-semibold">Member</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Amount Paid</th>
                <th className="py-3 px-4 font-semibold">Remaining Due</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Cashier</th>
                <th className="py-3 px-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{p.member?.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{p.member?.memberId}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      +{currency}{p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={p.remainingBalance > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                        {currency}{p.remainingBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.receivedBy?.name || 'Staff'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceiptPayment(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Record Fee Payment</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Member *</label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberId})
                    </option>
                  ))}
                </select>
              </div>

              {memberMemberships.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apply to Subscription</label>
                  <select
                    value={selectedMembershipId}
                    onChange={(e) => setSelectedMembershipId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {memberMemberships.map((mem) => (
                      <option key={mem.id} value={mem.id}>
                        {mem.plan?.name} (Due: {currency}{mem.remainingAmount.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Previous Balance</label>
                  <div className="py-2 px-3 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-700">
                    {currency}{previousBalance.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paying *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-600 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-slate-600">Remaining Balance after this payment:</span>
                <span className={`font-mono font-bold ${remainingBalance > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {currency}{remainingBalance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Online">Online / UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Monthly fee installment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Submit & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
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
