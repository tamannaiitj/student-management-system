import 'dotenv/config';
import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { studentsRouter } from './routes/students.js';
import { coursesRouter } from './routes/courses.js';
import { attendanceRouter } from './routes/attendance.js';
import { feesRouter } from './routes/fees.js';
import { marksRouter } from './routes/marks.js';
import { db } from './database.js';

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS & JSON Parsing
app.use(corsMiddleware);
app.use(express.json());

// Health Check
app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    system: 'Student ERP Backend',
    timestamp: new Date().toISOString()
  });
});

// Dashboard Overview / Stats endpoint for ERP
app.get('/api/dashboard/stats', (_request, response) => {
  try {
    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const today = new Date().toISOString().split('T')[0];
    const attendanceToday = db.prepare('SELECT COUNT(*) as count FROM attendance WHERE date = ?').get(today).count;
    const pendingFees = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = 'Pending'").get().total;

    response.json({
      total_students: studentCount,
      total_courses: courseCount,
      today_attendance_records: attendanceToday,
      total_pending_fees: pendingFees
    });
  } catch (error) {
    response.status(500).json({ message: 'Error retrieving dashboard stats', error: error.message });
  }
});

// API Routers
app.use('/api/auth', authRouter);
app.use('/api/students', studentsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/fees', feesRouter);
app.use('/api/marks', marksRouter);

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`===============================================`);
  console.log(`🚀 Student ERP Backend running at http://localhost:${port}`);
  console.log(`📡 Endpoints active: /api/auth, /api/students, /api/courses, /api/attendance, /api/fees, /api/marks`);
  console.log(`===============================================`);
});
