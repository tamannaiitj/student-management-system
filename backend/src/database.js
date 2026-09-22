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

// Safe migration: Add average_marks column to existing students table if not present
try {
  db.exec('ALTER TABLE students ADD COLUMN average_marks REAL DEFAULT 0.0;');
} catch {
  // Column already exists
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
