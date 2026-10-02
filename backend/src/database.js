import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hashPassword } from './utils/security.js';

const databasePath = resolve(process.env.DATABASE_PATH || './data/students.db');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

// Enable SQLite foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// 1. Students Table (Tailored specifically for 4-year B.Tech courses with average_marks)
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    course TEXT NOT NULL,
    year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 4),
    date_of_birth TEXT,
    average_marks REAL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe migration: Add profile columns to existing students table if not present
const profileColumns = [
  { name: 'average_marks', type: 'REAL DEFAULT 0.0' },
  { name: 'department', type: 'TEXT' },
  { name: 'degree_type', type: "TEXT DEFAULT '4-Year B.Tech'" },
  { name: 'admission_year', type: 'INTEGER' },
  { name: 'passing_year', type: 'INTEGER' },
  { name: 'semester', type: 'INTEGER DEFAULT 1' },
  { name: 'roll_no', type: 'TEXT' },
  { name: 'gender', type: 'TEXT' },
  { name: 'blood_group', type: 'TEXT' },
  { name: 'category', type: 'TEXT' },
  { name: 'nationality', type: "TEXT DEFAULT 'Indian'" },
  { name: 'aadhar_no', type: 'TEXT' },
  { name: 'bank_name', type: 'TEXT' },
  { name: 'bank_account_no', type: 'TEXT' },
  { name: 'bank_ifsc', type: 'TEXT' },
  { name: 'father_name', type: 'TEXT' },
  { name: 'father_occupation', type: 'TEXT' },
  { name: 'father_phone', type: 'TEXT' },
  { name: 'mother_name', type: 'TEXT' },
  { name: 'mother_occupation', type: 'TEXT' },
  { name: 'mother_phone', type: 'TEXT' },
  { name: 'guardian_name', type: 'TEXT' },
  { name: 'guardian_phone', type: 'TEXT' },
  { name: 'guardian_relation', type: 'TEXT' },
  { name: 'permanent_address', type: 'TEXT' },
  { name: 'current_address', type: 'TEXT' },
  { name: 'city', type: 'TEXT' },
  { name: 'state', type: 'TEXT' },
  { name: 'pincode', type: 'TEXT' },
  { name: 'country', type: "TEXT DEFAULT 'India'" }
];

for (const col of profileColumns) {
  try {
    db.exec(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type};`);
  } catch {
    // Column already exists
  }
}


// 2. Users & Authentication Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'faculty', 'student')),
    full_name TEXT NOT NULL,
    email TEXT,
    student_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 3. Courses Table (Tailored specifically for B.Tech programs, 4 years duration)
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    duration_years INTEGER NOT NULL DEFAULT 4,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 4. Attendance Table (Strictly 'Present' or 'Absent')
db.exec(`
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    course_code TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date, course_code)
  );
`);

// 5. Fees Management Table
db.exec(`
  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    due_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Paid')) DEFAULT 'Pending',
    paid_date TEXT,
    receipt_no TEXT UNIQUE,
    payment_mode TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 6. Examinations & Marks Table
