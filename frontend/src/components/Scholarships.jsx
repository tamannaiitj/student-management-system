import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  DollarSign,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Printer,
  Plus,
  Search,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

const SCHOLARSHIP_SCHEMES = [
  {
    id: 'remission',
    name: 'Govt. Tuition Fee Remission Scheme',
    category: 'Income-Based B.Tech Fee Waiver',
    coverage: '100% or 66.67% Tuition Fee Waiver',
    eligibility: 'Family Annual Income < ₹5,00,000 per annum',
    deadline: 'October 31, 2026',
    status: 'Active'
  },
  {
    id: 'mcm',
    name: 'Institute Merit-cum-Means (MCM) Scholarship',
    category: 'Merit + Need Based',
    coverage: '100% Tuition Fee + ₹1,000/month stipend',
    eligibility: 'CGPA ≥ 7.0 & Annual Income < ₹4,50,000',
    deadline: 'November 15, 2026',
    status: 'Open'
  },
  {
    id: 'nsp',
    name: 'National Scholarship Portal (NSP Central Sector)',
    category: 'Central Govt.',
    coverage: '₹20,000 per annum direct bank transfer',
    eligibility: 'Top 20th percentile in Class XII board exams',
    deadline: 'December 31, 2026',
    status: 'External Portal'
  },
  {
    id: 'alumni',
    name: 'Alumni Endowment B.Tech Excellence Award',
    category: 'Merit-Based',
    coverage: '₹50,000 one-time grant + Research mentorship',
    eligibility: 'Top 5 rank holders across each engineering branch',
    deadline: 'January 15, 2027',
    status: 'Upcoming'
  }
];

