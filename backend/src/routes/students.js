import { Router } from 'express';
import { db } from '../database.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

export const studentsRouter = Router();
studentsRouter.use(authenticate);

const branchDepartmentMap = {
  'BTECH-CSE': 'Department of Computer Science & Engineering',
  'BTECH-AI': 'Department of Artificial Intelligence & Data Science',
  'BTECH-IT': 'Department of Information Technology',
  'BTECH-ECE': 'Department of Electronics & Communication Engineering',
  'BTECH-EEE': 'Department of Electrical & Electronics Engineering',
  'BTECH-MECH': 'Department of Mechanical Engineering',
  'BTECH-CIVIL': 'Department of Civil Engineering',
  'BTECH-MAT': 'Department of Materials Engineering',
  'BTECH-BIO': 'Department of Bioengineering',
  'BTECH-CHEM': 'Department of Chemical Engineering'
};

const fields = [
  'student_id', 'first_name', 'last_name', 'email', 'phone', 'course', 'year', 'date_of_birth',
  'department', 'degree_type', 'admission_year', 'passing_year', 'semester', 'roll_no',
  'gender', 'blood_group', 'category', 'nationality', 'aadhar_no',
  'bank_name', 'bank_account_no', 'bank_ifsc',
  'father_name', 'father_occupation', 'father_phone',
  'mother_name', 'mother_occupation', 'mother_phone',
  'guardian_name', 'guardian_phone', 'guardian_relation',
  'permanent_address', 'current_address', 'city', 'state', 'pincode', 'country'
];

function validateStudent(student) {
  const required = ['student_id', 'first_name', 'last_name', 'email', 'course', 'year'];
  const missing = required.filter((field) => !student[field]?.toString().trim());
  if (missing.length) return `Required fields: ${missing.join(', ')}.`;
  if (!/^\S+@\S+\.\S+$/.test(student.email)) return 'Enter a valid email address.';
  if (!Number.isInteger(Number(student.year)) || Number(student.year) < 1 || Number(student.year) > 4) {
    return 'B.Tech academic year must be a whole number between 1 and 4.';
  }
  return null;
}

function normalizeStudent(body) {
  const currentYear = new Date().getFullYear();
  const yearNum = Number(body.year) || 1;
  const course = body.course?.toString().trim() || 'BTECH-CSE';

  const normalized = Object.fromEntries(fields.map((field) => {
    const val = body[field];
    return [field, val !== undefined && val !== null && val.toString().trim() !== '' ? val.toString().trim() : null];
  }));

  // Auto-infer defaults if omitted
  if (!normalized.department) {
    normalized.department = branchDepartmentMap[course] || 'Department of Engineering';
  }
  if (!normalized.degree_type) {
    normalized.degree_type = '4-Year B.Tech (Bachelor of Technology)';
  }
  if (!normalized.admission_year) {
    normalized.admission_year = currentYear - (yearNum - 1);
  }
  if (!normalized.passing_year) {
    normalized.passing_year = Number(normalized.admission_year) + 4;
  }
  if (!normalized.semester) {
    normalized.semester = (yearNum * 2) - 1;
  }
  if (!normalized.roll_no && normalized.student_id) {
    normalized.roll_no = normalized.student_id;
  }
  if (!normalized.nationality) {
    normalized.nationality = 'Indian';
  }
  if (!normalized.country) {
    normalized.country = 'India';
  }

  return normalized;
}

// 1. Get Logged-in User's Own Profile
studentsRouter.get('/profile/me', (request, response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(request.user.id);
  if (!user) return response.status(404).json({ message: 'User not found.' });

  let student = null;
  if (user.student_id) {
    student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(user.student_id);
  }
  if (!student && user.email) {
    student = db.prepare('SELECT * FROM students WHERE email = ?').get(user.email);
  }

  if (student) {
    return response.json(student);
  }

  // Fallback starter profile for students who haven't yet filled full details
  const nameParts = (user.full_name || '').trim().split(' ');
  const firstName = nameParts[0] || 'Student';
  const lastName = nameParts.slice(1).join(' ') || '';
  const currentYear = new Date().getFullYear();

  return response.json({
    id: null,
    student_id: user.student_id || `BT${currentYear}CSE${Math.floor(100 + Math.random() * 900)}`,
    first_name: firstName,
    last_name: lastName,
    email: user.email || '',
    phone: '',
    course: 'BTECH-CSE',
    year: 1,
    semester: 1,
    department: 'Department of Computer Science & Engineering',
    degree_type: '4-Year B.Tech (Bachelor of Technology)',
    admission_year: currentYear,
    passing_year: currentYear + 4,
    roll_no: user.student_id || '',
    average_marks: 0.0,
    is_new: true
  });
});

