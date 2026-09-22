# B.Tech Student ERP System

A full-stack Enterprise Resource Planning (ERP) application designed for colleges and universities offering **4-year B.Tech (Bachelor of Technology)** degree programs.

## Key Modules & Features
- **10 B.Tech Engineering Branches**: Pre-configured for CSE, AI & Data Science, IT, ECE, EEE, Mechanical, Civil, Materials Engineering, Bioengineering, and Chemical Engineering.
- **Automated Academic Performance**: Automatically computes and updates student `average_marks` directly in SQLite using database triggers.
- **Strict Attendance Tracker**: Class-wise daily attendance supporting strictly **`Present`** and **`Absent`** with percentage calculations.
- **Fee Management**: Student tuition fee invoices, payment processing, and printable receipt generation (`RCP-...`).
- **Examinations & Transcripts**: Marks entry with automatic letter grade computation (`A+` to `F`) and student report cards.
- **Role-Based Authentication**: Secure JWT-based access control with native password hashing (`admin`, `faculty`, `student`).
- **Modern Responsive Dashboard**: Clean web interface built with React, Vite, Tailwind CSS, and Lucide icons.

---

## Project Structure
```text
student-erp/
├── backend/            # Express.js REST API & SQLite Database
│   ├── src/
│   │   ├── middleware/ # CORS, Auth & Error Handling
│   │   ├── routes/     # Students, Courses, Attendance, Fees, Marks, Auth
│   │   ├── utils/      # Security & Token helpers
│   │   ├── database.js # SQLite schema & triggers
│   │   └── server.js   # Server entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/           # React 18 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/ # Dashboard, Students, Attendance, Fees, Marks, Courses, Login
│   │   ├── context/    # AuthContext (JWT & roles)
│   │   ├── services/   # Centralized API service
│   │   ├── App.jsx     # Main layout and view navigation
│   │   └── main.jsx    # React entrypoint
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Quick Start Guide

### 1. Start the Backend (Port 5000)
Open a terminal:
```powershell
cd backend
npm install
npm run dev
```
Backend will run at `http://localhost:5000`.
*Default Administrator*: `admin` / `admin123`.

### 2. Start the Frontend (Port 5173)
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to access the dashboard!
