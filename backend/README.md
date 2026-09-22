# B.Tech Student ERP Backend API

A complete Express REST API backed by an embedded SQLite database (`node:sqlite`). Specially tailored for **B.Tech (Bachelor of Technology)** degree programs with built-in student academic performance tracking.

## Key Features
- **B.Tech Focused**: Exclusively configured for 4-year B.Tech engineering branches (`BTECH-CSE`, `BTECH-AI`, `BTECH-IT`, `BTECH-ECE`, `BTECH-EEE`, `BTECH-MECH`, `BTECH-CIVIL`, `BTECH-MAT`, `BTECH-BIO`, `BTECH-CHEM`).
- **Stored Average Marks**: `average_marks` is a persistent column in the `students` SQLite table, automatically calculated and updated via database triggers and marks endpoints whenever scores are added, modified, or removed.
- **Strict Attendance**: Supports daily and course-wise attendance tracking strictly for **`Present`** and **`Absent`**.
- **Role-Based Security**: Native salted password hashing (`node:crypto` scrypt) and JWT tokens with roles for `admin`, `faculty`, and `student`.
- **CORS Enabled**: Out-of-the-box support for modern frontends (React, Vite, Tailwind CSS).
- **ERP Modules**: Students, B.Tech Courses, Attendance, Fee Invoicing & Receipts, Exam Marks & Transcripts, and System Stats.

---

## Getting Started

### 1. Environment Configuration
The `.env` file is located in `backend/.env`:
```env
PORT=5000
DATABASE_PATH=./data/students.db
JWT_SECRET=student_erp_super_secret_jwt_key_2026
```

### 2. Run the Server
```powershell
cd backend
npm run dev
```
The server will start at `http://localhost:5000`.

### 3. Default Admin Credentials
When first started, the database automatically seeds a default administrator:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`

---

## Database Schema Highlights

### `students` Table
| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | Primary Key (Auto-increment) |
| `student_id` | TEXT | Unique student roll number (e.g., `BT2026CSE01`) |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `email` | TEXT | Unique email |
| `phone` | TEXT | Contact number |
| `course` | TEXT | B.Tech Branch (e.g., `BTECH-CSE`) |
| `year` | INTEGER | CHECK(`year BETWEEN 1 AND 4`) |
| `date_of_birth` | TEXT | YYYY-MM-DD |
| `average_marks` | REAL | Persistent average percentage (auto-updated by SQLite triggers) |
| `created_at` | TEXT | Timestamp |
| `updated_at` | TEXT | Timestamp |

---

## API Endpoints Reference

### 1. System & Dashboard
| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard/stats` | ERP Overview counts (students, courses, attendance today, pending fees) |

### 2. Authentication (`/api/auth`)
| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in with `username` (or `email`) and `password`. Returns JWT token. | None |
| `POST` | `/api/auth/register` | Register a new user | None |
| `POST` | `/api/auth/bootstrap`| Initial admin creation (if no admin exists) | None |
| `GET` | `/api/auth/me` | Current user profile | Bearer Token |
| `GET` | `/api/auth/users` | List all system user accounts | Admin |
| `POST` | `/api/auth/users` | Create staff/faculty/admin account | Admin |

### 3. Students (`/api/students`)
| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/students` | List all students (includes `average_marks`, search `?search=...`) | Bearer Token |
| `GET` | `/api/students/:id` | Get student by ID (includes `average_marks`) | Bearer Token |
| `POST` | `/api/students` | Add student (validates year 1–4) | Admin |
| `PUT` | `/api/students/:id` | Update student record | Admin |
| `DELETE` | `/api/students/:id` | Delete student record | Admin |

### 4. B.Tech Courses (`/api/courses`)
| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | List B.Tech branches (CSE, AI, IT, ECE, EEE, MECH, CIVIL, MAT, BIO, CHEM) | None |
| `GET` | `/api/courses/:id` | Get course details | None |
| `POST` | `/api/courses` | Add new B.Tech program (4 years) | Admin |
| `PUT` | `/api/courses/:id` | Update course details | Admin |
| `DELETE` | `/api/courses/:id` | Delete course | Admin |

### 5. Attendance Tracking (`/api/attendance`)
> **Note**: Allowed status values are strictly `Present` and `Absent`.

| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/attendance` | Filter attendance (`?student_id=`, `?course_code=`, `?date=`) | None |
| `GET` | `/api/attendance/student/:student_id` | Student attendance history and percentage stats | None |
| `POST` | `/api/attendance` | Record attendance (single or `{ records: [...] }` batch) | None |
| `DELETE` | `/api/attendance/:id` | Remove attendance record | None |

### 6. Fee Management (`/api/fees`)
| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/fees` | List fee invoices (`?student_id=`, `?status=`) | None |
| `GET` | `/api/fees/student/:student_id` | Student fee ledger (total billed, paid, pending) | None |
| `POST` | `/api/fees` | Create fee invoice for a student | None |
| `POST` | `/api/fees/:id/pay` | Record payment & generate receipt | None |
| `DELETE` | `/api/fees/:id` | Delete fee record | None |

### 7. Examinations & Marks (`/api/marks`)
| Method | Route | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/marks` | List exam marks (`?student_id=`, `?course_code=`) | None |
| `GET` | `/api/marks/student/:student_id` | Student transcript + computed average percentage & Grade | None |
| `POST` | `/api/marks` | Enter marks (auto-updates `students.average_marks`) | None |
| `PUT` | `/api/marks/:id` | Update marks (auto-updates `students.average_marks`) | None |
| `DELETE` | `/api/marks/:id` | Delete marks record (auto-updates `students.average_marks`) | None |
