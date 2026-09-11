import React, { useState, useEffect } from 'react';
import { Member, MemberStatus, Trainer, GymSettingsData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Shield,
  FileText,
  CreditCard,
  CalendarCheck,
  X,
  CheckCircle,
  Clock,
  Download,
  Printer
} from 'lucide-react';

interface MembersViewProps {
  settings?: GymSettingsData | null;
}

export const MembersView: React.FC<MembersViewProps> = ({ settings }) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Member | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    phone: '',
    email: '',
    address: '',
    dob: '',
    gender: 'Male',
    joiningDate: new Date().toISOString().slice(0, 10),
    emergencyContact: '',
    emergencyPhone: '',
    status: 'Active' as MemberStatus,
    trainerId: '',
    notes: ''
  });
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (searchTerm.trim()) query.append('search', searchTerm.trim());

      const res = await fetch(`/api/members?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await fetch('/api/trainers');
      if (res.ok) {
        const data = await res.json();
        setTrainers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter]);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      fatherName: '',
      phone: '',
      email: '',
      address: '',
      dob: '',
      gender: 'Male',
      joiningDate: new Date().toISOString().slice(0, 10),
      emergencyContact: '',
      emergencyPhone: '',
      status: 'Active',
      trainerId: '',
      notes: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      fatherName: member.fatherName || '',
      phone: member.phone,
      email: member.email || '',
      address: member.address || '',
      dob: member.dob ? member.dob.slice(0, 10) : '',
      gender: member.gender || 'Male',
      joiningDate: member.joiningDate ? member.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      status: member.status,
      trainerId: member.trainerId || '',
      notes: member.notes || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setFormError('Full name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members';
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save member.');
      } else {
        setShowAddModal(false);
        fetchMembers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewMemberDetails = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/members/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMemberDetail(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete member ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete member');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const headers = ['Member ID', 'Full Name', 'Phone', 'Email', 'Status', 'Joining Date'];
    const rows = members.map(m => [
      m.memberId,
      `"${m.fullName}"`,
      m.phone,
      m.email || '',
      m.status,
      new Date(m.joiningDate).toLocaleDateString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `members_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currency = settings?.currency || '$';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Member Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered gym members, personal profiles, subscription history, and status tracking.
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
            id="add-new-member-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="members-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, phone, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['ALL', 'Active', 'Inactive', 'Suspended', 'Expired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-semibold">Member</th>
                <th className="py-3.5 px-4 font-semibold">Contact</th>
                <th className="py-3.5 px-4 font-semibold">Current Plan</th>
                <th className="py-3.5 px-4 font-semibold">Trainer</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No members found matching the criteria.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const currentMembership = m.memberships?.[0];
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600 uppercase">
                            {m.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{m.fullName}</p>
                            <p className="text-[11px] font-mono text-slate-500">{m.memberId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">{m.phone}</p>
                        {m.email && <p className="text-slate-400 text-[11px]">{m.email}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        {currentMembership ? (
                          <div>
                            <p className="font-medium text-slate-800">{currentMembership.plan?.name}</p>
                            <p className="text-[11px] text-slate-400">
                              Exp: {new Date(currentMembership.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No active plan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {m.trainer?.name || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            m.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : m.status === 'Expired'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              : m.status === 'Suspended'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {new Date(m.joiningDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => viewMemberDetails(m.id)}
                            title="View Profile & History"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            title="Edit Member"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {(isSuperAdmin || isAdmin) && (
                            <button
                              onClick={() => handleDeleteMember(m.id, m.fullName)}
                              title="Delete Member"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ADD / EDIT MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingMember ? `Edit Member: ${editingMember.fullName}` : 'Register New Member'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Father / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Guardian name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assign Trainer</label>
                  <select
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- No Trainer --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. Mary Doe (Spouse)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+1 (555) 999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Home Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Residential address"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Health & Fitness Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Medical conditions, fitness goals, preferences..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-member-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingMember ? 'Save Changes' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL DRAWER / MODAL */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {selectedMemberDetail.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedMemberDetail.fullName}</h3>
                  <p className="text-[11px] font-mono text-slate-500">ID: {selectedMemberDetail.memberId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Profile Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                  <span className="font-semibold text-slate-900">{selectedMemberDetail.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-semibold text-slate-900">{selectedMemberDetail.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                  <span className="font-semibold text-emerald-600">{selectedMemberDetail.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trainer</span>
                  <span className="font-semibold text-slate-900">{selectedMemberDetail.trainer?.name || 'None'}</span>
                </div>
              </div>

              {/* Membership History */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>Membership Subscriptions</span>
                </h4>
                {selectedMemberDetail.memberships?.length === 0 ? (
                  <p className="text-slate-400 italic">No membership registrations found.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedMemberDetail.memberships?.map((mem) => (
                      <div key={mem.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{mem.plan?.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(mem.startDate).toLocaleDateString()} to {new Date(mem.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-slate-900">{currency}{mem.netAmount.toFixed(2)}</p>
                          <span className={`text-[10px] font-bold ${mem.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {mem.status} ({currency}{mem.paidAmount.toFixed(2)} paid, {currency}{mem.remainingAmount.toFixed(2)} due)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Payment History</span>
                </h4>
                {selectedMemberDetail.payments?.length === 0 ? (
                  <p className="text-slate-400 italic">No payments recorded.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedMemberDetail.payments?.map((pay) => (
                      <div key={pay.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-semibold text-slate-900">{pay.receiptNumber}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(pay.paymentDate).toLocaleDateString()} &bull; {pay.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-emerald-600">+{currency}{pay.amount.toFixed(2)}</p>
                          <span className="text-[10px] text-slate-400">Balance: {currency}{pay.remainingBalance.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attendance Log (Last 30 days) */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Recent Attendance (Last 30 visits)</span>
                </h4>
                {selectedMemberDetail.attendances?.length === 0 ? (
                  <p className="text-slate-400 italic">No attendance records recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedMemberDetail.attendances?.map((att) => (
                      <div key={att.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                        <p className="font-semibold text-slate-800">{new Date(att.date).toLocaleDateString()}</p>
                        <p className="text-slate-500 mt-0.5">
                          In: {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {att.checkOut && ` • Out: ${new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
