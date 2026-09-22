import React, { useState } from 'react';
import { api } from '../services/api';
import { Award, Plus, Search, CheckCircle, AlertCircle, Printer, FileText } from 'lucide-react';

const BTECH_BRANCHES = [
  'BTECH-CSE', 'BTECH-AI', 'BTECH-IT', 'BTECH-ECE',
  'BTECH-EEE', 'BTECH-MECH', 'BTECH-CIVIL', 'BTECH-MAT',
  'BTECH-BIO', 'BTECH-CHEM'
];

export function Marks() {
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'add'
  const [searchStudentId, setSearchStudentId] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Add Marks Form State
  const [form, setForm] = useState({
    student_id: '',
    course_code: 'BTECH-CSE',
    subject: '',
    exam_type: 'Final Semester',
    marks_obtained: '',
    max_marks: '100'
  });

  const handleLookupTranscript = async (e) => {
    e.preventDefault();
    if (!searchStudentId.trim()) return;
    setLoading(true);
    setTranscriptData(null);
    setMessage(null);

    try {
      const data = await api.getStudentMarks(searchStudentId.trim());
      setTranscriptData(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await api.addMark({
        ...form,
        marks_obtained: Number(form.marks_obtained),
        max_marks: Number(form.max_marks)
      });
      setMessage({
        type: 'success',
        text: `Marks recorded successfully! Updated student average in SQLite: ${res.student_average_marks}%.`
      });
      setForm({
        ...form,
        subject: '',
        marks_obtained: ''
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const calcPercentage = () => {
    const ob = Number(form.marks_obtained);
    const mx = Number(form.max_marks);
    if (!isNaN(ob) && !isNaN(mx) && mx > 0 && ob >= 0) {
      return ((ob / mx) * 100).toFixed(1);
    }
    return null;
  };

  const currentPercent = calcPercentage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Examinations & Academic Marks</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record subject exam scores. Student average marks in the SQLite database automatically update on every entry.
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'transcript'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Transcript & Report Card
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'add'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enter Exam Marks
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

      {activeTab === 'transcript' ? (
        <div className="space-y-5">
          {/* Search bar */}
          <form onSubmit={handleLookupTranscript} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-3">
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
              disabled={loading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow"
            >
              {loading ? 'Searching...' : 'View Report Card'}
            </button>
          </form>

          {/* Transcript Report Card */}
          {transcriptData && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-lg space-y-6">
              <div className="flex flex-wrap justify-between items-start border-b border-slate-200 pb-5 gap-4">
                <div>
                  <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">Official Academic Record</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {transcriptData.student.first_name ? `${transcriptData.student.first_name} ${transcriptData.student.last_name || ''}` : transcriptData.student.student_id}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                    <span>Roll No: <strong className="font-mono text-slate-800">{transcriptData.student_id}</strong></span>
                    {transcriptData.student.course && <span>• Branch: <strong className="text-slate-800">{transcriptData.student.course}</strong></span>}
                    {transcriptData.student.year && <span>• Year: <strong className="text-slate-800">{transcriptData.student.year}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-slate-400">Stored Average (SQLite)</p>
                    <p className="text-3xl font-black text-indigo-700">
                      {transcriptData.summary.average_marks_percentage}%
                    </p>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200">
                      Grade: {transcriptData.summary.grade}
                    </span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Print Transcript"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3">Coursework & Exam Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Branch</th>
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3">Exam Type</th>
                        <th className="px-5 py-3">Marks Obtained</th>
                        <th className="px-5 py-3">Max Marks</th>
                        <th className="px-5 py-3">Percentage</th>
                        <th className="px-5 py-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transcriptData.marks.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                            No examination records found for this student. Use the "Enter Exam Marks" tab to add scores.
                          </td>
                        </tr>
                      ) : (
                        transcriptData.marks.map((m) => {
                          const pct = ((m.marks_obtained / m.max_marks) * 100).toFixed(1);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/70">
                              <td className="px-5 py-3 text-xs font-bold text-slate-700">{m.course_code}</td>
                              <td className="px-5 py-3 font-semibold text-slate-900">{m.subject}</td>
                              <td className="px-5 py-3 text-xs text-slate-500">{m.exam_type}</td>
                              <td className="px-5 py-3 font-bold text-slate-800">{m.marks_obtained}</td>
                              <td className="px-5 py-3 text-slate-500">{m.max_marks}</td>
                              <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700">{pct}%</td>
                              <td className="px-5 py-3">
                                <span className="px-2 py-0.5 rounded font-extrabold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                                  {m.grade}
                                </span>
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
          )}
        </div>
      ) : (
        /* Enter Marks Form */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-lg font-bold text-slate-900">Record Examination Scores</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adding or updating subject marks will trigger SQLite triggers to recalculate the student's persistent average marks.
            </p>
          </div>

          <form onSubmit={handleAddMarks} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Student Roll No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BT2026CSE01"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">B.Tech Branch</label>
                <select
                  value={form.course_code}
                  onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {BTECH_BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Exam Type</label>
                <select
                  value={form.exam_type}
                  onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Final Semester">Final Semester</option>
                  <option value="Midterm">Midterm Examination</option>
                  <option value="Internal Assessment">Internal Assessment</option>
                  <option value="Lab Practical">Lab Practical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Marks Obtained</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="e.g. 85"
                  value={form.marks_obtained}
                  onChange={(e) => setForm({ ...form, marks_obtained: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Max Marks</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.max_marks}
                  onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                  className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {currentPercent !== null && (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900">Score Preview:</span>
                <span className="font-bold text-indigo-700">{currentPercent}%</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow transition"
              >
                Save Exam Marks
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

