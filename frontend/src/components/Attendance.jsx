import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarCheck, Search, Check, X, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';

const BTECH_BRANCHES = [
  'BTECH-CSE', 'BTECH-AI', 'BTECH-IT', 'BTECH-ECE',
  'BTECH-EEE', 'BTECH-MECH', 'BTECH-CIVIL', 'BTECH-MAT',
  'BTECH-BIO', 'BTECH-CHEM'
];

export function Attendance() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'student'
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('BTECH-CSE');
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { student_id: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Student Lookup State
  const [searchStudentId, setSearchStudentId] = useState('');
  const [studentStats, setStudentStats] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Load students for selected branch
  useEffect(() => {
    async function loadBranchStudents() {
      setLoading(true);
      try {
        const allStudents = await api.getStudents();
        const branchStudents = (allStudents || []).filter((s) => s.course === selectedBranch);
        setStudents(branchStudents);

        // Fetch existing attendance for this branch and date
        const existingRecords = await api.getAttendance({ course_code: selectedBranch, date });
        const map = {};
        branchStudents.forEach((s) => {
          const rec = existingRecords.find((r) => r.student_id === s.student_id);
          map[s.student_id] = rec ? rec.status : 'Present'; // default to Present
        });
        setAttendanceMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBranchStudents();
  }, [selectedBranch, date]);

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.student_id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const records = students.map((s) => ({
        student_id: s.student_id,
        course_code: selectedBranch,
        date,
        status: attendanceMap[s.student_id] || 'Present',
        remarks: ''
      }));

      await api.markAttendance({ records });
      setMessage({ type: 'success', text: `Attendance for ${selectedBranch} saved successfully (${records.length} students).` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleLookupStudent = async (e) => {
    e.preventDefault();
    if (!searchStudentId.trim()) return;
    setLookupLoading(true);
    setStudentStats(null);
    try {
      const data = await api.getStudentAttendance(searchStudentId.trim());
      setStudentStats(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">B.Tech Attendance Tracker</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Class-wise attendance strictly logged as <strong className="text-emerald-700">Present</strong> or <strong className="text-rose-700">Absent</strong>.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mark Daily Attendance
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'student'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Attendance Report
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {activeTab === 'daily' ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">B.Tech Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {BTECH_BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
              >
                Mark All Absent
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow"
              >
                {saving ? 'Saving...' : 'Submit Attendance'}
              </button>
            </div>
          </div>

          {/* Student Attendance Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Roll No</th>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Academic Year</th>
                    <th className="px-5 py-3.5 text-center">Status (Present / Absent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-slate-500">
                        Loading student roster for {selectedBranch}...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-12 text-center text-slate-500">
                        No students enrolled in {selectedBranch} yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => {
                      const isPresent = attendanceMap[s.student_id] === 'Present';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-700">
                            {s.student_id}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            {s.first_name} {s.last_name}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">
                            Year {s.year}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setAttendanceMap({ ...attendanceMap, [s.student_id]: 'Present' })}
                                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttendanceMap({ ...attendanceMap, [s.student_id]: 'Absent' })}
                                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                                  !isPresent
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Absent</span>
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
        </div>
      ) : (
        /* Student Attendance Lookup View */
        <div className="space-y-5">
          <form onSubmit={handleLookupStudent} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Student Roll No (e.g. BT2026CSE01)..."
                value={searchStudentId}
                onChange={(e) => setSearchStudentId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow"
            >
              {lookupLoading ? 'Checking...' : 'Check Attendance'}
            </button>
          </form>

          {studentStats && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Attendance Profile</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Roll No: {studentStats.student_id}</h3>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Overall Attendance</p>
                    <p className="text-2xl font-black text-slate-900">
                      {studentStats.stats.percentage}%
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      studentStats.stats.percentage >= 75
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {studentStats.stats.percentage >= 75 ? 'Eligible for Exams' : 'Low Attendance (< 75%)'}
                  </span>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase">Total Classes</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-1">{studentStats.stats.total_days}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-emerald-700 uppercase">Present Days</p>
                  <p className="text-xl font-extrabold text-emerald-800 mt-1">{studentStats.stats.present_count}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-rose-700 uppercase">Absent Days</p>
                  <p className="text-xl font-extrabold text-rose-800 mt-1">{studentStats.stats.absent_count}</p>
                </div>
              </div>

              {/* Logs Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-3">Attendance History</h4>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Course Code</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentStats.records.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-slate-700 font-mono text-xs">{r.date}</td>
                          <td className="px-4 py-2 text-slate-600">{r.course_code || 'General'}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.status === 'Present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

