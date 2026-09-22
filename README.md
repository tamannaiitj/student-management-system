# Student ERP System

An Enterprise Resource Planning (ERP) system tailored for colleges and universities offering **B.Tech (Bachelor of Technology)** programs.

## Features
- **B.Tech Academic Management**: Configured for 4-year degree programs across 10 engineering branches (CSE, AI, IT, ECE, EEE, MECH, CIVIL, Materials, Bioengineering, Chemical).
- **Automated Academic Performance**: Automatically computes and tracks student `average_marks` and letter grades using SQLite triggers.
- **Strict Attendance Tracking**: Daily/course attendance logging strictly for `Present` and `Absent`.
- **Fee Management**: Student fee invoicing, payment recording, and automated receipt generation.
- **Role-Based Authentication**: Secure JWT-based access control with native password hashing (`admin`, `faculty`, `student`).
- **RESTful API**: Fast and clean API built with Node.js and Express.

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
└── README.md
```

## Quick Start (Backend)
```powershell
cd backend
npm install
npm run dev
```
The server will run at `http://localhost:5000`.
Default admin credentials: `admin` / `admin123`.

