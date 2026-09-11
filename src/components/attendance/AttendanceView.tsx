import React, { useState, useEffect } from 'react';
import { Attendance, Member, GymSettingsData } from '../../types';
import {
  CalendarCheck,
  UserCheck,
  Clock,
  Search,
  Download,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AttendanceViewProps {
  settings?: GymSettingsData | null;
}

export const AttendanceView: React.FC<AttendanceViewProps> = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Check-In Form State
  const [inputCode, setInputCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
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
        setMembers(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberCode: inputCode.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          text: `Check-in successful for ${data.attendance?.member?.fullName}!`
        });
        setInputCode('');
        fetchAttendance();
      } else {
        setFeedback({ text: data.error || 'Check-in failed', isError: true });
      }
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error recording check-in', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (attendanceId: string, memberName: string) => {
    try {
      const res = await fetch(`/api/attendance/${attendanceId}/checkout`, { method: 'POST' });
      if (res.ok) {
        setFeedback({ text: `Check-out recorded for ${memberName}` });
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAttendance = attendances.filter(a => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.member?.fullName.toLowerCase().includes(term) ||
      a.member?.memberId.toLowerCase().includes(term) ||
      a.member?.phone.includes(term)
    );
  });

  const exportCSV = () => {
    const headers = ['Member Name', 'Member ID', 'Phone', 'Date', 'Check-In', 'Check-Out', 'Status'];
    const rows = filteredAttendance.map(a => [
      `"${a.member?.fullName || ''}"`,
      a.member?.memberId || '',
      a.member?.phone || '',
      new Date(a.date).toLocaleDateString(),
      new Date(a.checkIn).toLocaleTimeString(),
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'Active',
      a.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Attendance &amp; Gym Floor Access</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log member entry timestamps, monitor active gym floor count, and track historical attendance.
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
        </div>
      </div>

      {/* Instant Check-In Scanner Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>Quick Member Check-In Terminal</span>
        </h3>

        <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-3 items-center max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="attendance-code-input"
              type="text"
              required
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Scan Barcode or Type Member ID / Phone number..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            id="attendance-checkin-btn"
            type="submit"
            disabled={isSubmitting || !inputCode.trim()}
            className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-colors shrink-0"
          >
            {isSubmitting ? 'Checking...' : 'Check In Member'}
          </button>
        </form>

        {feedback && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs flex items-center justify-between border ${
              feedback.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="font-bold text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Date Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="text-xs text-indigo-600 hover:underline font-semibold ml-2 cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search today's attendee name or ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Member</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Check-In Time</th>
                <th className="py-3 px-4 font-semibold">Check-Out Time</th>
                <th className="py-3 px-4 font-semibold">Duration</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">Loading attendance...</td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No attendance records for {selectedDate}.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a) => {
                  const checkInDate = new Date(a.checkIn);
                  const checkOutDate = a.checkOut ? new Date(a.checkOut) : null;
                  const diffMinutes = checkOutDate
                    ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000)
                    : null;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{a.member?.fullName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{a.member?.memberId}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {a.member?.phone}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {checkOutDate ? (
                          checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active On Floor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {diffMinutes !== null ? `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m` : '&minus;'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!a.checkOut && (
                          <button
                            onClick={() => handleCheckOut(a.id, a.member?.fullName || 'Member')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5 text-slate-500" />
                            <span>Check Out</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
