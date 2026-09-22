import { Router } from 'express';
import { db } from '../database.js';

export const marksRouter = Router();

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

// Helper to keep students.average_marks synchronized in SQLite
export function syncStudentAverageMarks(student_id) {
  try {
    const avgResult = db.prepare(`
      SELECT ROUND(COALESCE(AVG((marks_obtained * 100.0) / max_marks), 0), 2) as avg_marks
      FROM marks
      WHERE student_id = ?
    `).get(student_id);

    const avg = avgResult ? avgResult.avg_marks : 0.0;
    db.prepare('UPDATE students SET average_marks = ? WHERE student_id = ?').run(avg, student_id);
    return avg;
  } catch {
    return 0.0;
  }
}

// List all marks (with optional filters)
marksRouter.get('/', (req, res) => {
  const { student_id, course_code, subject } = req.query;
  const conditions = [];
  const params = [];

  if (student_id) {
    conditions.push('m.student_id = ?');
    params.push(student_id);
  }
  if (course_code) {
    conditions.push('m.course_code = ?');
    params.push(course_code);
  }
  if (subject) {
    conditions.push('m.subject = ?');
    params.push(subject);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT m.*, s.first_name, s.last_name, s.course as student_course, s.average_marks as student_average_marks
    FROM marks m
    LEFT JOIN students s ON m.student_id = s.student_id
    ${whereClause}
    ORDER BY m.id DESC
  `;

  const records = db.prepare(query).all(...params);
  return res.json(records);
});

// Get transcript / report card for student
marksRouter.get('/student/:student_id', (req, res) => {
  const { student_id } = req.params;

  const student = db.prepare('SELECT student_id, first_name, last_name, course, year, average_marks FROM students WHERE student_id = ?').get(student_id);

  const records = db.prepare(`
    SELECT * FROM marks
    WHERE student_id = ?
    ORDER BY id ASC
  `).all(student_id);

  let totalObtained = 0;
  let totalMax = 0;

  for (const r of records) {
    totalObtained += Number(r.marks_obtained);
    totalMax += Number(r.max_marks);
  }

  const overallPercentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  const overallGrade = totalMax > 0 ? calculateGrade(overallPercentage) : 'N/A';

  // Ensure stored SQLite table average matches
  const storedAverage = student ? student.average_marks : syncStudentAverageMarks(student_id);

  return res.json({
    student: student || { student_id },
    summary: {
      total_subjects: records.length,
      total_obtained: totalObtained,
      total_max: totalMax,
      average_marks_percentage: storedAverage ?? overallPercentage,
      grade: overallGrade
    },
    marks: records
  });
});

// Add marks entry
marksRouter.post('/', (req, res) => {
  const { student_id, course_code, subject, exam_type, marks_obtained, max_marks } = req.body;

  if (!student_id?.trim() || !course_code?.trim() || !subject?.trim() || !exam_type?.trim() || marks_obtained === undefined || max_marks === undefined) {
    return res.status(400).json({ message: 'student_id, course_code, subject, exam_type, marks_obtained, and max_marks are required.' });
  }

  const obtained = Number(marks_obtained);
  const max = Number(max_marks);

  if (isNaN(obtained) || obtained < 0 || isNaN(max) || max <= 0 || obtained > max) {
    return res.status(400).json({ message: 'Marks obtained must be between 0 and max marks.' });
  }

  const percentage = (obtained / max) * 100;
  const grade = req.body.grade || calculateGrade(percentage);

  const result = db.prepare(`
    INSERT INTO marks (student_id, course_code, subject, exam_type, marks_obtained, max_marks, grade)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(student_id.trim(), course_code.trim().toUpperCase(), subject.trim(), exam_type.trim(), obtained, max, grade);

  // Synchronize and verify average_marks in students table
  const updatedAvg = syncStudentAverageMarks(student_id.trim());

  const created = db.prepare('SELECT * FROM marks WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({
    ...created,
    student_average_marks: updatedAvg
  });
});

// Update marks
marksRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Marks record not found.' });
  }

  const subject = req.body.subject?.trim() || existing.subject;
  const exam_type = req.body.exam_type?.trim() || existing.exam_type;
  const marks_obtained = req.body.marks_obtained !== undefined ? Number(req.body.marks_obtained) : existing.marks_obtained;
  const max_marks = req.body.max_marks !== undefined ? Number(req.body.max_marks) : existing.max_marks;
  const percentage = (marks_obtained / max_marks) * 100;
  const grade = req.body.grade || calculateGrade(percentage);

  db.prepare(`
    UPDATE marks
    SET subject = ?, exam_type = ?, marks_obtained = ?, max_marks = ?, grade = ?
    WHERE id = ?
  `).run(subject, exam_type, marks_obtained, max_marks, grade, req.params.id);

  // Synchronize average in SQLite table
  const updatedAvg = syncStudentAverageMarks(existing.student_id);

  const updated = db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id);
  return res.json({
    ...updated,
    student_average_marks: updatedAvg
  });
});

// Delete marks
marksRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM marks WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Marks record not found.' });
  }

  db.prepare('DELETE FROM marks WHERE id = ?').run(req.params.id);
  syncStudentAverageMarks(existing.student_id);

  return res.status(204).send();
});
