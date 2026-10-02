import { Router } from 'express';
import { db } from '../database.js';

export const studentServicesRouter = Router();

// ==========================================
// 1. Comprehensive Student Profile (Tabular)
// ==========================================
studentServicesRouter.get('/profile/:student_id', (req, res) => {
  const { student_id } = req.params;

  let profile = db.prepare('SELECT * FROM student_full_profiles WHERE student_id = ?').get(student_id);

  // Fallback to basic student record if full profile isn't saved yet
  if (!profile) {
    const basic = db.prepare('SELECT * FROM students WHERE student_id = ?').get(student_id);
    if (basic) {
      profile = {
        student_id: basic.student_id,
        full_name: `${basic.first_name} ${basic.last_name}`.trim(),
        dob: basic.date_of_birth || '',
        gender: '',
        category: 'General',
        nationality: 'Indian',
        course: basic.course || 'BTECH-CSE',
        year: basic.year || 1,
        semester: (basic.year || 1) * 2 - 1,
        enrollment_date: '',
        hostel_name: '',
        room_no: '',
        permanent_address: '',
        corresponding_address: '',
        city: '',
        state: '',
        pincode: '',
        father_name: '',
        father_occupation: '',
        mother_name: '',
        mother_occupation: '',
        family_annual_income: '',
        parents_phone: basic.phone || '',
        parents_email: basic.email || '',
        blood_group: '',
        identification_mark: '',
        bank_account_name: `${basic.first_name} ${basic.last_name}`.trim(),
        bank_name: '',
        account_no: '',
        ifsc_code: '',
        bank_branch: ''
      };
    }
  }

  if (!profile) {
    return res.status(404).json({ message: 'Profile not found for this student.' });
  }

  return res.json(profile);
});

studentServicesRouter.put('/profile/:student_id', (req, res) => {
  const { student_id } = req.params;
  const b = req.body;

  const upsert = db.prepare(`
    INSERT INTO student_full_profiles (
      student_id, full_name, dob, gender, category, nationality,
      course, year, semester, enrollment_date, hostel_name, room_no,
      permanent_address, corresponding_address, city, state, pincode,
      father_name, father_occupation, mother_name, mother_occupation, family_annual_income, parents_phone, parents_email,
      blood_group, identification_mark,
      bank_account_name, bank_name, account_no, ifsc_code, bank_branch, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
    )
    ON CONFLICT(student_id) DO UPDATE SET
      full_name = excluded.full_name,
      dob = excluded.dob,
      gender = excluded.gender,
      category = excluded.category,
      nationality = excluded.nationality,
      course = excluded.course,
      year = excluded.year,
      semester = excluded.semester,
      enrollment_date = excluded.enrollment_date,
      hostel_name = excluded.hostel_name,
      room_no = excluded.room_no,
      permanent_address = excluded.permanent_address,
      corresponding_address = excluded.corresponding_address,
      city = excluded.city,
      state = excluded.state,
      pincode = excluded.pincode,
      father_name = excluded.father_name,
      father_occupation = excluded.father_occupation,
      mother_name = excluded.mother_name,
      mother_occupation = excluded.mother_occupation,
      family_annual_income = excluded.family_annual_income,
      parents_phone = excluded.parents_phone,
      parents_email = excluded.parents_email,
      blood_group = excluded.blood_group,
      identification_mark = excluded.identification_mark,
      bank_account_name = excluded.bank_account_name,
      bank_name = excluded.bank_name,
      account_no = excluded.account_no,
      ifsc_code = excluded.ifsc_code,
      bank_branch = excluded.bank_branch,
      updated_at = CURRENT_TIMESTAMP
  `);

  upsert.run(
    student_id,
    b.full_name || '',
    b.dob || '',
    b.gender || '',
    b.category || '',
    b.nationality || 'Indian',
    b.course || 'BTECH-CSE',
    Number(b.year) || 1,
    Number(b.semester) || 1,
    b.enrollment_date || '',
    b.hostel_name || '',
    b.room_no || '',
    b.permanent_address || '',
    b.corresponding_address || '',
    b.city || '',
    b.state || '',
    b.pincode || '',
    b.father_name || '',
    b.father_occupation || '',
    b.mother_name || '',
    b.mother_occupation || '',
    b.family_annual_income || '',
    b.parents_phone || '',
    b.parents_email || '',
    b.blood_group || '',
    b.identification_mark || '',
    b.bank_account_name || '',
    b.bank_name || '',
    b.account_no || '',
    b.ifsc_code || '',
    b.bank_branch || ''
  );

  const updated = db.prepare('SELECT * FROM student_full_profiles WHERE student_id = ?').get(student_id);
  return res.json({ message: 'Profile updated successfully.', profile: updated });
});

