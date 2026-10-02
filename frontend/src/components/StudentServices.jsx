import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  GraduationCap,
  FileCheck,
  FileText,
  Utensils,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Plus,
  Search,
  ShieldCheck,
  QrCode,
  Calendar,
  Building,
  User,
  ArrowRight,
  Download,
  Check,
  X
} from 'lucide-react';

export function StudentServices({ initialTab = 'id_card', studentId = null }) {
  const { user, isAdmin, isFaculty, isStudent } = useAuth();
  const [currentService, setCurrentService] = useState(initialTab); // 'id_card' | 'convocation' | 'settle_dues' | 'no_dues' | 'bonafide' | 'mess_off'
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [duesInfo, setDuesInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Forms State
  const [idCardForm, setIdCardForm] = useState({
    reason: 'New Admission (First Issue)',
    blood_group: 'B+',
    emergency_contact: '',
    card_type: 'Physical Smart Card + Digital'
  });

  const [convocationForm, setConvocationForm] = useState({
    attendance_mode: 'In-Person (Attend Ceremony at Auditorium)',
    robe_size: 'L (40-42)',
    guest_count: '2',
    postal_address: '',
    provisional_no: 'PDC-2026-' + Math.floor(1000 + Math.random() * 9000)
  });

  const [bonafideForm, setBonafideForm] = useState({
    purpose: 'Passport / Visa Verification',
    addressed_to: 'Passport Seva Kendra / Consular Authority',
    academic_session: '2025-2026'
  });

  const [messOffForm, setMessOffForm] = useState({
    from_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    to_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    reason: 'Home Visit during Semester Break',
    hostel_room: 'Block B - Room 304'
  });

  const [noDuesForm, setNoDuesForm] = useState({
    purpose: 'Final Degree Graduation & Transcript Release',
    department_lab: 'Cleared',
    library: 'Cleared',
    hostel: 'Cleared',
    mess: 'Cleared',
    sports: 'Cleared',
    accounts: 'Cleared'
  });

  // Modal for viewing printable document
  const [previewDoc, setPreviewDoc] = useState(null); // { type, data }

  const loadData = async () => {
    setLoading(true);
    try {
      const allStudents = await api.getStudents();
      setStudents(allStudents || []);

      let activeStudent = null;
      if (studentId) {
        activeStudent = allStudents.find((s) => s.student_id === studentId || s.id === Number(studentId));
      } else if (isStudent) {
        activeStudent = allStudents.find((s) => s.student_id === user.student_id || s.email === user.email);
        if (!activeStudent) {
          const profile = await api.getMyProfile();
          activeStudent = profile;
        }
      } else if (allStudents && allStudents.length > 0) {
        activeStudent = allStudents[0];
      }
      setSelectedStudent(activeStudent);

      if (activeStudent?.student_id) {
        await fetchServicesForStudent(activeStudent.student_id);
        await fetchDuesForStudent(activeStudent.student_id);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesForStudent = async (sid) => {
    try {
      const requests = await api.getStudentServices(isAdmin || isFaculty ? {} : { student_id: sid });
      setServicesList(requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDuesForStudent = async (sid) => {
    try {
      const dues = await api.getStudentDues(sid);
      setDuesInfo(dues);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleStudentChange = async (sid) => {
    const s = students.find((item) => item.student_id === sid || item.id === Number(sid));
    if (s) {
      setSelectedStudent(s);
      await fetchServicesForStudent(s.student_id);
      await fetchDuesForStudent(s.student_id);
    }
  };

  // Submit Handler for Services
  const handleServiceSubmit = async (serviceType, title, details) => {
    if (!selectedStudent?.student_id) {
      setMessage({ type: 'error', text: 'Please select a valid student record.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const created = await api.createStudentService({
        student_id: selectedStudent.student_id,
        service_type: serviceType,
        title,
        details: {
          ...details,
          student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          course: selectedStudent.course,
          year: selectedStudent.year,
          roll_no: selectedStudent.roll_no || selectedStudent.student_id,
          email: selectedStudent.email,
          phone: selectedStudent.phone
        }
      });
      setMessage({ type: 'success', text: `${title} submitted successfully! Reference No: ${created.reference_no}` });
      await fetchServicesForStudent(selectedStudent.student_id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Status update by admin/faculty
  const handleStatusUpdate = async (id, status, remarks = '') => {
    setActionLoading(true);
    try {
      await api.updateStudentServiceStatus(id, { status, admin_remarks: remarks });
      setMessage({ type: 'success', text: `Status updated to ${status}.` });
      if (selectedStudent?.student_id) {
        await fetchServicesForStudent(selectedStudent.student_id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Settle Dues Handler
  const handleSettleDueInvoice = async (feeItem) => {
    const mode = window.prompt('Enter payment method (UPI / Card / Net Banking / Cash):', 'UPI');
    if (!mode) return;
    setActionLoading(true);
    try {
      const res = await api.payFee(feeItem.id, { payment_mode: mode });
      setMessage({ type: 'success', text: `Due cleared! Receipt No: ${res.invoice.receipt_no}` });
      if (selectedStudent?.student_id) {
        await fetchDuesForStudent(selectedStudent.student_id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Helper calculation for Mess Off days
  const calcMessDays = () => {
    if (!messOffForm.from_date || !messOffForm.to_date) return 0;
    const diff = (new Date(messOffForm.to_date) - new Date(messOffForm.from_date)) / 86400000;
    return diff > 0 ? diff : 0;
  };

  const messDays = calcMessDays();
  const messRebateAmount = messDays * 140; // ₹140 per day

  const filteredServices = servicesList.filter((s) => s.service_type === currentService);

  const SERVICE_TABS = [
    { id: 'id_card', label: 'ID Card Application', icon: CreditCard, color: 'text-indigo-600' },
    { id: 'convocation', label: 'Convocation Details', icon: GraduationCap, color: 'text-purple-600' },
    { id: 'settle_dues', label: 'Settle Dues', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'no_dues', label: 'No Dues Request', icon: FileCheck, color: 'text-blue-600' },
    { id: 'bonafide', label: 'Bonafide Certificate', icon: FileText, color: 'text-amber-600' },
    { id: 'mess_off', label: 'Application of Mess Off', icon: Utensils, color: 'text-rose-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading student services portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Student Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Student Academic & Administrative Services</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit applications, track institutional clearances, manage convocation, and settle dues.
          </p>
        </div>

        {(isAdmin || isFaculty) && students.length > 0 && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Student:</span>
            <select
              value={selectedStudent?.student_id || ''}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {students.map((s) => (
                <option key={s.id} value={s.student_id}>
                  {s.student_id} - {s.first_name} {s.last_name} ({s.course})
                </option>
              ))}
            </select>
          </div>
        )}
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

      {/* Selected Student Banner Info */}
      {selectedStudent && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-indigo-300">
              {selectedStudent.first_name?.[0] || 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                <span className="text-xs font-mono bg-indigo-500/30 px-2 py-0.5 rounded text-indigo-200 border border-indigo-400/20">
                  {selectedStudent.student_id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {selectedStudent.course} • Year {selectedStudent.year} (Semester {(selectedStudent.year * 2) - 1}) • {selectedStudent.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block">Pending Dues:</span>
              <span className="font-bold text-emerald-300">
                ₹{duesInfo?.total_pending ? duesInfo.total_pending.toLocaleString() : '0'}
              </span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block">Academic Status:</span>
              <span className="font-bold text-indigo-300">Regular B.Tech</span>
            </div>
          </div>
        </div>
      )}

      {/* Service Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SERVICE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentService === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentService(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : tab.color}`} />
              <span className="text-xs font-bold leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: ID CARD APPLICATION */}
      {currentService === 'id_card' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Student Identity Card Application</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply for institutional smart card or replacement. View and print your official virtual ID card.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleServiceSubmit('id_card', 'Student ID Card Application', idCardForm);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Application Reason
                  </label>
                  <select
                    value={idCardForm.reason}
                    onChange={(e) => setIdCardForm({ ...idCardForm, reason: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="New Admission (First Issue)">New Admission (First Issue)</option>
                    <option value="Lost ID Card Replacement">Lost ID Card Replacement</option>
                    <option value="Damaged / Broken Smart Card">Damaged / Broken Smart Card</option>
                    <option value="Correction of Student Particulars">Correction of Student Particulars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Card Format Requested
                  </label>
                  <select
                    value={idCardForm.card_type}
                    onChange={(e) => setIdCardForm({ ...idCardForm, card_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Physical Smart Card + Digital">Physical Smart Card + Digital</option>
                    <option value="Digital Virtual ID Card Only">Digital Virtual ID Card Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={idCardForm.blood_group}
                    onChange={(e) => setIdCardForm({ ...idCardForm, blood_group: e.target.value })}
                    placeholder="e.g. B+, O+, AB+"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={idCardForm.emergency_contact}
                    onChange={(e) => setIdCardForm({ ...idCardForm, emergency_contact: e.target.value })}
                    placeholder="+91 9876543210 (Parents/Guardian)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit ID Card Application</span>
                </button>
              </div>
            </form>

            {/* Application History */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Submitted ID Card Requests</h4>
              {filteredServices.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No ID card requests filed yet.</p>
              ) : (
                <div className="space-y-2">
                  {filteredServices.map((req) => (
                    <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-700">{req.reference_no}</span>
                        <p className="text-slate-600 mt-0.5">{req.details.reason} • {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                        {(isAdmin || isFaculty) && req.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Approved', 'Card dispatched for printing')}
                            className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Virtual ID Card Preview Card */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Institutional Virtual ID Card</span>
            </h3>

            {/* Card Widget */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-white/20 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">Institute of Technology</h4>
                    <p className="text-[10px] text-indigo-200">Autonomous B.Tech Engineering Campus</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>

              {/* Card Body */}
              <div className="mt-4 flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-white text-indigo-900 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-md">
                  {selectedStudent?.first_name?.[0] || 'S'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {selectedStudent?.first_name} {selectedStudent?.last_name}
                  </h3>
                  <p className="font-mono text-xs text-indigo-200 mt-0.5">
                    {selectedStudent?.student_id}
                  </p>
                  <p className="text-xs font-semibold text-white mt-1">
                    {selectedStudent?.course}
                  </p>
                </div>
              </div>

              {/* Card Meta */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-black/20 p-2.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-indigo-200 block text-[9px] uppercase font-bold">Academic Year</span>
                  <span className="font-semibold">Year {selectedStudent?.year} of 4</span>
                </div>
                <div>
                  <span className="text-indigo-200 block text-[9px] uppercase font-bold">Blood Group</span>
                  <span className="font-semibold">{idCardForm.blood_group || 'O+'}</span>
                </div>
                <div>
                  <span className="text-indigo-200 block text-[9px] uppercase font-bold">Emergency Phone</span>
                  <span className="font-semibold">{idCardForm.emergency_contact || selectedStudent?.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-indigo-200 block text-[9px] uppercase font-bold">Valid Until</span>
                  <span className="font-semibold">June {new Date().getFullYear() + (4 - Number(selectedStudent?.year || 1) + 1)}</span>
                </div>
              </div>

              {/* Card Footer Barcode Mock */}
              <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-[10px] text-indigo-200">
                <span className="font-mono">|||| | |||||| | ||||| ||||</span>
                <span>Authorized Card</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Virtual ID Card</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: CONVOCATION DETAILS */}
      {currentService === 'convocation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Convocation & Degree Conferral</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register for the Annual Convocation Ceremony, specify robe size, guest passes, and degree dispatch.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-200">
              Convocation 2026 Batch
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleServiceSubmit('convocation', 'Annual Convocation Registration', convocationForm);
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Attendance Mode
                </label>
                <select
                  value={convocationForm.attendance_mode}
                  onChange={(e) => setConvocationForm({ ...convocationForm, attendance_mode: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="In-Person (Attend Ceremony at Auditorium)">In-Person (Attend Ceremony at Auditorium)</option>
                  <option value="In-Absentia (Dispatch Degree by Speed Post)">In-Absentia (Dispatch Degree by Speed Post)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Academic Robe / Gown Size
                </label>
                <select
                  value={convocationForm.robe_size}
                  onChange={(e) => setConvocationForm({ ...convocationForm, robe_size: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="S (34-36)">S (Small, 34-36)</option>
                  <option value="M (38-40)">M (Medium, 38-40)</option>
                  <option value="L (40-42)">L (Large, 40-42)</option>
                  <option value="XL (44-46)">XL (Extra Large, 44-46)</option>
                  <option value="XXL (48+)">XXL (Double Extra Large, 48+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Accompanying Family Guests
                </label>
                <select
                  value={convocationForm.guest_count}
                  onChange={(e) => setConvocationForm({ ...convocationForm, guest_count: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="0">0 Guests (Student Only)</option>
                  <option value="1">1 Guest Pass</option>
                  <option value="2">2 Guest Passes (Maximum)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Postal Dispatch Address (For In-Absentia Degree Certificate)
                </label>
                <textarea
                  rows={2}
                  value={convocationForm.postal_address}
                  onChange={(e) => setConvocationForm({ ...convocationForm, postal_address: e.target.value })}
                  placeholder="Complete postal address with PIN code for speed post dispatch"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Provisional Certificate No (PDC)
                </label>
                <input
                  type="text"
                  value={convocationForm.provisional_no}
                  onChange={(e) => setConvocationForm({ ...convocationForm, provisional_no: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Dress Code:</span> White Formal Kurta-Pyjama / Formal Suit with College Stole.
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Register for Convocation</span>
              </button>
            </div>
          </form>

          {/* Registration History */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Convocation Registration Status</h4>
            {filteredServices.length === 0 ? (
              <p className="text-xs text-slate-400">No convocation registrations recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((req) => (
                  <div key={req.id} className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-purple-900 text-sm">{req.title}</span>
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700 font-bold">
                          {req.reference_no}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Mode: {req.details.attendance_mode} • Gown: {req.details.robe_size} • Guests: {req.details.guest_count}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                        {req.status === 'Pending' ? 'Registered' : req.status}
                      </span>
                      <button
                        onClick={() => window.print()}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Pass</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: SETTLE DUES */}
      {currentService === 'settle_dues' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Outstanding Dues Clearance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized institutional balance across tuition, hostel, mess, library, and department labs.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase text-slate-400 block">Total Dues Payable</span>
              <span className="text-xl font-extrabold text-indigo-700">
                ₹{duesInfo?.total_pending ? duesInfo.total_pending.toLocaleString() : '0'}
              </span>
            </div>
          </div>

          {/* Dues Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(duesInfo?.dues_breakdown || []).map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition ${
                  item.amount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-600">{item.category}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.amount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.amount > 0 ? 'Pending' : 'Cleared'}
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">
                    ₹{item.amount.toLocaleString()}
                  </span>
                  {item.amount === 0 && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>No balance</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Fee Invoices Table */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Pending Invoices for {selectedStudent?.first_name}</h4>
            {!duesInfo?.pending_fees || duesInfo.pending_fees.length === 0 ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-emerald-900 text-sm">All Academic Dues are Fully Settled!</p>
                <p className="text-xs text-emerald-700 mt-0.5">The student has zero outstanding fee balance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {duesInfo.pending_fees.map((fee) => (
                  <div key={fee.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-indigo-300 transition">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{fee.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Due Date: {fee.due_date} • Student ID: {fee.student_id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-black text-base text-slate-900">₹{fee.amount.toLocaleString()}</span>
                      <button
                        onClick={() => handleSettleDueInvoice(fee)}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle & Pay</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: NO DUES REQUEST */}
      {currentService === 'no_dues' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Dues Clearance Certificate Request</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply for multi-department clearance required for semester registration or graduation.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200">
              Clearance Workflow
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleServiceSubmit('no_dues', 'No Dues Clearance Request', noDuesForm);
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Reason for No Dues Application
              </label>
              <select
                value={noDuesForm.purpose}
                onChange={(e) => setNoDuesForm({ ...noDuesForm, purpose: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Final Degree Graduation & Transcript Release">Final Degree Graduation & Transcript Release</option>
                <option value="Semester Registration Clearance">Semester Registration Clearance</option>
                <option value="Hostel Room Vacating & Caution Deposit Refund">Hostel Room Vacating & Caution Deposit Refund</option>
                <option value="Transfer Certificate / Discontinuation">Transfer Certificate / Discontinuation</option>
              </select>
            </div>

            {/* Department Clearance Cards */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Departmental Clearance Matrix
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'department_lab', label: 'Engineering Workshop & Lab' },
                  { id: 'library', label: 'Central University Library' },
                  { id: 'hostel', label: 'Hostel Warden Section' },
                  { id: 'mess', label: 'Catering & Mess Contractor' },
                  { id: 'sports', label: 'Sports Complex / Gymkhana' },
                  { id: 'accounts', label: 'Finance & Accounts Section' }
                ].map((dept) => (
                  <div key={dept.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{dept.label}</p>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        <span>Cleared</span>
                      </span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit No Dues Request</span>
              </button>
            </div>
          </form>

          {/* History & Certificate Generator */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">No Dues Certificate Status</h4>
            {filteredServices.length === 0 ? (
              <p className="text-xs text-slate-400">No clearance requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((req) => (
                  <div key={req.id} className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-blue-950 text-sm">{req.title}</span>
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">
                          {req.reference_no}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Purpose: {req.details.purpose} • 6 Departments Cleared
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                        {req.status === 'Pending' ? 'Cleared' : req.status}
                      </span>
                      <button
                        onClick={() => window.print()}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print No Dues Certificate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: APPLICATION FOR BONAFIDE CERTIFICATE */}
      {currentService === 'bonafide' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Application for Bonafide Certificate</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Request an official institute bonafide letter verifying regular student enrollment.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleServiceSubmit('bonafide', 'Bonafide Certificate Application', bonafideForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Purpose of Bonafide Certificate
                </label>
                <select
                  value={bonafideForm.purpose}
                  onChange={(e) => setBonafideForm({ ...bonafideForm, purpose: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Passport / Visa Verification">Passport / Visa Verification</option>
                  <option value="Education Loan Application to Bank">Education Loan Application to Bank</option>
                  <option value="National / State Scholarship Scheme">National / State Scholarship Scheme</option>
                  <option value="Railway / Bus Transport Concession">Railway / Bus Transport Concession</option>
                  <option value="Summer Internship & Industrial Training">Summer Internship & Industrial Training</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Addressed To / Submitting Authority
                </label>
                <input
                  type="text"
                  required
                  value={bonafideForm.addressed_to}
                  onChange={(e) => setBonafideForm({ ...bonafideForm, addressed_to: e.target.value })}
                  placeholder="e.g. Regional Passport Office / Branch Manager, SBI"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={bonafideForm.academic_session}
                  onChange={(e) => setBonafideForm({ ...bonafideForm, academic_session: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Bonafide Application</span>
                </button>
              </div>
            </form>
          </div>

          {/* Official Bonafide Preview Document */}
          <div className="bg-amber-50/40 rounded-3xl p-6 border border-amber-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="text-center border-b border-amber-200/80 pb-3">
                <GraduationCap className="w-8 h-8 text-amber-700 mx-auto mb-1" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                  Institute of Technology & Sciences
                </h4>
                <p className="text-[10px] text-slate-500">Office of the Dean of Academic Affairs</p>
                <span className="mt-2 inline-block font-mono text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                  REF: BON-2026-{Math.floor(1000 + Math.random() * 9000)}
                </span>
              </div>

              <div className="mt-4 text-xs text-slate-700 leading-relaxed space-y-3">
                <p className="font-bold text-center underline">TO WHOMSOEVER IT MAY CONCERN</p>
                <p>
                  This is to certify that <span className="font-bold text-slate-900">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>, Roll No. <span className="font-mono font-bold text-slate-900">{selectedStudent?.student_id}</span>, is a bonafide student of this Institute studying in <span className="font-semibold">{selectedStudent?.course}</span>, Year {selectedStudent?.year} (Semester {(selectedStudent?.year * 2) - 1}).
                </p>
                <p>
                  This certificate is issued on student request for the purpose of <span className="font-semibold text-slate-900">{bonafideForm.purpose}</span>.
                </p>
                <p>
                  To the best of our knowledge, the student bears good moral conduct.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-amber-200/60 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Place: Campus Office</p>
                </div>
                <div className="text-center">
                  <span className="font-serif italic font-bold text-slate-700 block">Registrar</span>
                  <span className="border-t border-slate-400 pt-0.5 block">Official Seal</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition"
            >
              <Printer className="w-4 h-4 text-amber-700" />
              <span>Print Official Bonafide</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 6: APPLICATION OF MESS OFF */}
      {currentService === 'mess_off' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Application of Mess Off (Rebate)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply for hostel dining mess rebate during sanctioned leave or internship absence (minimum 3 days).
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (messDays < 3) {
                  alert('Mess rebate requires a minimum of 3 consecutive absent days.');
                  return;
                }
                handleServiceSubmit('mess_off', 'Mess Off Rebate Application', {
                  ...messOffForm,
                  total_days: messDays,
                  daily_rate: 140,
                  rebate_amount: messRebateAmount
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Leave From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={messOffForm.from_date}
                    onChange={(e) => setMessOffForm({ ...messOffForm, from_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Leave To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={messOffForm.to_date}
                    onChange={(e) => setMessOffForm({ ...messOffForm, to_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Hostel & Room No
                  </label>
                  <input
                    type="text"
                    required
                    value={messOffForm.hostel_room}
                    onChange={(e) => setMessOffForm({ ...messOffForm, hostel_room: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Reason for Absence
                  </label>
                  <select
                    value={messOffForm.reason}
                    onChange={(e) => setMessOffForm({ ...messOffForm, reason: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Home Visit during Semester Break">Home Visit during Semester Break</option>
                    <option value="Medical Leave / Hospitalization">Medical Leave / Hospitalization</option>
                    <option value="Academic Conference / Workshop">Academic Conference / Workshop</option>
                    <option value="Summer / Winter Industrial Internship">Summer / Winter Industrial Internship</option>
                    <option value="Family Function / Emergency">Family Function / Emergency</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading || messDays < 3}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Submit Mess Off Application</span>
                </button>
              </div>
            </form>

            {/* Mess Off History */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Previous Mess Off Applications</h4>
              {filteredServices.length === 0 ? (
                <p className="text-xs text-slate-400">No mess off applications submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {filteredServices.map((req) => (
                    <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-rose-700">{req.reference_no}</span>
                        <p className="text-slate-600 mt-0.5">
                          {req.details.from_date} to {req.details.to_date} ({req.details.total_days} days) • ₹{req.details.rebate_amount}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Rebate Calculation Box */}
          <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200/80 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                <Utensils className="w-5 h-5" />
                <span>Mess Rebate Calculator</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Institutional catering daily waiver rate.</p>

              <div className="mt-5 space-y-3 text-xs bg-white p-4 rounded-2xl border border-rose-100">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Absent Duration:</span>
                  <span className="font-bold text-slate-900">{messDays} Days</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Daily Catering Rate:</span>
                  <span className="font-bold text-slate-900">₹140 / day</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Minimum Threshold:</span>
                  <span className="font-semibold text-rose-600">3 Days rule</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Total Refund Credit:</span>
                  <span className="text-lg font-black text-rose-700">₹{messRebateAmount.toLocaleString()}</span>
                </div>
              </div>

              {messDays < 3 && (
                <div className="mt-3 text-[11px] text-rose-700 bg-rose-100/70 p-2.5 rounded-xl border border-rose-200 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Mess rebate is applicable only for leaves of 3 days or longer.</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-rose-100 text-[11px] text-slate-500">
              Approved rebate amount will be credited to the student's next semester mess billing account.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