export function Scholarships() {
  const { user, isAdmin, isFaculty, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('apply_remission'); // 'apply_remission' | 'applications' | 'schemes'
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remissions, setRemissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [sanctionLetterData, setSanctionLetterData] = useState(null);

  // Fee Remission Form
  const [form, setForm] = useState({
    annual_income: '',
    certificate_no: '',
    issuing_authority: 'Tehsildar / Executive Magistrate',
    financial_year: '2025-2026',
    base_tuition_fee: '100000',
    certificate_date: new Date().toISOString().split('T')[0],
    father_occupation: 'Agriculture / Private Service',
    mother_occupation: 'Homemaker',
    declaration: true
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const allStudents = await api.getStudents();
      setStudents(allStudents || []);

      let active = null;
      if (isStudent) {
        active = allStudents.find((s) => s.student_id === user.student_id || s.email === user.email);
        if (!active) {
          active = await api.getMyProfile();
        }
      } else if (allStudents.length > 0) {
        active = allStudents[0];
      }
      setSelectedStudent(active);

      await fetchRemissionList(active?.student_id);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchRemissionList = async (sid) => {
    try {
      const data = await api.getFeeRemissions(isAdmin || isFaculty ? {} : { student_id: sid });
      setRemissions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentChange = async (sid) => {
    const s = students.find((item) => item.student_id === sid || item.id === Number(sid));
    if (s) {
      setSelectedStudent(s);
      await fetchRemissionList(s.student_id);
    }
  };

  // Live calculation of fee remission benefit
  const incomeVal = Number(form.annual_income || 0);
  const baseFeeVal = Number(form.base_tuition_fee || 100000);

  let calcCategory = '';
  let calcRemissionPct = 0;
  let calcRemissionAmount = 0;
  let calcPayableFee = baseFeeVal;
  let isEligible = false;

  if (form.annual_income !== '' && !isNaN(incomeVal) && incomeVal >= 0) {
    if (incomeVal < 100000) {
      isEligible = true;
      calcCategory = 'FULL_REMISSION';
      calcRemissionPct = 100;
      calcRemissionAmount = baseFeeVal;
      calcPayableFee = 0;
    } else if (incomeVal < 500000) {
      isEligible = true;
      calcCategory = 'TWO_THIRD_REMISSION';
      calcRemissionPct = 66.67;
      calcRemissionAmount = Math.round(baseFeeVal * (2 / 3));
      calcPayableFee = Math.round(baseFeeVal * (1 / 3));
    } else {
      isEligible = false;
      calcCategory = 'NOT_ELIGIBLE';
      calcRemissionPct = 0;
      calcRemissionAmount = 0;
      calcPayableFee = baseFeeVal;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent?.student_id) {
      setMessage({ type: 'error', text: 'Select a valid student first.' });
      return;
    }

    if (incomeVal >= 500000) {
      setMessage({
        type: 'error',
        text: 'Overall family income must be lower than ₹5,00,000 (5 Lakh) per annum to qualify for Fee Remission.'
      });
      return;
    }

    if (!form.certificate_no.trim()) {
      setMessage({ type: 'error', text: 'Income certificate number is mandatory.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.applyFeeRemission({
        student_id: selectedStudent.student_id,
        annual_income: incomeVal,
        base_tuition_fee: baseFeeVal,
        certificate_no: form.certificate_no,
        issuing_authority: form.issuing_authority,
        financial_year: form.financial_year
      });

      setMessage({
        type: 'success',
        text: `Fee Remission Application submitted successfully! Reference No: ${res.reference_no} (${res.remission_percentage}% Remission).`
      });

      setForm({
        ...form,
        annual_income: '',
        certificate_no: ''
      });

      await fetchRemissionList(selectedStudent.student_id);
      setActiveTab('applications');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleUpdateStatus = async (id, status, remarks = '') => {
    try {
      await api.updateFeeRemissionStatus(id, { status, admin_remarks: remarks });
      setMessage({ type: 'success', text: `Application status updated to ${status}.` });
      await fetchRemissionList(selectedStudent?.student_id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
              Govt. of India & Institute Scheme
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-400/30 text-emerald-200 rounded-full text-xs font-semibold">
              4-Year B.Tech
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
            Scholarships & Fee Remission Portal
          </h1>
          <p className="mt-2 text-teal-100 text-xs sm:text-sm leading-relaxed">
            Financial aid and tuition fee waivers for economically backward undergraduate students. Students with family annual income under ₹5 Lakh per annum receive 100% or 2/3rd tuition fee remission.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('apply_remission')}
              className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow transition flex items-center space-x-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Apply for Fee Remission</span>
            </button>
            <button
              onClick={() => setActiveTab('schemes')}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm border border-white/20 transition flex items-center space-x-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Other Scholarships</span>
            </button>
          </div>
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

      {/* Policy Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-xs">
                100% WAIVER
              </span>
              <span className="text-xs font-bold text-slate-500">Category I</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-3">
              Full Tuition Fee Remission
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              For most economically backward students whose gross family annual income is <span className="font-bold text-emerald-700">lower than ₹1,00,000 (1 Lakh)</span>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-700 font-bold flex items-center justify-between">
            <span>Tuition Fee Payable:</span>
            <span className="text-base text-emerald-600 font-black">₹0 (Free)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-teal-100 text-teal-700 font-extrabold text-xs">
                66.67% WAIVER
              </span>
              <span className="text-xs font-bold text-slate-500">Category II</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-3">
              2/3rd Tuition Fee Remission
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              For other economically backward students whose family annual income is <span className="font-bold text-teal-700">between ₹1,00,000 and ₹5,00,000</span>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-teal-700 font-bold flex items-center justify-between">
            <span>Student Pays Only:</span>
            <span className="text-base text-teal-600 font-black">1/3rd Fee</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs">
                ELIGIBILITY
              </span>
              <span className="text-xs font-bold text-slate-500">Income Limit</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-3">
              Income Certificate Mandate
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Must submit a valid government Income Certificate issued by <span className="font-semibold text-slate-800">Tehsildar / SDO / SDM / Revenue Officer</span> for the current financial year.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Threshold Ceiling:</span>
            <span className="font-bold text-slate-800">Max ₹5.00 Lakhs</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 text-sm font-bold">
        {[
          { id: 'apply_remission', label: 'Apply Fee Remission', icon: DollarSign },
          { id: 'applications', label: `Remission Applications (${remissions.length})`, icon: FileCheck },
          { id: 'schemes', label: 'Scholarship Schemes Directory', icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-white/70 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPLY FOR FEE REMISSION */}
      {activeTab === 'apply_remission' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">B.Tech Tuition Fee Remission Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit family gross annual income to receive institutional fee waiver approval.
                </p>
              </div>

              {(isAdmin || isFaculty) && students.length > 0 && (
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Student:</span>
                  <select
                    value={selectedStudent?.student_id || ''}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent outline-none"
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student Details Pill */}
              {selectedStudent && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                    <span className="text-slate-500 ml-2">({selectedStudent.course} • Year {selectedStudent.year})</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Roll: {selectedStudent.roll_no || selectedStudent.student_id}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Family Gross Annual Income (₹ / annum) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.annual_income}
                    onChange={(e) => setForm({ ...form, annual_income: e.target.value })}
                    placeholder="e.g. 85000 or 250000"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Must be below ₹5,00,000 to be eligible.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Standard Base Tuition Fee (₹ / sem)
                  </label>
                  <input
                    type="number"
                    value={form.base_tuition_fee}
                    onChange={(e) => setForm({ ...form, base_tuition_fee: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Income Certificate Reference No *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.certificate_no}
                    onChange={(e) => setForm({ ...form, certificate_no: e.target.value })}
                    placeholder="e.g. INC/2026/89421"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Certificate Issuing Authority *
                  </label>
                  <select
                    value={form.issuing_authority}
                    onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Tehsildar / Executive Magistrate">Tehsildar / Executive Magistrate</option>
                    <option value="Sub-Divisional Magistrate (SDM)">Sub-Divisional Magistrate (SDM)</option>
                    <option value="Revenue Officer (RO)">Revenue Officer (RO)</option>
                    <option value="District Magistrate / Collector">District Magistrate / Collector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Financial Year of Income
                  </label>
                  <select
                    value={form.financial_year}
                    onChange={(e) => setForm({ ...form, financial_year: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="2025-2026">FY 2025–2026 (Current Academic Session)</option>
                    <option value="2024-2025">FY 2024–2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Certificate Issue Date
                  </label>
                  <input
                    type="date"
                    value={form.certificate_date}
                    onChange={(e) => setForm({ ...form, certificate_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={form.declaration}
                    onChange={(e) => setForm({ ...form, declaration: e.target.checked })}
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I hereby solemnly declare that the family annual income provided above is authentic and backed by an official state government income certificate. Any false disclosure will result in disciplinary action and fee recovery.
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || !isEligible}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Processing...' : 'Submit Fee Remission Application'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Remission Calculator Widget */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Live Remission Benefit Calculation</span>
            </h3>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Entered Income:</span>
                  <span className="font-bold text-slate-900">
                    {form.annual_income ? `₹${incomeVal.toLocaleString()} / year` : 'Enter income'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Standard Tuition Fee:</span>
                  <span className="font-semibold text-slate-900">₹{baseFeeVal.toLocaleString()}</span>
                </div>
              </div>

              {/* Dynamic Status Callout */}
              {form.annual_income === '' ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  Type your family annual income on the left to see your eligible remission percentage.
                </div>
              ) : isEligible ? (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  calcCategory === 'FULL_REMISSION'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-sm">
                      {calcCategory === 'FULL_REMISSION' ? 'Full 100% Fee Remission' : '2/3rd (66.67%) Fee Remission'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {calcCategory === 'FULL_REMISSION'
                      ? 'Because annual income is under ₹1 Lakh, you are entitled to a 100% full tuition waiver.'
                      : 'Because annual income is between ₹1 Lakh and ₹5 Lakhs, 2/3rd of your tuition fee is waived.'}
                  </p>

                  <div className="pt-2 border-t border-emerald-200/60 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Fee Waived (Subsidy):</span>
                      <span className="font-black text-emerald-700">₹{calcRemissionAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="font-bold text-slate-900">Your Payable Tuition Fee:</span>
                      <span className="text-lg font-black text-slate-900">₹{calcPayableFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-rose-800">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Income Exceeds ₹5.00 Lakhs Ceiling</span>
                  </div>
                  <p className="text-slate-600 pt-1">
                    Family income of ₹{incomeVal.toLocaleString()} exceeds the government fee remission limit. Standard B.Tech fee of ₹{baseFeeVal.toLocaleString()} applies.
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Official Adjustment Notice</p>
                <p>Upon verification by the Accounts Section, your pending tuition fee invoice in the ERP will automatically update to ₹{calcPayableFee.toLocaleString()}.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REMISSION APPLICATIONS LIST */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Submitted Fee Remission Applications</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified income claims and sanctioned fee waivers.
              </p>
            </div>
          </div>

          {remissions.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold">No Remission Applications Submitted</p>
              <p className="text-xs text-slate-400 mt-1">Use the "Apply Fee Remission" tab to file an income certificate.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {remissions.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-800">
                        {item.reference_no}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Verified'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {item.first_name ? `${item.first_name} ${item.last_name} (${item.student_id})` : item.student_id}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Annual Income:</span>
                        <span className="font-bold text-slate-900">₹{Number(item.annual_income).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waiver Granted:</span>
                        <span className="font-bold text-emerald-700">
                          {item.remission_percentage}% Remission (₹{Number(item.remission_amount).toLocaleString()})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Adjusted Payable:</span>
                        <span className="font-bold text-slate-900">₹{Number(item.payable_fee).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Certificate No:</span>
                        <span className="font-mono text-slate-700">{item.certificate_no}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2">
                      Issued by {item.issuing_authority} • Session {item.financial_year} • Applied on {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        setSanctionLetterData(item);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition"
                      title="Print Sanction Letter"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print Sanction</span>
                    </button>

                    {(isAdmin || isFaculty) && item.status !== 'Approved' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'Approved', 'Income verified against Tahsildar records. Approved.')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition"
                      >
                        Approve Remission
                      </button>
                    )}

                    {(isAdmin || isFaculty) && item.status === 'Submitted' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'Verified', 'Income documents checked.')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OTHER SCHOLARSHIPS DIRECTORY */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">National & Institutional Scholarship Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore government, merit-based, and endowment scholarships available for B.Tech students.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SCHOLARSHIP_SCHEMES.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {scheme.category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {scheme.deadline}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mt-2.5">
                      {scheme.name}
                    </h4>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-700">Financial Aid:</span> {scheme.coverage}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Eligibility:</span> {scheme.eligibility}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-700">{scheme.status}</span>
                    <button
                      onClick={() => setActiveTab('apply_remission')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