// ==========================================
// 2. ID Card Application
// ==========================================
studentServicesRouter.get('/id-card', (req, res) => {
  const { student_id } = req.query;
  const list = student_id
    ? db.prepare('SELECT * FROM id_card_applications WHERE student_id = ? ORDER BY id DESC').all(student_id)
    : db.prepare('SELECT * FROM id_card_applications ORDER BY id DESC').all();
  return res.json(list);
});

studentServicesRouter.post('/id-card', (req, res) => {
  const {
    student_id, full_name, programme, dob, blood_group,
    identification_mark, emergency_contact, corresponding_address,
    photo_url = '', signature_url = ''
  } = req.body;

  if (!student_id?.trim() || !full_name?.trim() || !blood_group?.trim()) {
    return res.status(400).json({ message: 'Roll No, Full Name, and Blood Group are required for ID Card.' });
  }

  const result = db.prepare(`
    INSERT INTO id_card_applications (
      student_id, full_name, programme, dob, blood_group,
      identification_mark, emergency_contact, corresponding_address,
      photo_url, signature_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
  `).run(
    student_id.trim(),
    full_name.trim(),
    programme?.trim() || 'B.Tech',
    dob?.trim() || '',
    blood_group.trim(),
    identification_mark?.trim() || '',
    emergency_contact?.trim() || '',
    corresponding_address?.trim() || '',
    photo_url,
    signature_url
  );

  const application = db.prepare('SELECT * FROM id_card_applications WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ message: 'ID Card application submitted successfully.', application });
});

// ==========================================
// 3. Mess Off Application Report
// ==========================================
studentServicesRouter.get('/mess-off', (req, res) => {
  const { student_id } = req.query;
  const list = student_id
    ? db.prepare('SELECT * FROM mess_off_applications WHERE student_id = ? ORDER BY id DESC').all(student_id)
    : db.prepare('SELECT * FROM mess_off_applications ORDER BY id DESC').all();
  return res.json(list);
});

studentServicesRouter.post('/mess-off', (req, res) => {
  const {
    student_id, email, mess_off_type, no_of_days,
    leaving_date, returning_date, ticket_ref = '', remarks = ''
  } = req.body;

  if (!student_id?.trim() || !email?.trim() || !leaving_date || !returning_date) {
    return res.status(400).json({ message: 'Roll No, Email, leaving date, and returning date are required.' });
  }

  const days = Number(no_of_days) || 1;
  const result = db.prepare(`
    INSERT INTO mess_off_applications (
      student_id, email, mess_off_type, no_of_days,
      leaving_date, returning_date, ticket_ref, remarks, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    student_id.trim(),
    email.trim(),
    mess_off_type || 'Vacation',
    days,
    leaving_date,
    returning_date,
    ticket_ref.trim(),
    remarks.trim()
  );

  const created = db.prepare('SELECT * FROM mess_off_applications WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ message: 'Mess Off request raised successfully.', application: created });
});

studentServicesRouter.put('/mess-off/:id/forward', (req, res) => {
  const { id } = req.params;
  const { forwarded_to = 'Hostel Warden / Mess Committee' } = req.body;

  db.prepare(`
    UPDATE mess_off_applications
    SET status = 'Forwarded', forwarded_to = ?
    WHERE id = ?
  `).run(forwarded_to, id);

  const updated = db.prepare('SELECT * FROM mess_off_applications WHERE id = ?').get(id);
  return res.json({ message: `Application forwarded to ${forwarded_to}.`, application: updated });
});

// ==========================================
// 4. Student Well-Being Form
// ==========================================
studentServicesRouter.get('/well-being', (req, res) => {
  const { student_id } = req.query;
  const list = student_id
    ? db.prepare('SELECT * FROM wellbeing_requests WHERE student_id = ? ORDER BY id DESC').all(student_id)
    : db.prepare('SELECT * FROM wellbeing_requests ORDER BY id DESC').all();
  return res.json(list);
});

studentServicesRouter.post('/well-being', (req, res) => {
  const { student_id, student_name, concern_type, urgency = 'Routine', preferred_slot = '', notes } = req.body;

  if (!student_id?.trim() || !student_name?.trim() || !notes?.trim()) {
    return res.status(400).json({ message: 'Roll No, Name, and Notes are required.' });
  }

  const result = db.prepare(`
    INSERT INTO wellbeing_requests (
      student_id, student_name, concern_type, urgency, preferred_slot, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'Received')
  `).run(
    student_id.trim(),
    student_name.trim(),
    concern_type || 'Academic & Campus Well-Being',
    urgency,
    preferred_slot.trim(),
    notes.trim()
  );

  const created = db.prepare('SELECT * FROM wellbeing_requests WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({
    message: 'Your confidential well-being check-in has been received. A counselor will reach out shortly.',
    request: created
  });
});

// ==========================================
// 5. Convocation Registration
// ==========================================
studentServicesRouter.get('/convocation/:student_id', (req, res) => {
  const { student_id } = req.params;
  const record = db.prepare('SELECT * FROM convocation_details WHERE student_id = ?').get(student_id);
  return res.json(record || null);
});

studentServicesRouter.post('/convocation', (req, res) => {
  const {
    student_id, student_name, programme, passing_year,
    robe_size = 'L', attendance_mode = 'In-Person', guest_count = 0, dispatch_address
  } = req.body;

  if (!student_id?.trim() || !student_name?.trim() || !dispatch_address?.trim()) {
    return res.status(400).json({ message: 'Roll No, Name, and Certificate Dispatch Address are required.' });
  }

  const upsert = db.prepare(`
    INSERT INTO convocation_details (
      student_id, student_name, programme, passing_year,
      robe_size, attendance_mode, guest_count, dispatch_address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Registered')
    ON CONFLICT(student_id) DO UPDATE SET
      student_name = excluded.student_name,
      programme = excluded.programme,
      passing_year = excluded.passing_year,
      robe_size = excluded.robe_size,
      attendance_mode = excluded.attendance_mode,
      guest_count = excluded.guest_count,
      dispatch_address = excluded.dispatch_address,
      status = 'Registered'
  `);

  upsert.run(
    student_id.trim(),
    student_name.trim(),
    programme || 'B.Tech',
    Number(passing_year) || 2026,
    robe_size,
    attendance_mode,
    Number(guest_count) || 0,
    dispatch_address.trim()
  );

  const record = db.prepare('SELECT * FROM convocation_details WHERE student_id = ?').get(student_id.trim());
  return res.status(201).json({ message: 'Convocation registration saved successfully.', convocation: record });
});

// ==========================================
// 6. Apply for Bonafide Certificate
// ==========================================
studentServicesRouter.get('/bonafide', (req, res) => {
  const { student_id } = req.query;
  const list = student_id
    ? db.prepare('SELECT * FROM bonafide_requests WHERE student_id = ? ORDER BY id DESC').all(student_id)
    : db.prepare('SELECT * FROM bonafide_requests ORDER BY id DESC').all();
  return res.json(list);
});

studentServicesRouter.post('/bonafide', (req, res) => {
  const { student_id, student_name, programme, year, purpose, details = '' } = req.body;

  if (!student_id?.trim() || !student_name?.trim() || !purpose?.trim()) {
    return res.status(400).json({ message: 'Roll No, Student Name, and Purpose are required.' });
  }

  const certificate_no = `BONA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const result = db.prepare(`
    INSERT INTO bonafide_requests (
      student_id, student_name, programme, year, purpose, details, certificate_no, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')
  `).run(
    student_id.trim(),
    student_name.trim(),
    programme || 'B.Tech in Computer Science & Engineering',
    Number(year) || 2,
    purpose.trim(),
    details.trim(),
    certificate_no
  );

  const cert = db.prepare('SELECT * FROM bonafide_requests WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ message: 'Bonafide certificate generated and approved.', certificate: cert });
});