// 2. Update Logged-in User's Own Profile
studentsRouter.put('/profile/me', (request, response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(request.user.id);
  if (!user) return response.status(404).json({ message: 'User not found.' });

  let existing = null;
  if (user.student_id) {
    existing = db.prepare('SELECT * FROM students WHERE student_id = ?').get(user.student_id);
  }
  if (!existing && user.email) {
    existing = db.prepare('SELECT * FROM students WHERE email = ?').get(user.email);
  }

  const studentData = normalizeStudent({
    ...existing,
    ...request.body,
    email: user.email || request.body.email // maintain verified email
  });

  const validationError = validateStudent(studentData);
  if (validationError) return response.status(400).json({ message: validationError });

  if (existing) {
    db.prepare(`UPDATE students SET ${fields.map((f) => `${f} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...fields.map((f) => studentData[f]), existing.id);

    // Keep user's full_name and student_id in sync
    const fullName = `${studentData.first_name} ${studentData.last_name}`.trim();
    db.prepare('UPDATE users SET full_name = ?, student_id = ? WHERE id = ?')
      .run(fullName, studentData.student_id, user.id);

    return response.json(db.prepare('SELECT * FROM students WHERE id = ?').get(existing.id));
  } else {
    // Create student entry and link to user
    const result = db.prepare(`INSERT INTO students (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`)
      .run(...fields.map((f) => studentData[f]));

    const fullName = `${studentData.first_name} ${studentData.last_name}`.trim();
    db.prepare('UPDATE users SET full_name = ?, student_id = ? WHERE id = ?')
      .run(fullName, studentData.student_id, user.id);

    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    return response.status(201).json(created);
  }
});

