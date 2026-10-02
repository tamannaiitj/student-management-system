import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  GraduationCap,
  Users,
  MapPin,
  CreditCard,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit3,
  Save,
  Printer,
  Search,
  BookOpen,
  Phone,
  Mail,
  Shield,
  Award
} from 'lucide-react';

const BTECH_BRANCHES = [
  { code: 'BTECH-CSE', name: 'Computer Science & Engineering', dept: 'Department of Computer Science & Engineering' },
  { code: 'BTECH-AI', name: 'Artificial Intelligence & Data Science', dept: 'Department of Artificial Intelligence & Data Science' },
  { code: 'BTECH-IT', name: 'Information Technology', dept: 'Department of Information Technology' },
  { code: 'BTECH-ECE', name: 'Electronics & Communication', dept: 'Department of Electronics & Communication Engineering' },
  { code: 'BTECH-EEE', name: 'Electrical & Electronics', dept: 'Department of Electrical & Electronics Engineering' },
  { code: 'BTECH-MECH', name: 'Mechanical Engineering', dept: 'Department of Mechanical Engineering' },
  { code: 'BTECH-CIVIL', name: 'Civil Engineering', dept: 'Department of Civil Engineering' },
  { code: 'BTECH-MAT', name: 'Materials Engineering', dept: 'Department of Materials Engineering' },
  { code: 'BTECH-BIO', name: 'Bioengineering', dept: 'Department of Bioengineering' },
  { code: 'BTECH-CHEM', name: 'Chemical Engineering', dept: 'Department of Chemical Engineering' }
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS', 'PwD'];
const GENDERS = ['Male', 'Female', 'Other'];

export function Profile({ initialStudentId = null }) {
  const { user, isAdmin, isFaculty, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('college'); // 'college' | 'personal' | 'parents' | 'address'
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Admin/Faculty student lookup
  const [studentLookupId, setStudentLookupId] = useState('');
  const [studentList, setStudentList] = useState([]);

  // Form State with all required student details
  const [form, setForm] = useState({
    id: null,
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    course: 'BTECH-CSE',
    year: 1,
    semester: 1,
    degree_type: '4-Year B.Tech (Bachelor of Technology)',
    department: 'Department of Computer Science & Engineering',
    admission_year: new Date().getFullYear(),
    passing_year: new Date().getFullYear() + 4,
    roll_no: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'B+',
    category: 'General',
    nationality: 'Indian',
    aadhar_no: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    father_name: '',
    father_occupation: '',
    father_phone: '',
    mother_name: '',
    mother_occupation: '',
    mother_phone: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: '',
    permanent_address: '',
    current_address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    average_marks: 0.0
  });

  const loadProfile = async (targetId = null) => {
    setLoading(true);
    setMessage(null);
    try {
      let data = null;
      if (isStudent && !targetId) {
        data = await api.getMyProfile();
      } else if (targetId) {
        data = await api.getStudent(targetId);
      } else {
        // Default to first student in list or own profile
        const all = await api.getStudents();
        setStudentList(all || []);
        if (all && all.length > 0) {
          data = await api.getStudent(all[0].id);
        } else {
          data = await api.getMyProfile();
        }
      }

      if (data) {
        populateForm(data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    const curYear = new Date().getFullYear();
    const yr = Number(data.year) || 1;
    const branchInfo = BTECH_BRANCHES.find((b) => b.code === data.course);

    setForm({
      id: data.id || null,
      student_id: data.student_id || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      course: data.course || 'BTECH-CSE',
      year: yr,
      semester: data.semester || (yr * 2) - 1,
      degree_type: data.degree_type || '4-Year B.Tech (Bachelor of Technology)',
      department: data.department || branchInfo?.dept || 'Department of Engineering',
      admission_year: data.admission_year || curYear - (yr - 1),
      passing_year: data.passing_year || (data.admission_year ? Number(data.admission_year) + 4 : curYear + (4 - yr + 1)),
      roll_no: data.roll_no || data.student_id || '',
      date_of_birth: data.date_of_birth || '',
      gender: data.gender || 'Male',
      blood_group: data.blood_group || 'O+',
      category: data.category || 'General',
      nationality: data.nationality || 'Indian',
      aadhar_no: data.aadhar_no || '',
      bank_name: data.bank_name || '',
      bank_account_no: data.bank_account_no || '',
      bank_ifsc: data.bank_ifsc || '',
      father_name: data.father_name || '',
      father_occupation: data.father_occupation || '',
      father_phone: data.father_phone || '',
      mother_name: data.mother_name || '',
      mother_occupation: data.mother_occupation || '',
      mother_phone: data.mother_phone || '',
      guardian_name: data.guardian_name || '',
      guardian_phone: data.guardian_phone || '',
      guardian_relation: data.guardian_relation || '',
      permanent_address: data.permanent_address || '',
      current_address: data.current_address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      country: data.country || 'India',
      average_marks: Number(data.average_marks || 0.0)
    });
  };

  useEffect(() => {
    loadProfile(initialStudentId);
  }, [initialStudentId]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-update department if course changes
      if (field === 'course') {
        const branch = BTECH_BRANCHES.find((b) => b.code === value);
        if (branch) next.department = branch.dept;
      }
      // Auto-update semester and passing year if academic year changes
      if (field === 'year') {
        const y = Number(value);
        if (!isNaN(y)) {
          next.semester = (y * 2) - 1;
        }
      }
      return next;
    });
  };

  const handleCopyPermanentAddress = () => {
    setForm((prev) => ({
      ...prev,
      current_address: prev.permanent_address
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let updated;
      if (isStudent && !isAdmin) {
        updated = await api.updateMyProfile(form);
      } else if (form.id) {
        updated = await api.updateStudent(form.id, form);
      } else {
        updated = await api.updateMyProfile(form);
      }
      populateForm(updated);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Student profile updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleStudentSelect = async (e) => {
    const id = e.target.value;
    setStudentLookupId(id);
    if (id) {
      loadProfile(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading student profile record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Admin Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Profile Portal</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Comprehensive college academic records, personal information, parent contact, and verified address.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {(isAdmin || isFaculty) && studentList.length > 0 && (
            <div className="relative">
              <select
                value={form.id || studentLookupId}
                onChange={handleStudentSelect}
                className="bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {studentList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} - {s.first_name} {s.last_name} ({s.course})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition"
            title="Print Profile Sheet"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Print Profile</span>
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm hover:shadow transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-sm hover:shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border transition ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Student Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50/60 to-blue-50/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0">
              {form.first_name ? form.first_name[0].toUpperCase() : 'S'}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {form.first_name} {form.last_name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  {form.student_id || 'ID Pending'}
                </span>
              </div>

              <p className="text-sm font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>{form.course}</span>
                </span>
                <span>•</span>
                <span>Year {form.year} (Semester {form.semester})</span>
                <span>•</span>
                <span>Roll: {form.roll_no || form.student_id}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Degree: {form.degree_type.split(' ')[0]}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  Batch: {form.admission_year}–{form.passing_year}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  <span>Avg: {form.average_marks}%</span>
                </span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>Editing Profile</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-1 sm:space-x-3 text-sm font-bold pb-px">
        {[
          { id: 'college', label: 'College & Academic Details', icon: GraduationCap },
          { id: 'personal', label: 'Personal Details', icon: User },
          { id: 'parents', label: 'Parents & Guardian', icon: Users },
          { id: 'address', label: 'Address & Contact', icon: MapPin }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-white/60 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* 1. College Details */}
        {activeTab === 'college' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">College & Academic Details</h3>
                <p className="text-xs text-slate-500">Degree specialization, branch, department, and academic duration.</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                4-Year B.Tech Program
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  B.Tech Engineering Branch
                </label>
                {isEditing && isAdmin ? (
                  <select
                    value={form.course}
                    onChange={(e) => handleChange('course', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {BTECH_BRANCHES.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.course} ({BTECH_BRANCHES.find((b) => b.code === form.course)?.name || form.course})
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.department || 'Department of Computer Science & Engineering'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Degree Type
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.degree_type}
                    onChange={(e) => handleChange('degree_type', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.degree_type}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Academic Year
                </label>
                {isEditing ? (
                  <select
                    value={form.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior / Final)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    Year {form.year} of 4
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current Semester
                </label>
                {isEditing ? (
                  <select
                    value={form.semester}
                    onChange={(e) => handleChange('semester', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    Semester {form.semester}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Enrollment / Roll No
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.roll_no}
                    onChange={(e) => handleChange('roll_no', e.target.value)}
                    placeholder="e.g. 23BTECHCSE042"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.roll_no || form.student_id}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Admission Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={form.admission_year}
                    onChange={(e) => handleChange('admission_year', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.admission_year}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Expected Passing / Graduation Year
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={form.passing_year}
                    onChange={(e) => handleChange('passing_year', Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.passing_year}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Academic Cumulative Score
                </label>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-sm font-bold text-indigo-900 flex items-center justify-between">
                  <span>SQLite Auto Trigger Average</span>
                  <span className="text-base text-indigo-700">{form.average_marks}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Personal Details */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Personal & Financial Details</h3>
                <p className="text-xs text-slate-500">Government identity, demographics, blood group, and bank account for stipends/refunds.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.first_name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.last_name || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date of Birth (DoB)
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.date_of_birth || 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.gender || 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    value={form.blood_group}
                    onChange={(e) => handleChange('blood_group', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>{form.blood_group || 'O+'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Social Category
                </label>
                {isEditing ? (
                  <select
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.category || 'General'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Aadhaar Card No (UIDAI)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    maxLength={14}
                    value={form.aadhar_no}
                    onChange={(e) => handleChange('aadhar_no', e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono">
                    {form.aadhar_no || '•••• •••• ••••'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Primary Email
                </label>
                {isEditing && isAdmin ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.email || '—'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Mobile Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                    {form.phone || '—'}
                  </div>
                )}
              </div>
            </div>

            {/* Bank Information Sub-card */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Student Bank Account Details</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Bank Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={(e) => handleChange('bank_name', e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.bank_name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Account Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.bank_account_no}
                      onChange={(e) => handleChange('bank_account_no', e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono">
                      {form.bank_account_no || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    IFSC Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.bank_ifsc}
                      onChange={(e) => handleChange('bank_ifsc', e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono">
                      {form.bank_ifsc || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Parents Details */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Parents & Guardian Details</h3>
                <p className="text-xs text-slate-500">Parental contacts and emergency local guardian records.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father's Info Card */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Father's Details</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Father's Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.father_name}
                      onChange={(e) => handleChange('father_name', e.target.value)}
                      placeholder="Enter father's name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.father_name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Father's Occupation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.father_occupation}
                      onChange={(e) => handleChange('father_occupation', e.target.value)}
                      placeholder="e.g. Engineer / Businessman"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.father_occupation || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Father's Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.father_phone}
                      onChange={(e) => handleChange('father_phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.father_phone || '—'}
                    </div>
                  )}
                </div>
              </div>

              {/* Mother's Info Card */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Mother's Details</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mother's Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.mother_name}
                      onChange={(e) => handleChange('mother_name', e.target.value)}
                      placeholder="Enter mother's name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.mother_name || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mother's Occupation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.mother_occupation}
                      onChange={(e) => handleChange('mother_occupation', e.target.value)}
                      placeholder="e.g. Doctor / Teacher / Homemaker"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.mother_occupation || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mother's Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.mother_phone}
                      onChange={(e) => handleChange('mother_phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.mother_phone || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Local Guardian Card */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Emergency Local Guardian Details</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Guardian Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.guardian_name}
                      onChange={(e) => handleChange('guardian_name', e.target.value)}
                      placeholder="Guardian full name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.guardian_name || 'Not specified'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Relationship
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={form.guardian_relation}
                      onChange={(e) => handleChange('guardian_relation', e.target.value)}
                      placeholder="e.g. Uncle / Aunt / Sister"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.guardian_relation || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Guardian Contact Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={form.guardian_phone}
                      onChange={(e) => handleChange('guardian_phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                      {form.guardian_phone || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Address Details */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Address & Residential Information</h3>
                <p className="text-xs text-slate-500">Official permanent domicile and campus hostel / current correspondence residence.</p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCopyPermanentAddress}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                >
                  Copy Permanent to Current
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Permanent Address */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Permanent Address (Domicile)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Street Address & House / Flat No
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={form.permanent_address}
                      onChange={(e) => handleChange('permanent_address', e.target.value)}
                      placeholder="House No., Street, Colony, Landmark"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 min-h-[5rem]">
                      {form.permanent_address || 'Not specified'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="e.g. Jodhpur"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                        {form.city || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      State
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="e.g. Rajasthan"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                        {form.state || '—'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Postal PIN Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        placeholder="e.g. 342037"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 font-mono">
                        {form.pincode || '—'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Country
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                        {form.country || 'India'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Current / Correspondence Address */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Current / Hostel Correspondence Address</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Campus Hostel / Local Room Address
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={form.current_address}
                      onChange={(e) => handleChange('current_address', e.target.value)}
                      placeholder="Hostel Block, Room No., Campus Address"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 min-h-[5rem]">
                      {form.current_address || 'Same as permanent address'}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Official Notice Delivery</p>
                  <p>All physical grade cards, fee reminders, and university transcripts are dispatched to the permanent domicile address on file.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
