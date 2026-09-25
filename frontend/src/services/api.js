npm const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('erp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  createUser: (userData) => request('/auth/users', { method: 'POST', body: JSON.stringify(userData) }),

  // Professor feedback forms
  getFeedbackForms: () => request('/feedback'),
  createFeedbackForm: (form) => request('/feedback', { method: 'POST', body: JSON.stringify(form) }),
  setFeedbackFormStatus: (id, status) => request(`/feedback/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  submitFeedback: (id, answers) => request(`/feedback/${id}/responses`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getFeedbackResponses: (id) => request(`/feedback/${id}/responses`),

  // Dashboard Stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Students
  getStudents: (search = '') => request(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (student) => request('/students', { method: 'POST', body: JSON.stringify(student) }),
  updateStudent: (id, student) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(student) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: (search = '') => request(`/courses${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCourse: (id) => request(`/courses/${id}`),
  createCourse: (course) => request('/courses', { method: 'POST', body: JSON.stringify(course) }),

  // Attendance (Present / Absent)
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance${query ? `?${query}` : ''}`);
  },
  getStudentAttendance: (studentId) => request(`/attendance/student/${studentId}`),
  markAttendance: (attendanceData) => request('/attendance', { method: 'POST', body: JSON.stringify(attendanceData) }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

  // Fees
  getFees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/fees${query ? `?${query}` : ''}`);
  },
  getStudentFees: (studentId) => request(`/fees/student/${studentId}`),
  createFee: (feeData) => request('/fees', { method: 'POST', body: JSON.stringify(feeData) }),
  payFee: (id, paymentData = {}) => request(`/fees/${id}/pay`, { method: 'POST', body: JSON.stringify(paymentData) }),
  deleteFee: (id) => request(`/fees/${id}`, { method: 'DELETE' }),

  // Marks & Examination
  getMarks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/marks${query ? `?${query}` : ''}`);
  },
  getStudentMarks: (studentId) => request(`/marks/student/${studentId}`),
  addMark: (markData) => request('/marks', { method: 'POST', body: JSON.stringify(markData) }),
  updateMark: (id, markData) => request(`/marks/${id}`, { method: 'PUT', body: JSON.stringify(markData) }),
  deleteMark: (id) => request(`/marks/${id}`, { method: 'DELETE' }),
};
