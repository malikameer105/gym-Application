import React, { useState, useEffect } from 'react';
import { Trainer, Member, GymSettingsData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Dumbbell,
  Plus,
  Search,
  Phone,
  Mail,
  DollarSign,
  UserPlus,
  Users,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface TrainersViewProps {
  settings?: GymSettingsData | null;
}

export const TrainersView: React.FC<TrainersViewProps> = ({ settings }) => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedTrainerForAssign, setSelectedTrainerForAssign] = useState<Trainer | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    salary: 2500,
    status: 'Active',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, mRes] = await Promise.all([
        fetch('/api/trainers'),
        fetch('/api/members')
      ]);
      if (tRes.ok) setTrainers(await tRes.json());
      if (mRes.ok) setMembers(await mRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingTrainer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      specialization: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      salary: 2500,
      status: 'Active',
      notes: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (t: Trainer) => {
    setEditingTrainer(t);
    setFormData({
      name: t.name,
      phone: t.phone,
      email: t.email || '',
      specialization: t.specialization || '',
      joiningDate: t.joiningDate ? t.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      salary: t.salary,
      status: t.status,
      notes: t.notes || ''
    });
    setShowAddModal(true);
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTrainer ? `/api/trainers/${editingTrainer.id}` : '/api/trainers';
      const method = editingTrainer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save trainer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAssignModal = (trainer: Trainer) => {
    setSelectedTrainerForAssign(trainer);
    // Pre-populate with currently assigned member IDs
    const assignedIds = (trainer.assignedMembers || []).map(m => m.id);
    setSelectedMemberIds(assignedIds);
    setShowAssignModal(true);
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedTrainerForAssign) return;
    try {
      const res = await fetch(`/api/trainers/${selectedTrainerForAssign.id}/assign-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMemberIds })
      });
      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign members');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrainer = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove trainer ${name}?`)) return;
    try {
      const res = await fetch(`/api/trainers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete trainer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currency = settings?.currency || '$';

  const filteredTrainers = trainers.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      (t.specialization && t.specialization.toLowerCase().includes(term)) ||
      t.phone.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-indigo-600" />
            <span>Trainer Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage fitness trainers, track specializations, client rosters, and monthly compensation.
          </p>
        </div>

        {(isSuperAdmin || isAdmin) && (
          <button
            id="add-trainer-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trainer</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, specialization, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Trainers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTrainers.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                    <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {t.specialization || 'General Fitness'}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {t.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.phone}</span>
                </div>
                {t.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salary: <strong className="font-mono text-slate-900">{currency}{t.salary}/mo</strong></span>
                </div>
              </div>

              {/* Client Roster Pill */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Assigned Clients</span>
                  </span>
                  <span className="font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[11px]">
                    {t.assignedMembers?.length || 0} Members
                  </span>
                </div>

                {t.assignedMembers && t.assignedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.assignedMembers.slice(0, 4).map((m) => (
                      <span key={m.id} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                        {m.fullName}
                      </span>
                    ))}
                    {t.assignedMembers.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{t.assignedMembers.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openAssignModal(t)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assign Clients</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(t)}
                  title="Edit Profile"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTrainer(t.id, t.name)}
                  title="Remove Trainer"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT TRAINER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingTrainer ? `Edit Trainer: ${editingTrainer.name}` : 'Register New Trainer'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrainer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Strength & Conditioning, Crossfit, Yoga"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Monthly Salary ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Trainer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MEMBERS MODAL */}
      {showAssignModal && selectedTrainerForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Assign Clients to {selectedTrainerForAssign.name}</h3>
                <p className="text-[11px] text-slate-500">Check the members to assign under this trainer's supervision.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {members.map((m) => {
                const isChecked = selectedMemberIds.includes(m.id);
                return (
                  <label key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{m.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {m.memberId} &bull; {m.phone}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleMember(m.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 text-xs">
              <span className="text-slate-600 font-medium">
                {selectedMemberIds.length} member{selectedMemberIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
