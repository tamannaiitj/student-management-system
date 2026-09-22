import { Router } from 'express';
import { db } from '../database.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

export const studentsRouter = Router();
studentsRouter.use(authenticate);

const fields = ['student_id', 'first_name', 'last_name', 'email', 'phone', 'course', 'year', 'date_of_birth'];

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
  return Object.fromEntries(fields.map((field) => [field, body[field]?.toString().trim() || null]));
}

studentsRouter.get('/', (request, response) => {
  const search = request.query.search?.toString().trim() || '';
  const statement = search
    ? db.prepare(`SELECT * FROM students WHERE student_id LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR course LIKE ? ORDER BY id DESC`)
    : db.prepare('SELECT * FROM students ORDER BY id DESC');
  const students = search ? statement.all(...Array(5).fill(`%${search}%`)) : statement.all();
  response.json(students);
});

studentsRouter.get('/:id', (request, response) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(request.params.id);
  if (!student) return response.status(404).json({ message: 'Student not found.' });
  return response.json(student);
});

studentsRouter.post('/', allowRoles('admin'), (request, response) => {
  const student = normalizeStudent(request.body);
  const validationError = validateStudent(student);
  if (validationError) return response.status(400).json({ message: validationError });

  const result = db.prepare(`INSERT INTO students (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`)
    .run(...fields.map((field) => student[field]));
  const created = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  return response.status(201).json(created);
});

studentsRouter.put('/:id', allowRoles('admin'), (request, response) => {
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(request.params.id);
  if (!existing) return response.status(404).json({ message: 'Student not found.' });

  const student = normalizeStudent({ ...existing, ...request.body });
  const validationError = validateStudent(student);
  if (validationError) return response.status(400).json({ message: validationError });

  db.prepare(`UPDATE students SET ${fields.map((field) => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...fields.map((field) => student[field]), request.params.id);
  return response.json(db.prepare('SELECT * FROM students WHERE id = ?').get(request.params.id));
});

studentsRouter.delete('/:id', allowRoles('admin'), (request, response) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(request.params.id);
  if (!result.changes) return response.status(404).json({ message: 'Student not found.' });
  return response.status(204).send();
});
