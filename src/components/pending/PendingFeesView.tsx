import React, { useState, useEffect } from 'react';
import { Membership, GymSettingsData, Payment } from '../../types';
import {
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  Send,
  Download,
  Printer,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

interface PendingFeesViewProps {
  settings?: GymSettingsData | null;
}

export const PendingFeesView: React.FC<PendingFeesViewProps> = ({ settings }) => {
  const [pendingList, setPendingList] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Collect Fee Modal state
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const fetchPendingFees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/pending-fees');
      if (res.ok) {
        const data = await res.json();
        setPendingList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFees();
  }, []);

  const totalPendingAmount = pendingList.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const unpaidCount = pendingList.filter(m => m.paidAmount === 0).length;
  const partialCount = pendingList.filter(m => m.paidAmount > 0 && m.remainingAmount > 0).length;
  const overdueCount = pendingList.filter(m => new Date(m.endDate) < new Date()).length;

  const filteredList = pendingList.filter(m => {
    const matchesSearch =
      m.member?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.member?.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.member?.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'UNPAID') return m.paidAmount === 0;
    if (statusFilter === 'PARTIAL') return m.paidAmount > 0 && m.remainingAmount > 0;
    if (statusFilter === 'OVERDUE') return new Date(m.endDate) < new Date();
    return true;
  });

  const handleOpenCollect = (mem: Membership) => {
    setSelectedMembership(mem);
    setAmount(mem.remainingAmount);
    setPaymentMethod('Cash');
    setRemarks(`Fee settlement for ${mem.plan?.name}`);
    setFormError('');
  };

  const handleCollectFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembership) return;
    if (amount <= 0) {
      setFormError('Amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMembership.memberId,
          membershipId: selectedMembership.id,
          amount,
          paymentMethod,
          previousBalance: selectedMembership.remainingAmount,
          remainingBalance: Math.max(0, selectedMembership.remainingAmount - amount),
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to collect payment');
      } else {
        setSelectedMembership(null);
        fetchPendingFees();
        // Open receipt modal!
        setReceiptPayment(data);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminder = (mem: Membership) => {
    const text = `Hello ${mem.member?.fullName}, this is a friendly reminder from TitanForge Gym regarding your outstanding membership balance of ${settings?.currency || '$'}${mem.remainingAmount.toFixed(2)} for ${mem.plan?.name}. Please visit the front desk to settle. Thank you!`;
    const encoded = encodeURIComponent(text);
    // WhatsApp/SMS intent link
    window.open(`https://wa.me/${mem.member?.phone.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  const exportCSV = () => {
    const headers = ['Member Name', 'Member ID', 'Phone', 'Plan', 'End Date', 'Net Fee', 'Paid', 'Remaining Balance', 'Status'];
    const rows = filteredList.map(m => [
      `"${m.member?.fullName || ''}"`,
      m.member?.memberId || '',
      m.member?.phone || '',
      `"${m.plan?.name || ''}"`,
      new Date(m.endDate).toLocaleDateString(),
      m.netAmount,
      m.paidAmount,
      m.remainingAmount,
      m.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pending_fees_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Pending Fees &amp; Overdue Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify accounts with unpaid or partial fees, send WhatsApp/SMS reminders, and record settlements.
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Pending Amount</span>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-2">
            {currency}{totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Outstanding receivable balances</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Unpaid Memberships</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{unpaidCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Zero payments made towards plan</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Partial Payments</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{partialCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Partially cleared balance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Overdue Subscriptions</span>
          <p className="text-2xl font-bold text-rose-600 mt-2">{overdueCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Expired with remaining balance</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="pending-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by member name, ID or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { id: 'ALL', label: 'All Pending' },
            { id: 'UNPAID', label: 'Unpaid' },
            { id: 'PARTIAL', label: 'Partial' },
            { id: 'OVERDUE', label: 'Overdue' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Fees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Member</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Plan Name</th>
                <th className="py-3 px-4 font-semibold">End Date</th>
                <th className="py-3 px-4 font-semibold">Total Net Fee</th>
                <th className="py-3 px-4 font-semibold">Paid Fee</th>
                <th className="py-3 px-4 font-semibold">Pending Balance</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">Loading pending fee accounts...</td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-emerald-600 font-medium">
                    All dues are clear! No pending balances found.
                  </td>
                </tr>
              ) : (
                filteredList.map((m) => {
                  const isOverdue = new Date(m.endDate) < new Date();
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{m.member?.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{m.member?.memberId}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {m.member?.phone}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {m.plan?.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                          {new Date(m.endDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {currency}{m.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-600 font-semibold">
                        {currency}{m.paidAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                        {currency}{m.remainingAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : m.status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isOverdue ? 'Overdue' : m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendReminder(m)}
                            title="Send Reminder on WhatsApp/SMS"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenCollect(m)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Fee</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COLLECT FEE MODAL */}
      {selectedMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                Collect Pending Fee: {selectedMembership.member?.fullName}
              </h3>
              <button onClick={() => setSelectedMembership(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectFeeSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  {formError}
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-semibold text-slate-900">{selectedMembership.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding Balance:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {currency}{selectedMembership.remainingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount to Collect *</label>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Online">Online / UPI</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMembership(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          settings={settings}
          onClose={() => setReceiptPayment(null)}
        />
      )}
    </div>
  );
};
