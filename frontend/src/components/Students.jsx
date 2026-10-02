import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Profile } from './Profile';
import { StudentServices } from './StudentServices';
import {
  Search, Plus, Trash2, Edit, AlertCircle, CheckCircle, GraduationCap, User,
  CreditCard, FileCheck, FileText, Utensils, DollarSign, Users, Award
} from 'lucide-react';

const BTECH_BRANCHES = [
  { code: 'BTECH-CSE', name: 'Computer Science & Engineering' },
  { code: 'BTECH-AI', name: 'Artificial Intelligence & Data Science' },
  { code: 'BTECH-IT', name: 'Information Technology' },
  { code: 'BTECH-ECE', name: 'Electronics & Communication' },
  { code: 'BTECH-EEE', name: 'Electrical & Electronics' },
  { code: 'BTECH-MECH', name: 'Mechanical Engineering' },
  { code: 'BTECH-CIVIL', name: 'Civil Engineering' },
  { code: 'BTECH-MAT', name: 'Materials Engineering' },
  { code: 'BTECH-BIO', name: 'Bioengineering' },
  { code: 'BTECH-CHEM', name: 'Chemical Engineering' }
];

export function Students({ onSelectStudentForMarks, onViewProfile, defaultSection = 'directory', defaultStudentId = null }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [activeStudentId, setActiveStudentId] = useState(defaultStudentId);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    course: 'BTECH-CSE',
    year: '1',
    date_of_birth: ''
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStudents(search);
      setStudents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      student_id: `BT${new Date().getFullYear()}CSE${Math.floor(100 + Math.random() * 900)}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      course: 'BTECH-CSE',
      year: '1',
      date_of_birth: '2005-01-01'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      course: student.course,
      year: String(student.year),
      date_of_birth: student.date_of_birth || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenProfile = (student) => {
    setActiveStudentId(student.id);
    setActiveSection('profile');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await api.deleteStudent(id);
      setSuccess(`Student deleted successfully.`);
      loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          ...formData,
          year: Number(formData.year)
        });
        setSuccess('Student updated successfully.');
      } else {
        await api.createStudent({
          ...formData,
          year: Number(formData.year)
        });
        setSuccess('Student enrolled successfully.');
      }
      setIsModalOpen(false);
      loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Client-side filtering by branch and year
  const filteredStudents = students.filter((s) => {
    if (selectedBranch !== 'ALL' && s.course !== selectedBranch) return false;
    if (selectedYear !== 'ALL' && String(s.year) !== selectedYear) return false;
    return true;
  });

  const getAverageBadgeColor = (avg) => {
    const val = Number(avg || 0);
    if (val >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (val > 0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const SECTIONS = [
    { id: 'directory', label: 'Students Directory', icon: Users },
    { id: 'profile', label: 'Student Profile', icon: User },
    { id: 'id_card', label: 'ID Card Application', icon: CreditCard },
    { id: 'convocation', label: 'Convocation Details', icon: GraduationCap },
    { id: 'settle_dues', label: 'Settle Dues', icon: DollarSign },
    { id: 'no_dues', label: 'No Dues Request', icon: FileCheck },
    { id: 'bonafide', label: 'Bonafide Certificate', icon: FileText },
    { id: 'mess_off', label: 'Application of Mess Off', icon: Utensils },
  ];

  return (
    <div className="space-y-6">
      {/* Students Sub-Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-2 text-xs sm:text-sm font-bold pb-px">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2.5 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-white/70 rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {activeSection === 'profile' && (
        <Profile initialStudentId={activeStudentId} />
      )}

      {['id_card', 'convocation', 'settle_dues', 'no_dues', 'bonafide', 'mess_off'].includes(activeSection) && (
        <StudentServices initialTab={activeSection} studentId={activeStudentId} />
      )}

      {activeSection === 'directory' && (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">B.Tech Student Directory</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage students enrolled in 4-year engineering programs with live computed average marks.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll New Student</span>
            </button>
          </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by student name, roll no, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-2">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Branches</option>
            {BTECH_BRANCHES.map((b) => (
              <option key={b.code} value={b.code}>{b.code} ({b.name})</option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Years (1-4)</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Roll No</th>
            <th className="px-5 py-3.5">Student Profile</th>
                <th className="px-5 py-3.5">Branch</th>
                <th className="px-5 py-3.5">Year</th>
                <th className="px-5 py-3.5">Average Marks (SQLite)</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                    Loading student records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-semibold">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">Enroll your first student using the button above.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-700">
                      {s.student_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(s)}
                        className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline text-left"
                        title={`Open ${s.first_name}'s student profile`}
                      >
                        {s.first_name} {s.last_name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-200">
                        {s.course}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">
                      Year {s.year}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getAverageBadgeColor(s.average_marks)}`}>
                        {s.average_marks ? `${Number(s.average_marks).toFixed(1)}%` : 'No Marks Yet'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      <div>{s.email}</div>
                      {s.phone && <div className="text-slate-400">{s.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {onViewProfile && (
                        <button
                          onClick={() => onViewProfile(s.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                          title="View Full Profile"
                        >
                          <User className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                        title="Open student profile form"
                      >
                        <UserRound className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        title="Delete student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student profile form / enrollment form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingStudent ? `${editingStudent.first_name} ${editingStudent.last_name} - Student Profile` : 'Enroll New B.Tech Student'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {editingStudent ? 'Review and update the student personal and academic information.' : 'Complete the personal and academic sections to create the student profile.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
                aria-label="Close student profile"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <section className="space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-800">Personal Information</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Student identity and contact details</p>
                </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Roll No / Student ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              </section>

              <section className="space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-bold text-slate-800">Academic Information</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Engineering branch and current year</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">Academic Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase">B.Tech Engineering Branch</label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="mt-1 w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {BTECH_BRANCHES.map((b) => (
                        <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow"
                >
                  {editingStudent ? 'Save Changes' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