// 3. Student Academic Services (ID Card, Convocation, No Dues, Bonafide, Mess Off, Dues)
studentsRouter.get('/services', (request, response) => {
  const { service_type, student_id } = request.query;
  let query = 'SELECT s.*, st.first_name, st.last_name, st.course, st.year FROM student_services s LEFT JOIN students st ON st.student_id = s.student_id';
  const params = [];
  const conditions = [];

  if (request.user.role === 'student') {
    const user = db.prepare('SELECT student_id, email FROM users WHERE id = ?').get(request.user.id);
    let sId = user?.student_id;
    if (!sId && user?.email) {
      const student = db.prepare('SELECT student_id FROM students WHERE email = ?').get(user.email);
      sId = student?.student_id;
    }
    conditions.push('(s.student_id = ? OR s.student_id = ?)');
    params.push(sId || 'unknown', request.user.student_id || 'unknown');
  } else if (student_id) {
    conditions.push('s.student_id = ?');
    params.push(student_id);
  }

  if (service_type) {
    conditions.push('s.service_type = ?');
    params.push(service_type);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY s.id DESC';

  const rows = db.prepare(query).all(...params);
  const parsed = rows.map((r) => {
    let detailsObj = {};
    try { detailsObj = JSON.parse(r.details); } catch {}
    return { ...r, details: detailsObj };
  });

  return response.json(parsed);
});

studentsRouter.post('/services', (request, response) => {
  const { student_id, service_type, title, details } = request.body;
  const validServices = ['id_card', 'convocation', 'settle_dues', 'no_dues', 'bonafide', 'mess_off'];

  if (!service_type || !validServices.includes(service_type)) {
    return response.status(400).json({ message: `service_type must be one of: ${validServices.join(', ')}.` });
  }

  const sid = (student_id || request.user.student_id || '').trim();
  if (!sid) {
    return response.status(400).json({ message: 'student_id is required.' });
  }

  const prefixMap = {
    id_card: 'IDC',
    convocation: 'CNV',
    no_dues: 'NDR',
    bonafide: 'BON',
    mess_off: 'MOF',
    settle_dues: 'DUE'
  };

  const refPrefix = prefixMap[service_type] || 'SRV';
  const refNo = `${refPrefix}-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const defaultTitle = {
    id_card: 'Student Identity Card Application',
    convocation: 'Annual Convocation Degree Conferral',
    no_dues: 'No Dues Clearance Certificate Request',
    bonafide: 'Institute Bonafide Certificate Application',
    mess_off: 'Hostel Mess Off Rebate Application',
    settle_dues: 'Outstanding Dues Clearance'
  }[service_type] || 'Academic Service Request';

  const result = db.prepare(`
    INSERT INTO student_services (student_id, service_type, title, details, reference_no, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `).run(sid, service_type, title || defaultTitle, JSON.stringify(details || {}), refNo);

  const row = db.prepare('SELECT * FROM student_services WHERE id = ?').get(result.lastInsertRowid);
  let parsedDetails = {};
  try { parsedDetails = JSON.parse(row.details); } catch {}

  return response.status(201).json({ ...row, details: parsedDetails });
});

studentsRouter.patch('/services/:serviceId/status', allowRoles('admin', 'faculty'), (request, response) => {
  const { status, admin_remarks } = request.body;
  const allowed = ['Pending', 'Approved', 'Rejected', 'Completed', 'Cleared'];
  if (!status || !allowed.includes(status)) {
    return response.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}.` });
  }

  const existing = db.prepare('SELECT * FROM student_services WHERE id = ?').get(request.params.serviceId);
  if (!existing) return response.status(404).json({ message: 'Service request not found.' });

  db.prepare(`
    UPDATE student_services
    SET status = ?, admin_remarks = COALESCE(?, admin_remarks), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, admin_remarks || null, request.params.serviceId);

  const updated = db.prepare('SELECT * FROM student_services WHERE id = ?').get(request.params.serviceId);
  let parsedDetails = {};
  try { parsedDetails = JSON.parse(updated.details); } catch {}
  return response.json({ ...updated, details: parsedDetails });
});

// Dues breakdown endpoint
studentsRouter.get('/dues/:studentId', (request, response) => {
  const { studentId } = request.params;
  const feeRows = db.prepare('SELECT * FROM fees WHERE student_id = ?').all(studentId);
  const pendingFees = feeRows.filter((f) => f.status === 'Pending');
  const paidFees = feeRows.filter((f) => f.status === 'Paid');

  const totalPending = pendingFees.reduce((a, b) => a + Number(b.amount), 0);

  const duesBreakdown = [
    { id: 'tuition', category: 'Semester Tuition Fee', amount: totalPending, status: totalPending > 0 ? 'Pending' : 'Cleared' },
    { id: 'hostel', category: 'Hostel Rent & Electricity', amount: 0, status: 'Cleared' },
    { id: 'mess', category: 'Mess Catering Charges', amount: 0, status: 'Cleared' },
    { id: 'library', category: 'Library Fine / Overdue Books', amount: 0, status: 'Cleared' },
    { id: 'lab', category: 'Department Workshop & Lab Equipment', amount: 0, status: 'Cleared' }
  ];

  return response.json({
    student_id: studentId,
    pending_fees: pendingFees,
    paid_fees: paidFees,
    dues_breakdown: duesBreakdown,
    total_pending: totalPending
  });
});

// 4. Search and list all students (admin, faculty)
studentsRouter.get('/', (request, response) => {
  const search = request.query.search?.toString().trim() || '';
  const statement = search
    ? db.prepare(`SELECT * FROM students WHERE student_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR course LIKE ? OR roll_no LIKE ? ORDER BY id DESC`)
    : db.prepare('SELECT * FROM students ORDER BY id DESC');
  const students = search ? statement.all(...Array(6).fill(`%${search}%`)) : statement.all();
  response.json(students);
});

// 4. Get specific student by ID
studentsRouter.get('/:id', (request, response) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(request.params.id, request.params.id);
  if (!student) return response.status(404).json({ message: 'Student not found.' });
  return response.json(student);
});

// 5. Create new student (admin only)
studentsRouter.post('/', allowRoles('admin'), (request, response) => {
  const student = normalizeStudent(request.body);
  const validationError = validateStudent(student);
  if (validationError) return response.status(400).json({ message: validationError });

  const result = db.prepare(`INSERT INTO students (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`)
    .run(...fields.map((field) => student[field]));
  const created = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  return response.status(201).json(created);
});

// 6. Update student by ID (admin only)
studentsRouter.put('/:id', allowRoles('admin'), (request, response) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(request.params.id, request.params.id);
  if (!existing) return response.status(404).json({ message: 'Student not found.' });

  const student = normalizeStudent({ ...existing, ...request.body });
  const validationError = validateStudent(student);
  if (validationError) return response.status(400).json({ message: validationError });

  db.prepare(`UPDATE students SET ${fields.map((field) => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...fields.map((field) => student[field]), existing.id);
  return response.json(db.prepare('SELECT * FROM students WHERE id = ?').get(existing.id));
});

// 7. Delete student (admin only)
studentsRouter.delete('/:id', allowRoles('admin'), (request, response) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(request.params.id);
  if (!result.changes) return response.status(404).json({ message: 'Student not found.' });
  return response.status(204).send();
});

