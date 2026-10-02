import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  CreditCard,
  UtensilsCrossed,
  HeartPulse,
  GraduationCap,
  FileCheck2,
  Edit3,
  Save,
  RotateCcw,
  Send,
  Printer,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building,
  Home,
  Briefcase,
  Users as UsersIcon,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function StudentSection() {
  const { user } = useAuth();
  const defaultRollNo = user?.student_id || 'BT2026CSE01';

  // Sub-navigation tab: 'profile' | 'idcard' | 'messoff' | 'wellbeing' | 'convocation' | 'bonafide'
  const [activeTab, setActiveTab] = useState('profile');
  const [studentId, setStudentId] = useState(defaultRollNo);
  const [notification, setNotification] = useState(null);

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4500);
  };

  // ========================================================
  // 1. Unified Tabular Profile State
  // ========================================================
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const loadProfile = async (idToFetch) => {
    setProfileLoading(true);
    try {
      const data = await api.getStudentFullProfile(idToFetch);
      setProfile(data);
      setProfileForm(data);
    } catch (err) {
      showNotice('error', err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile(studentId);
  }, [studentId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateStudentFullProfile(studentId, profileForm);
      setProfile(res.profile);
      setIsEditingProfile(false);
      showNotice('success', 'Profile updated and saved to SQLite successfully.');
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // ========================================================
  // 2. ID Card Application State
  // ========================================================
  const [idCardForm, setIdCardForm] = useState({
    student_id: defaultRollNo,
    full_name: '',
    programme: 'B.Tech in Computer Science & Engineering',
    dob: '2005-08-12',
    blood_group: 'B+',
    identification_mark: 'Small mole on right collarbone',
    emergency_contact: '+91 98290 12345',
    corresponding_address: 'Aryabhata Hall, Room B-304, Campus Hostel',
    photo_url: '',
    signature_url: ''
  });
  const [idCardList, setIdCardList] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);

  const loadIdCards = async () => {
    try {
      const list = await api.getIdCardApplications(studentId);
      setIdCardList(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'idcard') loadIdCards();
  }, [activeTab, studentId]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setIdCardForm((prev) => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignPreview(reader.result);
        setIdCardForm((prev) => ({ ...prev, signature_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitIdCard = async (e) => {
    e.preventDefault();
    try {
      await api.submitIdCardApplication(idCardForm);
      showNotice('success', 'ID Card application submitted successfully.');
      loadIdCards();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // ========================================================
  // 3. Mess Off Application State
  // ========================================================
  const defaultMessOffForm = {
    student_id: defaultRollNo,
    email: 'asha@example.com',
    mess_off_type: 'Vacation / Festival',
    no_of_days: 4,
    leaving_date: new Date().toISOString().split('T')[0],
    returning_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    ticket_ref: 'TKT-PNR-892182',
    remarks: 'Going home for Diwali break. Campus exit pass approved.'
  };
  const [messOffForm, setMessOffForm] = useState(defaultMessOffForm);
  const [messOffList, setMessOffList] = useState([]);

  const loadMessOff = async () => {
    try {
      const list = await api.getMessOffApplications(studentId);
      setMessOffList(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'messoff') loadMessOff();
  }, [activeTab, studentId]);

  const handleRaiseMessOff = async (e) => {
    e.preventDefault();
    try {
      await api.submitMessOffApplication(messOffForm);
      showNotice('success', 'Mess off request raised successfully.');
      loadMessOff();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const handleForwardMessOff = async (id) => {
    try {
      await api.forwardMessOffApplication(id, { forwarded_to: 'Hostel Warden / Caregiver' });
      showNotice('success', 'Mess off application forwarded to Hostel Warden & Caregiver.');
      loadMessOff();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const handleResetMessOff = () => {
    setMessOffForm({
      ...defaultMessOffForm,
      student_id: studentId,
      leaving_date: '',
      returning_date: '',
      ticket_ref: '',
      remarks: '',
      no_of_days: 1
    });
    showNotice('success', 'Form fields reset.');
  };

  // ========================================================
  // 4. Student Well-Being Form State
  // ========================================================
  const [wellbeingForm, setWellbeingForm] = useState({
    student_id: defaultRollNo,
    student_name: 'Asha Sharma',
    concern_type: 'Academic & Stress Management',
    urgency: 'Routine',
    preferred_slot: 'Wednesday 4:00 PM - 5:00 PM',
    notes: 'Would like guidance on balancing semester coursework with technical project deadlines.'
  });
  const [wellbeingList, setWellbeingList] = useState([]);

  const loadWellbeing = async () => {
    try {
      const list = await api.getWellbeingRequests(studentId);
      setWellbeingList(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'wellbeing') loadWellbeing();
  }, [activeTab, studentId]);

  const handleSubmitWellbeing = async (e) => {
    e.preventDefault();
    try {
      await api.submitWellbeingRequest(wellbeingForm);
      showNotice('success', 'Confidential well-being request submitted to student wellness counselor.');
      loadWellbeing();
      setWellbeingForm((prev) => ({ ...prev, notes: '' }));
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // ========================================================
  // 5. Convocation Registration State
  // ========================================================
  const [convocation, setConvocation] = useState(null);
  const [convocationForm, setConvocationForm] = useState({
    student_id: defaultRollNo,
    student_name: 'Asha Sharma',
    programme: 'B.Tech in Computer Science & Engineering',
    passing_year: 2026,
    robe_size: 'L',
    attendance_mode: 'In-Person',
    guest_count: 2,
    dispatch_address: '124 Shanti Vihar, Civil Lines, Jaipur, Rajasthan - 302006'
  });

  const loadConvocation = async () => {
    try {
      const data = await api.getConvocationDetails(studentId);
      setConvocation(data);
      if (data) setConvocationForm(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'convocation') loadConvocation();
  }, [activeTab, studentId]);

  const handleSubmitConvocation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.submitConvocationRegistration(convocationForm);
      setConvocation(res.convocation);
      showNotice('success', 'Convocation registration saved successfully.');
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  // ========================================================
  // 6. Apply for Bonafide Certificate State
  // ========================================================
  const [bonafideForm, setBonafideForm] = useState({
    student_id: defaultRollNo,
    student_name: 'Asha Sharma',
    programme: 'B.Tech in Computer Science & Engineering',
    year: 2,
    purpose: 'Education Loan / Scholarship Verification',
    details: 'Addressed to Branch Manager, State Bank of India'
  });
  const [bonafideList, setBonafideList] = useState([]);
  const [viewCertificate, setViewCertificate] = useState(null);

  const loadBonafide = async () => {
    try {
      const list = await api.getBonafideRequests(studentId);
      setBonafideList(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'bonafide') loadBonafide();
  }, [activeTab, studentId]);

  const handleSubmitBonafide = async (e) => {
    e.preventDefault();
    try {
      const res = await api.submitBonafideRequest(bonafideForm);
      showNotice('success', 'Bonafide certificate generated successfully.');
      setViewCertificate(res.certificate);
      loadBonafide();
    } catch (err) {
      showNotice('error', err.message);
    }
  };

  const navTabs = [
    { id: 'profile', label: 'Student Profile (Tabular)', icon: User },
    { id: 'idcard', label: 'ID Card Application', icon: CreditCard },
    { id: 'messoff', label: 'Mess Off Application', icon: UtensilsCrossed },
    { id: 'wellbeing', label: 'Student Well-Being', icon: HeartPulse },
    { id: 'convocation', label: 'Convocation Details', icon: GraduationCap },
    { id: 'bonafide', label: 'Bonafide Certificate', icon: FileCheck2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Student Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
            Student Self-Service Portal
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Student Services Hub</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage comprehensive profiles, campus ID cards, mess rebates, wellness, and certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Roll No:</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.trim().toUpperCase())}
            placeholder="e.g. BT2026CSE01"
            className="text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
      </div>

      {/* Global Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border transition ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: UNIFIED TABULAR STUDENT PROFILE                   */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span>Complete Student Profile (Tabular Form)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All personal, address, parent, income, medical, college, and bank details unified in one editable table.
              </p>
            </div>

            <div className="flex gap-2">
              {!isEditingProfile ? (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileForm(profile);
                      setIsEditingProfile(false);
                    }}
                    className="border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3.5 py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Submit Profile</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {profileLoading ? (
            <div className="p-12 text-center text-slate-500">Loading student profile details...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                    <th className="px-5 py-3 w-1/4">Category & Attribute</th>
                    <th className="px-5 py-3 w-1/2">Current Details</th>
                    <th className="px-5 py-3 w-1/4 text-slate-400">Institutional Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Category 1: Personal Details */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">1. Personal & Identity Details</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Roll No / Student ID</td>
                    <td className="px-5 py-3 font-mono font-bold text-indigo-700">{profileForm.student_id}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">Unique ERP Key</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Full Name</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileForm.full_name || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{profileForm.full_name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Official Matriculation Record</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Date of Birth & Gender</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={profileForm.dob || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <select
                            value={profileForm.gender || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      ) : (
                        <span>{profileForm.dob || 'Not set'} ({profileForm.gender || 'Not specified'})</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Government ID Match</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Category & Nationality</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Category (e.g. General, OBC, SC, ST)"
                            value={profileForm.category || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Nationality"
                            value={profileForm.nationality || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.category || 'General'} · {profileForm.nationality || 'Indian'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Reservation / Admission Quota</td>
                  </tr>

                  {/* Category 2: Medical & Identification */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">2. Medical & Identification Marks</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Blood Group</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <select
                          value={profileForm.blood_group || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                          className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white font-bold"
                        >
                          <option value="">Select Blood Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          {profileForm.blood_group || 'Not recorded'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Campus Hospital Health Card</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Visible Identification Mark</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <input
                          type="text"
                          placeholder="e.g. Scar on left forehead, Mole on right collarbone"
                          value={profileForm.identification_mark || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, identification_mark: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white"
                        />
                      ) : (
                        <span className="text-slate-800 font-medium">{profileForm.identification_mark || 'None recorded'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Physical Verification</td>
                  </tr>

                  {/* Category 3: College & Academic Details */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">3. College & Academic Information</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Enrolled Programme & Branch</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{profileForm.course}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">4-Year Degree (B.Tech)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Academic Standing</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500">Year (1-4):</label>
                            <input
                              type="number"
                              min="1"
                              max="4"
                              value={profileForm.year || 1}
                              onChange={(e) => setProfileForm({ ...profileForm, year: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500">Semester (1-8):</label>
                            <input
                              type="number"
                              min="1"
                              max="8"
                              value={profileForm.semester || 1}
                              onChange={(e) => setProfileForm({ ...profileForm, semester: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800">
                          Year {profileForm.year} · Semester {profileForm.semester}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Office of Dean (Academics)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Campus Residence (Hostel)</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Hostel Name"
                            value={profileForm.hostel_name || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, hostel_name: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Room Number"
                            value={profileForm.room_no || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, room_no: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.hostel_name || 'Day Scholar'} {profileForm.room_no ? `(Room: ${profileForm.room_no})` : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Chief Warden Office</td>
                  </tr>

                  {/* Category 4: Address Details */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">4. Residential & Corresponding Address</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Permanent Address</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <textarea
                          rows={2}
                          value={profileForm.permanent_address || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, permanent_address: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white"
                        />
                      ) : (
                        <p className="text-slate-800">{profileForm.permanent_address || 'Not specified'}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Domicile Verification</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Corresponding / Mailing Address</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <textarea
                          rows={2}
                          value={profileForm.corresponding_address || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, corresponding_address: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white"
                        />
                      ) : (
                        <p className="text-slate-800">{profileForm.corresponding_address || 'Same as permanent'}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Postal Communication</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">City, State & PIN Code</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="City"
                            value={profileForm.city || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={profileForm.state || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="PIN Code"
                            value={profileForm.pincode || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.city || ''}{profileForm.state ? `, ${profileForm.state}` : ''} {profileForm.pincode ? `(${profileForm.pincode})` : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Regional Records</td>
                  </tr>

                  {/* Category 5: Parents Details & Income */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">5. Parents & Family Income Details</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Father's Name & Occupation</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Father's Full Name"
                            value={profileForm.father_name || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, father_name: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Occupation"
                            value={profileForm.father_occupation || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, father_occupation: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.father_name || 'Not provided'} {profileForm.father_occupation ? `(${profileForm.father_occupation})` : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Parental Record</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Mother's Name & Occupation</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Mother's Full Name"
                            value={profileForm.mother_name || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, mother_name: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Occupation"
                            value={profileForm.mother_occupation || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, mother_occupation: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.mother_name || 'Not provided'} {profileForm.mother_occupation ? `(${profileForm.mother_occupation})` : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Parental Record</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Annual Family Income</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <input
                          type="text"
                          placeholder="e.g. ₹6,50,000 / annum"
                          value={profileForm.family_annual_income || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, family_annual_income: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-sm bg-white font-semibold text-emerald-800"
                        />
                      ) : (
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          {profileForm.family_annual_income || 'Not declared'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Fee Concession & Scholarship Audit</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Parents Contact (Phone & Email)</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={profileForm.parents_phone || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, parents_phone: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={profileForm.parents_email || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, parents_email: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-800">
                          {profileForm.parents_phone || 'No phone'} {profileForm.parents_email ? `· ${profileForm.parents_email}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Emergency & Official Alerts</td>
                  </tr>

                  {/* Category 6: Bank Account Details */}
                  <tr className="bg-indigo-50/40 font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    <td colSpan="3" className="px-5 py-2.5">6. Bank Account Details (Scholarships & Refunds)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Bank Name & Branch</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Bank Name (e.g. SBI, HDFC)"
                            value={profileForm.bank_name || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Branch Name"
                            value={profileForm.bank_branch || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, bank_branch: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <span>{profileForm.bank_name || 'Not provided'} {profileForm.bank_branch ? `(${profileForm.bank_branch})` : ''}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">Direct Benefit Transfer (DBT)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-slate-700">Account Number & IFSC Code</td>
                    <td className="px-5 py-3">
                      {isEditingProfile ? (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Account Number"
                            value={profileForm.account_no || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, account_no: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white font-mono"
                          />
                          <input
                            type="text"
                            placeholder="IFSC Code"
                            value={profileForm.ifsc_code || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, ifsc_code: e.target.value })}
                            className="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white font-mono uppercase"
                          />
                        </div>
                      ) : (
                        <span className="font-mono font-semibold text-slate-900">
                          A/C: {profileForm.account_no || 'Not set'} · IFSC: {profileForm.ifsc_code || 'Not set'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">RBI Electronic Clearing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ID CARD APPLICATION                               */}
      {/* ======================================================== */}
      {activeTab === 'idcard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>Student Identity Card Application</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fill details and upload photograph and signature for issuance of campus smart ID card.
              </p>
            </div>

            <form onSubmit={handleSubmitIdCard} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Roll No / Student ID</label>
                  <input
                    type="text"
                    required
                    value={idCardForm.student_id}
                    onChange={(e) => setIdCardForm({ ...idCardForm, student_id: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Student Full Name"
                    value={idCardForm.full_name}
                    onChange={(e) => setIdCardForm({ ...idCardForm, full_name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Programme</label>
                  <input
                    type="text"
                    required
                    value={idCardForm.programme}
                    onChange={(e) => setIdCardForm({ ...idCardForm, programme: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={idCardForm.dob}
                    onChange={(e) => setIdCardForm({ ...idCardForm, dob: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Blood Group</label>
                  <select
                    value={idCardForm.blood_group}
                    onChange={(e) => setIdCardForm({ ...idCardForm, blood_group: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Visible Identification Mark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mole on right collarbone"
                    value={idCardForm.identification_mark}
                    onChange={(e) => setIdCardForm({ ...idCardForm, identification_mark: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Emergency Contact No</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98290 12345"
                    value={idCardForm.emergency_contact}
                    onChange={(e) => setIdCardForm({ ...idCardForm, emergency_contact: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Corresponding Address</label>
                <textarea
                  rows={2}
                  required
                  value={idCardForm.corresponding_address}
                  onChange={(e) => setIdCardForm({ ...idCardForm, corresponding_address: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              {/* Photo & Signature Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">Student Photograph</p>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-500 w-full" />
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="w-20 h-24 object-cover mx-auto mt-3 rounded-lg border shadow-sm" />
                  )}
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">Student Signature</p>
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="text-xs text-slate-500 w-full" />
                  {signPreview && (
                    <img src={signPreview} alt="Signature Preview" className="h-12 object-contain mx-auto mt-3 border bg-white p-1 rounded" />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition"
                >
                  Submit ID Card Application
                </button>
              </div>
            </form>
          </div>

          {/* ID Card Real-time Preview */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Smart ID Card Preview</h4>
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden border border-indigo-500/30">
              <div className="flex justify-between items-start border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-300" />
                  <div>
                    <h5 className="font-black text-xs tracking-wider uppercase">B.Tech Institute</h5>
                    <p className="text-[10px] text-indigo-200">Student Identity Card</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500 text-white rounded-md">
                  {idCardForm.blood_group}
                </span>
              </div>

              <div className="mt-4 flex gap-4 items-center">
                <div className="w-20 h-24 bg-white/20 rounded-xl overflow-hidden flex items-center justify-center border border-white/30 shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="ID" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white/50" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-extrabold text-sm">{idCardForm.full_name || 'STUDENT NAME'}</p>
                  <p className="font-mono text-indigo-200 font-bold">{idCardForm.student_id}</p>
                  <p className="text-[11px] text-indigo-100">{idCardForm.programme}</p>
                  <p className="text-[10px] text-indigo-200">DOB: {idCardForm.dob}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-end text-[10px] text-indigo-200">
                <div>
                  <p className="truncate max-w-[150px]">Emergency: {idCardForm.emergency_contact}</p>
                  <p className="truncate max-w-[150px]">Mark: {idCardForm.identification_mark}</p>
                </div>
                {signPreview ? (
                  <img src={signPreview} alt="Sign" className="h-6 bg-white/80 p-0.5 rounded" />
                ) : (
                  <span className="italic text-[9px] border-b border-white/30">Sign Specimen</span>
                )}
              </div>
            </div>

            {/* Application History */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h5 className="font-bold text-xs uppercase text-slate-600 mb-2">Application Logs</h5>
              {idCardList.length === 0 ? (
                <p className="text-xs text-slate-400">No applications on record.</p>
              ) : (
                <div className="space-y-2">
                  {idCardList.map((app) => (
                    <div key={app.id} className="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-800">#{app.id} {app.student_id}</span>
                        <p className="text-[10px] text-slate-400">{new Date(app.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MESS OFF APPLICATION REPORT                       */}
      {/* ======================================================== */}
      {activeTab === 'messoff' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-indigo-600" />
                  <span>Mess Off Leave Application & Rebate</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Apply for hostel dining mess off rebate during vacations, campus departure, or official travel.
                </p>
              </div>

              {/* Reset Form Icon Button */}
              <button
                type="button"
                onClick={handleResetMessOff}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                title="Reset Form Fields"
              >
                <RotateCcw className="w-4 h-4 text-slate-500 hover:text-rose-600" />
                <span>Reset Form</span>
              </button>
            </div>

            <form onSubmit={handleRaiseMessOff} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Mess Off Type</label>
                  <select
                    value={messOffForm.mess_off_type}
                    onChange={(e) => setMessOffForm({ ...messOffForm, mess_off_type: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Vacation / Festival">Vacation / Festival</option>
                    <option value="Academic Leave / Conference">Academic Leave / Conference</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Official Sports / Cultural">Official Sports / Cultural</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Student Roll No</label>
                  <input
                    type="text"
                    required
                    value={messOffForm.student_id}
                    onChange={(e) => setMessOffForm({ ...messOffForm, student_id: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={messOffForm.email}
                    onChange={(e) => setMessOffForm({ ...messOffForm, email: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Date of Leaving Hostel</label>
                  <input
                    type="date"
                    required
                    value={messOffForm.leaving_date}
                    onChange={(e) => setMessOffForm({ ...messOffForm, leaving_date: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Date of Returning to Hostel</label>
                  <input
                    type="date"
                    required
                    value={messOffForm.returning_date}
                    onChange={(e) => setMessOffForm({ ...messOffForm, returning_date: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Number of Days Off</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={messOffForm.no_of_days}
                    onChange={(e) => setMessOffForm({ ...messOffForm, no_of_days: Number(e.target.value) })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Leaving & Coming Campus Ticket / Slip Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. Train PNR / Flight Ticket / Gate Pass #8291"
                    value={messOffForm.ticket_ref}
                    onChange={(e) => setMessOffForm({ ...messOffForm, ticket_ref: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Remarks / Reason</label>
                  <input
                    type="text"
                    placeholder="Brief description of travel or leave"
                    value={messOffForm.remarks}
                    onChange={(e) => setMessOffForm({ ...messOffForm, remarks: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Raise Request</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mess Off Applications Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">Mess Off Application Report & Status</h4>
              <span className="text-xs text-slate-500">{messOffList.length} applications logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Req ID</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Leaving Date</th>
                    <th className="px-5 py-3">Returning Date</th>
                    <th className="px-5 py-3">Days</th>
                    <th className="px-5 py-3">Campus Ticket</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Forward Option</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messOffList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-5 py-8 text-center text-slate-400">
                        No mess off applications filed yet.
                      </td>
                    </tr>
                  ) : (
                    messOffList.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-mono font-bold text-xs text-indigo-700">#{m.id}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{m.mess_off_type}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{m.leaving_date}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{m.returning_date}</td>
                        <td className="px-5 py-3 font-bold text-slate-900">{m.no_of_days}d</td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{m.ticket_ref || 'N/A'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              m.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : m.status === 'Forwarded'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {m.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => handleForwardMessOff(m.id)}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition border border-indigo-200"
                            >
                              Forward to Warden
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Forwarded</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STUDENT WELL-BEING FORM                           */}
      {/* ======================================================== */}
      {activeTab === 'wellbeing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                <span>Student Well-Being & Counseling Support</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A confidential, safe space for academic stress relief, emotional wellness, or campus assistance.
              </p>
            </div>

            <form onSubmit={handleSubmitWellbeing} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Roll No</label>
                  <input
                    type="text"
                    required
                    value={wellbeingForm.student_id}
                    onChange={(e) => setWellbeingForm({ ...wellbeingForm, student_id: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Student Name</label>
                  <input
                    type="text"
                    required
                    value={wellbeingForm.student_name}
                    onChange={(e) => setWellbeingForm({ ...wellbeingForm, student_name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Concern Area</label>
                  <select
                    value={wellbeingForm.concern_type}
                    onChange={(e) => setWellbeingForm({ ...wellbeingForm, concern_type: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Academic & Stress Management">Academic Stress & Course Load</option>
                    <option value="Emotional & Mental Health">Mental & Emotional Wellness</option>
                    <option value="Peer & Hostel Adjustment">Hostel & Peer Adjustment</option>
                    <option value="Career & Future Guidance">Career & Placement Anxiety</option>
                    <option value="Physical Health Concern">General Campus Wellbeing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Urgency Level</label>
                  <select
                    value={wellbeingForm.urgency}
                    onChange={(e) => setWellbeingForm({ ...wellbeingForm, urgency: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Routine">Routine Check-In</option>
                    <option value="Priority">Priority Support</option>
                    <option value="Urgent">Urgent / Immediate Assistance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Preferred Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. Wednesday 4:00 PM - 5:00 PM or Post-class evening"
                  value={wellbeingForm.preferred_slot}
                  onChange={(e) => setWellbeingForm({ ...wellbeingForm, preferred_slot: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Confidential Notes / Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share what is on your mind. This request is strictly confidential."
                  value={wellbeingForm.notes}
                  onChange={(e) => setWellbeingForm({ ...wellbeingForm, notes: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition"
                >
                  Submit Confidential Request
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-rose-50/60 border border-rose-200 p-5 rounded-2xl">
              <h4 className="font-extrabold text-sm text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Campus Wellness Hotline</span>
              </h4>
              <p className="text-xs text-rose-800 mt-2 leading-relaxed">
                Emergency 24/7 campus medical & psychological support available at <strong>Ext: 9110 / +91 1800-CAMPUS-CARE</strong>.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <h5 className="font-bold text-xs uppercase text-slate-600 mb-2">Previous Check-Ins</h5>
              {wellbeingList.length === 0 ? (
                <p className="text-xs text-slate-400">No requests submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {wellbeingList.map((req) => (
                    <div key={req.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{req.concern_type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{req.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: STUDENT CONVOCATION DETAILS                       */}
      {/* ======================================================== */}
      {activeTab === 'convocation' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider">Annual Degree Ceremony</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <span>Student Convocation Registration</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Confirm your in-person degree conferment, convocation robe sizing, and guest passes.
            </p>
          </div>

          <form onSubmit={handleSubmitConvocation} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Roll No</label>
                <input
                  type="text"
                  required
                  value={convocationForm.student_id}
                  onChange={(e) => setConvocationForm({ ...convocationForm, student_id: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={convocationForm.student_name}
                  onChange={(e) => setConvocationForm({ ...convocationForm, student_name: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Passing Year</label>
                <input
                  type="number"
                  required
                  value={convocationForm.passing_year}
                  onChange={(e) => setConvocationForm({ ...convocationForm, passing_year: Number(e.target.value) })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Robe Size</label>
                <select
                  value={convocationForm.robe_size}
                  onChange={(e) => setConvocationForm({ ...convocationForm, robe_size: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                >
                  <option value="S">Small (S - Height 5'2" - 5'5")</option>
                  <option value="M">Medium (M - Height 5'6" - 5'9")</option>
                  <option value="L">Large (L - Height 5'10" - 6'1")</option>
                  <option value="XL">Extra Large (XL - 6'2"+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Attendance Mode</label>
                <select
                  value={convocationForm.attendance_mode}
                  onChange={(e) => setConvocationForm({ ...convocationForm, attendance_mode: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                >
                  <option value="In-Person">In-Person (Attend on Campus)</option>
                  <option value="In-Absentia">In-Absentia (Courier Degree)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Guest Passes Requested (Max 3)</label>
              <input
                type="number"
                min="0"
                max="3"
                value={convocationForm.guest_count}
                onChange={(e) => setConvocationForm({ ...convocationForm, guest_count: Number(e.target.value) })}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Degree Dispatch Postal Address</label>
              <textarea
                rows={2}
                required
                value={convocationForm.dispatch_address}
                onChange={(e) => setConvocationForm({ ...convocationForm, dispatch_address: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition"
              >
                Register for Convocation
              </button>
            </div>
          </form>

          {convocation && (
            <div className="mt-6 p-5 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-extrabold text-indigo-700">Official Registration Confirmed</span>
                <h4 className="font-extrabold text-base text-slate-900 mt-1">
                  Convocation Pass #{convocation.id}: {convocation.student_name}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Robe Size: <strong>{convocation.robe_size}</strong> · Mode: <strong>{convocation.attendance_mode}</strong> · Guests: <strong>{convocation.guest_count}</strong>
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm">
                Status: {convocation.status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: APPLY FOR BONAFIDE CERTIFICATE                    */}
      {/* ======================================================== */}
      {activeTab === 'bonafide' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Apply for Official Bonafide Certificate</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Instant generation of digitally verified bonafide certificate for passport, loan, visa, or concessions.
              </p>
            </div>

            <form onSubmit={handleSubmitBonafide} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Roll No</label>
                  <input
                    type="text"
                    required
                    value={bonafideForm.student_id}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, student_id: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Student Name</label>
                  <input
                    type="text"
                    required
                    value={bonafideForm.student_name}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, student_name: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Programme & Branch</label>
                  <input
                    type="text"
                    required
                    value={bonafideForm.programme}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, programme: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Current Year</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    required
                    value={bonafideForm.year}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, year: Number(e.target.value) })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Purpose of Certificate</label>
                  <select
                    value={bonafideForm.purpose}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, purpose: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="Education Loan / Bank Formalities">Education Loan / Bank Formalities</option>
                    <option value="Passport / Visa Application">Passport / Visa Application</option>
                    <option value="Internship / Training Verification">Internship / Training Verification</option>
                    <option value="Bus / Train Concession Pass">Bus / Train Concession Pass</option>
                    <option value="Scholarship Verification">Scholarship Verification</option>
                    <option value="General Academic Purpose">General Academic Purpose</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Addressed To / Additional Details</label>
                  <input
                    type="text"
                    placeholder="e.g. To Whom It May Concern / SBI Branch Manager"
                    value={bonafideForm.details}
                    onChange={(e) => setBonafideForm({ ...bonafideForm, details: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition"
                >
                  Generate & Approve Bonafide Certificate
                </button>
              </div>
            </form>
          </div>

          {/* Certificate Print Preview Modal */}
          {viewCertificate && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-indigo-700" />
                    <div>
                      <h4 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                        B.Tech Institute of Technology
                      </h4>
                      <p className="text-xs text-slate-500">Office of the Registrar & Academic Dean</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      title="Print Certificate"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewCertificate(null)}
                      className="p-2 border rounded-xl text-xs font-bold hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="py-8 text-center space-y-4">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    Cert No: {viewCertificate.certificate_no}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wider underline decoration-indigo-600 decoration-2 underline-offset-8">
                    Bonafide Certificate
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-700 text-justify px-4 pt-4">
                    This is to certify that <strong>{viewCertificate.student_name}</strong>, bearing Roll Number <strong>{viewCertificate.student_id}</strong>, is a bonafide student of this Institute, currently studying in <strong>Year {viewCertificate.year}</strong> of the 4-year undergraduate programme <strong>{viewCertificate.programme}</strong> during the academic session 2026.
                  </p>

                  <p className="text-sm leading-relaxed text-slate-700 text-justify px-4">
                    This certificate is being issued on specific student request for the purpose of <strong>{viewCertificate.purpose}</strong> ({viewCertificate.details || 'General Verification'}).
                  </p>
                </div>

                <div className="pt-8 border-t border-slate-200 flex justify-between items-end px-4 text-xs">
                  <div>
                    <p className="text-slate-400">Date of Issue:</p>
                    <p className="font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900 border-t border-slate-800 pt-1">Registrar / Academic Dean</p>
                    <p className="text-[10px] text-slate-400">Digitally Verified & Signed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past Certificates Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">Issued Bonafide Certificates</h4>
              <span className="text-xs text-slate-500">{bonafideList.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Cert No</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-5 py-3">Purpose</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bonafideList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-slate-400">
                        No bonafide certificates issued yet.
                      </td>
                    </tr>
                  ) : (
                    bonafideList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-mono font-bold text-xs text-indigo-700">{c.certificate_no}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{c.student_name} ({c.student_id})</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{c.purpose}</td>
                        <td className="px-5 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setViewCertificate(c)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition border border-indigo-200"
                          >
                            View & Print
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
