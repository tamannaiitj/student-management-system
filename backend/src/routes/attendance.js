import { Router } from 'express';
import { db } from '../database.js';

export const attendanceRouter = Router();

const VALID_STATUSES = ['Present', 'Absent'];

// Get attendance records (with optional query filters)
attendanceRouter.get('/', (req, res) => {
  const { student_id, course_code, date } = req.query;
  const conditions = [];
  const params = [];

  if (student_id) {
    conditions.push('student_id = ?');
    params.push(student_id);
  }
  if (course_code) {
    conditions.push('course_code = ?');
    params.push(course_code);
  }
  if (date) {
    conditions.push('date = ?');
    params.push(date);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT a.*, s.first_name, s.last_name, s.course as student_course
    FROM attendance a
    LEFT JOIN students s ON a.student_id = s.student_id
    ${whereClause}
    ORDER BY a.date DESC, a.id DESC
  `;

  const records = db.prepare(query).all(...params);
  return res.json(records);
});

// Get attendance statistics & history for a specific student
attendanceRouter.get('/student/:student_id', (req, res) => {
  const { student_id } = req.params;

  const records = db.prepare(`
    SELECT * FROM attendance
    WHERE student_id = ?
    ORDER BY date DESC
  `).all(student_id);

  const total = records.length;
  const present = records.filter(r => r.status === 'Present').length;
  const absent = records.filter(r => r.status === 'Absent').length;
  const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

  return res.json({
    student_id,
    stats: {
      total_days: total,
      present_count: present,
      absent_count: absent,
      percentage
    },
    records
  });
});

// Mark attendance (supports single record or batch of records)
attendanceRouter.post('/', (req, res) => {
  const upsertStatement = db.prepare(`
    INSERT INTO attendance (student_id, course_code, date, status, remarks)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(student_id, date, course_code) DO UPDATE SET
      status = excluded.status,
      remarks = excluded.remarks,
      created_at = CURRENT_TIMESTAMP
  `);

  // Batch support: { records: [...] }
  if (Array.isArray(req.body.records)) {
    const results = [];
    for (const record of req.body.records) {
      const { student_id, course_code = null, date, status, remarks = null } = record;

      if (!student_id || !date || !status) continue;
      if (!VALID_STATUSES.includes(status)) continue;

      upsertStatement.run(student_id.trim(), course_code ? course_code.trim() : null, date.trim(), status, remarks ? remarks.trim() : null);
      results.push({ student_id, date, status });
    }
    return res.status(201).json({ message: `Processed ${results.length} attendance records.`, processed: results });
  }

  // Single record: { student_id, course_code, date, status, remarks }
  const { student_id, course_code = null, date, status, remarks = null } = req.body;

  if (!student_id?.trim() || !date?.trim() || !status) {
    return res.status(400).json({ message: 'student_id, date, and status are required.' });
  }

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      message: `Invalid status: '${status}'. Allowed statuses are strictly: ${VALID_STATUSES.join(', ')}.`
    });
  }

  upsertStatement.run(
    student_id.trim(),
    course_code ? course_code.trim() : null,
    date.trim(),
    status,
    remarks ? remarks.trim() : null
  );

  const saved = db.prepare(`
    SELECT * FROM attendance
    WHERE student_id = ? AND date = ? AND (course_code = ? OR (course_code IS NULL AND ? IS NULL))
  `).get(
    student_id.trim(),
    date.trim(),
    course_code ? course_code.trim() : null,
    course_code ? course_code.trim() : null
  );

  return res.status(201).json(saved);
});

// Delete attendance record
attendanceRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ message: 'Attendance record not found.' });
  }
  return res.status(204).send();
});