db.exec(`
  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    course_code TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    marks_obtained REAL NOT NULL CHECK(marks_obtained >= 0),
    max_marks REAL NOT NULL CHECK(max_marks > 0),
    grade TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Feedback forms are created by faculty/admin and filled by student accounts.
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    professor_name TEXT NOT NULL,
    course TEXT,
    description TEXT,
    questions TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'open', 'closed')) DEFAULT 'draft',
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS feedback_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    student_user_id INTEGER NOT NULL,
    answers TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_id, student_user_id),
    FOREIGN KEY(form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
    FOREIGN KEY(student_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 7. Student Academic Services & Requests (ID Card, Convocation, No Dues, Bonafide, Mess Off)
db.exec(`
  CREATE TABLE IF NOT EXISTS student_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK(service_type IN ('id_card', 'convocation', 'settle_dues', 'no_dues', 'bonafide', 'mess_off')),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    reference_no TEXT UNIQUE,
    admin_remarks TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


// Triggers to automatically calculate and maintain average_marks in students table
db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_avg_marks_after_insert AFTER INSERT ON marks
  BEGIN
    UPDATE students
    SET average_marks = ROUND((SELECT COALESCE(AVG((marks_obtained * 100.0) / max_marks), 0) FROM marks WHERE student_id = NEW.student_id), 2)
    WHERE student_id = NEW.student_id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_avg_marks_after_update AFTER UPDATE ON marks
  BEGIN
    UPDATE students
    SET average_marks = ROUND((SELECT COALESCE(AVG((marks_obtained * 100.0) / max_marks), 0) FROM marks WHERE student_id = NEW.student_id), 2)
    WHERE student_id = NEW.student_id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_avg_marks_after_delete AFTER DELETE ON marks
  BEGIN
    UPDATE students
    SET average_marks = ROUND((SELECT COALESCE(AVG((marks_obtained * 100.0) / max_marks), 0) FROM marks WHERE student_id = OLD.student_id), 2)
    WHERE student_id = OLD.student_id;
  END;
`);

// Auto-seed default admin user if none exists
try {
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if (adminCheck && adminCheck.count === 0) {
    const adminPasswordHash = hashPassword('admin123');
    db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', adminPasswordHash, 'admin', 'System Administrator', 'admin@btech-erp.local');
    console.log('[Database] Seeded default admin user: "admin" with password "admin123"');
  }
} catch (err) {
  console.warn('[Database] Admin seed notice:', err.message);
}

// Ensure ONLY B.Tech courses are kept in the database
try {
  // Remove non-B.Tech courses
  db.exec(`
    DELETE FROM courses 
    WHERE course_code NOT LIKE 'BTECH%' 
      AND name NOT LIKE '%B.Tech%' 
      AND name NOT LIKE '%Bachelor of Technology%';
  `);

  const btechCourses = [
    ['BTECH-CSE', 'B.Tech in Computer Science & Engineering', 'Computer Science & Engineering', 4, '4-year B.Tech program in Computer Science & Engineering'],
    ['BTECH-AI', 'B.Tech in Artificial Intelligence & Data Science', 'Computer Science & Engineering', 4, '4-year B.Tech program in AI & Data Science'],
    ['BTECH-IT', 'B.Tech in Information Technology', 'Information Technology', 4, '4-year B.Tech program in Information Technology'],
    ['BTECH-ECE', 'B.Tech in Electronics & Communication Engineering', 'Electronics & Communication', 4, '4-year B.Tech program in ECE'],
    ['BTECH-EEE', 'B.Tech in Electrical & Electronics Engineering', 'Electrical Engineering', 4, '4-year B.Tech program in EEE'],
    ['BTECH-MECH', 'B.Tech in Mechanical Engineering', 'Mechanical Engineering', 4, '4-year B.Tech program in Mechanical Engineering'],
    ['BTECH-CIVIL', 'B.Tech in Civil Engineering', 'Civil Engineering', 4, '4-year B.Tech program in Civil Engineering'],
    ['BTECH-MAT', 'B.Tech in Materials Engineering', 'Materials Science & Engineering', 4, '4-year B.Tech program in Materials Science & Engineering'],
    ['BTECH-BIO', 'B.Tech in Bioengineering', 'Bioengineering & Biotechnology', 4, '4-year B.Tech program in Bioengineering'],
    ['BTECH-CHEM', 'B.Tech in Chemical Engineering', 'Chemical Engineering', 4, '4-year B.Tech program in Chemical Engineering']
  ];

  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses (course_code, name, department, duration_years, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of btechCourses) {
    insertCourse.run(...c);
  }
  console.log('[Database] Verified B.Tech courses in database (CSE, AI, IT, ECE, EEE, MECH, CIVIL, MAT, BIO, CHEM)');
} catch (err) {
  console.warn('[Database] B.Tech course seed notice:', err.message);
}

// 7. Comprehensive Student Profiles
db.exec(`
  CREATE TABLE IF NOT EXISTS student_full_profiles (
    student_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    category TEXT,
    nationality TEXT DEFAULT 'Indian',
    course TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 1,
    semester INTEGER NOT NULL DEFAULT 1,
    enrollment_date TEXT,
    hostel_name TEXT,
    room_no TEXT,
    permanent_address TEXT,
    corresponding_address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    father_name TEXT,
    father_occupation TEXT,
    mother_name TEXT,
    mother_occupation TEXT,
    family_annual_income TEXT,
    parents_phone TEXT,
    parents_email TEXT,
    blood_group TEXT,
    identification_mark TEXT,
    bank_account_name TEXT,
    bank_name TEXT,
    account_no TEXT,
    ifsc_code TEXT,
    bank_branch TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 8. ID Card Applications
db.exec(`
  CREATE TABLE IF NOT EXISTS id_card_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    programme TEXT NOT NULL,
    dob TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    identification_mark TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    corresponding_address TEXT NOT NULL,
    photo_url TEXT,
    signature_url TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted', 'Under Review', 'Approved', 'Printed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 9. Mess Off Applications
db.exec(`
  CREATE TABLE IF NOT EXISTS mess_off_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    email TEXT NOT NULL,
    mess_off_type TEXT NOT NULL,
    no_of_days INTEGER NOT NULL CHECK(no_of_days >= 1),
    leaving_date TEXT NOT NULL,
    returning_date TEXT NOT NULL,
    ticket_ref TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Forwarded', 'Approved', 'Rejected')),
    forwarded_to TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 10. Student Well-Being Form
db.exec(`
  CREATE TABLE IF NOT EXISTS wellbeing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    concern_type TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'Routine',
    preferred_slot TEXT,
    notes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Received' CHECK(status IN ('Received', 'Scheduled', 'Resolved')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 11. Student Convocation Registrations
db.exec(`
  CREATE TABLE IF NOT EXISTS convocation_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    programme TEXT NOT NULL,
    passing_year INTEGER NOT NULL,
    robe_size TEXT NOT NULL CHECK(robe_size IN ('S', 'M', 'L', 'XL')),
    attendance_mode TEXT NOT NULL CHECK(attendance_mode IN ('In-Person', 'In-Absentia')),
    guest_count INTEGER NOT NULL DEFAULT 0,
    dispatch_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Registered',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// 12. Bonafide Certificate Applications
db.exec(`
  CREATE TABLE IF NOT EXISTS bonafide_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    programme TEXT NOT NULL,
    year INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    details TEXT,
    certificate_no TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'Approved',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default profile for demo student if empty
try {
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM student_full_profiles').get().count;
  if (profileCount === 0) {
    db.prepare(`
      INSERT INTO student_full_profiles (
        student_id, full_name, dob, gender, category, nationality,
        course, year, semester, enrollment_date, hostel_name, room_no,
        permanent_address, corresponding_address, city, state, pincode,
        father_name, father_occupation, mother_name, mother_occupation, family_annual_income, parents_phone, parents_email,
        blood_group, identification_mark,
        bank_account_name, bank_name, account_no, ifsc_code, bank_branch
      ) VALUES (
        'BT2026CSE01', 'Asha Sharma', '2005-08-12', 'Female', 'General', 'Indian',
        'BTECH-CSE', 2, 3, '2024-08-01', 'Aryabhata Hall of Residence', 'B-304',
        '124 Shanti Vihar, Civil Lines', 'Aryabhata Hall, Room B-304, Campus Hostel', 'Jaipur', 'Rajasthan', '302006',
        'Ramesh Sharma', 'Government Officer', 'Sunita Sharma', 'High School Teacher', '₹8,50,000 / annum', '+91 98290 12345', 'ramesh.sharma@example.com',
        'B+', 'Small mole on right collarbone',
        'Asha Sharma', 'State Bank of India', '39820194821', 'SBIN0001234', 'University Campus Branch'
      )
    `).run();
  }
} catch (e) {
  console.warn('[Database] Student profile seed notice:', e.message);
}
