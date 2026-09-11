import React, { useState, useEffect } from 'react';
import { MembershipPlan, Member, Membership, GymSettingsData, Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BadgePercent,
  Plus,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle,
  FileCheck,
  Edit2,
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

interface MembershipsViewProps {
  settings?: GymSettingsData | null;
}

export const MembershipsView: React.FC<MembershipsViewProps> = ({ settings }) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'register' | 'plans' | 'activeMemberships'>('register');

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    duration: 1,
    price: 50,
    description: '',
    status: 'Active'
  });

  // Registration Form State
  const [regMemberId, setRegMemberId] = useState<string>('');
  const [regPlanId, setRegPlanId] = useState<string>('');
  const [regStartDate, setRegStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [regEndDate, setRegEndDate] = useState<string>('');
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [remarks, setRemarks] = useState<string>('');

  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdReceiptPayment, setCreatedReceiptPayment] = useState<Payment | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, membersRes, membershipsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/members'),
        fetch('/api/memberships')
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (membershipsRes.ok) setMemberships(await membershipsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When plan or start date changes, automatically calculate end date and default price
  useEffect(() => {
    if (!regPlanId) return;
    const selectedPlan = plans.find(p => p.id === regPlanId);
    if (selectedPlan) {
      setPlanPrice(selectedPlan.price);
      setPaidAmount(selectedPlan.price - discount);

      if (regStartDate) {
        const start = new Date(regStartDate);
        const end = new Date(start);
        end.setMonth(start.getMonth() + selectedPlan.duration);
        setRegEndDate(end.toISOString().slice(0, 10));
      }
    }
  }, [regPlanId, regStartDate]);

  // Derived calculations
  const netAmount = Math.max(0, planPrice - discount);
  const remainingBalance = Math.max(0, netAmount - paidAmount);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!regMemberId) {
      setFormError('Please select a member.');
      return;
    }
    if (!regPlanId) {
      setFormError('Please select a membership plan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/memberships/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: regMemberId,
          planId: regPlanId,
          startDate: regStartDate,
          endDate: regEndDate,
          planPrice,
          discount,
          netAmount,
          paidAmount,
          paymentMethod,
          remarks
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to register membership');
      } else {
        // Reset form
        setRegMemberId('');
        setRegPlanId('');
        setDiscount(0);
        setRemarks('');
        fetchData();

        // If payment was generated, show receipt modal!
        if (data.payment) {
          setCreatedReceiptPayment(data.payment);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planFormData)
      });

      if (res.ok) {
        setShowPlanModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save plan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currency = settings?.currency || '$';

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-indigo-600" />
            <span>Memberships &amp; Subscriptions</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register new member subscriptions, manage pricing tiers, and track active renewals.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'register' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Membership
          </button>
          <button
            onClick={() => setActiveTab('activeMemberships')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'activeMemberships' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subscriptions List
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'plans' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Plans
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTRATION FORM */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-sm font-bold text-slate-900">New Membership Registration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select member, choose subscription plan, record payment, and generate receipt.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Member Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Member *</label>
                <select
                  id="membership-select-member"
                  required
                  value={regMemberId}
                  onChange={(e) => setRegMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberId}) - {m.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Membership Plan *</label>
                <select
                  id="membership-select-plan"
                  required
                  value={regPlanId}
                  onChange={(e) => setRegPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration} {p.duration === 1 ? 'Month' : 'Months'}) - {currency}{p.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={regStartDate}
                  onChange={(e) => setRegStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date (Auto-calculated)</label>
                <input
                  type="date"
                  required
                  value={regEndDate}
                  onChange={(e) => setRegEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Financial Calculation Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Pricing &amp; Payment Calculation
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Plan Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Discount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Net Payable Amount</label>
                  <div className="py-2 px-3 bg-slate-200/70 border border-slate-300 rounded-lg font-mono font-bold text-slate-900">
                    {currency}{netAmount.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Initial Paid Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-600 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">Pending / Remaining Balance:</span>
                <span className={`text-sm font-mono font-bold ${remainingBalance > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {currency}{remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
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
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Paid in full at front counter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                id="submit-register-membership-btn"
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering...' : 'Register & Generate Receipt'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ACTIVE SUBSCRIPTIONS LIST */}
      {activeTab === 'activeMemberships' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Member</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Period</th>
                  <th className="py-3 px-4 font-semibold">Net Price</th>
                  <th className="py-3 px-4 font-semibold">Paid</th>
                  <th className="py-3 px-4 font-semibold">Remaining</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{m.member?.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{m.member?.memberId}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{m.plan?.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(m.startDate).toLocaleDateString()} &minus; {new Date(m.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{currency}{m.netAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{currency}{m.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span className={m.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-400'}>
                        {currency}{m.remainingAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {(isSuperAdmin || isAdmin) && (
            <div className="flex justify-end">
              <button
                id="add-membership-plan-btn"
                onClick={() => {
                  setEditingPlan(null);
                  setPlanFormData({ name: '', duration: 1, price: 50, description: '', status: 'Active' });
                  setShowPlanModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">{p.duration} Months</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description || 'Full gym floor and amenities access.'}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Subscription Fee</span>
                    <p className="text-xl font-bold font-mono text-slate-900">{currency}{p.price}</p>
                  </div>
                  {(isSuperAdmin || isAdmin) && (
                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setPlanFormData({
                          name: p.name,
                          duration: p.duration,
                          price: p.price,
                          description: p.description || '',
                          status: p.status
                        });
                        setShowPlanModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingPlan ? 'Edit Membership Plan' : 'Add New Membership Plan'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  placeholder="e.g. Standard Monthly"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={planFormData.duration}
                    onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planFormData.price}
                    onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planFormData.description}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  placeholder="Included amenities, peak hours, personal training..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={planFormData.status}
                  onChange={(e) => setPlanFormData({ ...planFormData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Receipt Modal after registration */}
      {createdReceiptPayment && (
        <ReceiptModal
          payment={createdReceiptPayment}
          settings={settings}
          onClose={() => setCreatedReceiptPayment(null)}
        />
      )}
    </div>
  );
};
