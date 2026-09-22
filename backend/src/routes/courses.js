import { Router } from 'express';
import { db } from '../database.js';

export const coursesRouter = Router();

// List all courses (with optional search)
coursesRouter.get('/', (req, res) => {
  const search = req.query.search?.toString().trim() || '';
  if (search) {
    const courses = db.prepare(`
      SELECT * FROM courses
      WHERE course_code LIKE ? OR name LIKE ? OR department LIKE ?
      ORDER BY id ASC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
    return res.json(courses);
  }

  const courses = db.prepare('SELECT * FROM courses ORDER BY id ASC').all();
  return res.json(courses);
});

// Get single course by ID or course_code
coursesRouter.get('/:id', (req, res) => {
  const isNumeric = /^\d+$/.test(req.params.id);
  const course = isNumeric
    ? db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id)
    : db.prepare('SELECT * FROM courses WHERE course_code = ?').get(req.params.id.toUpperCase());

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.json(course);
});

// Create course
coursesRouter.post('/', (req, res) => {
  const { course_code, name, department, duration_years = 4, description = '' } = req.body;

  if (!course_code?.trim() || !name?.trim() || !department?.trim()) {
    return res.status(400).json({ message: 'Course code, name, and department are required.' });
  }

  const normalizedCode = course_code.trim().toUpperCase();
  if (!normalizedCode.startsWith('BTECH') && !name.toUpperCase().includes('B.TECH') && !name.toUpperCase().includes('BACHELOR OF TECHNOLOGY')) {
    return res.status(400).json({ message: 'This ERP is configured exclusively for B.Tech programs (e.g., code BTECH-CSE, name B.Tech in ...).' });
  }

  const existing = db.prepare('SELECT id FROM courses WHERE course_code = ?').get(normalizedCode);
  if (existing) {
    return res.status(409).json({ message: `Course with code ${normalizedCode} already exists.` });
  }

  const result = db.prepare(`
    INSERT INTO courses (course_code, name, department, duration_years, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(normalizedCode, name.trim(), department.trim(), Number(duration_years) || 4, description.trim() || null);

  const created = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
});

// Update course
coursesRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  const course_code = (req.body.course_code || existing.course_code).trim().toUpperCase();
  const name = (req.body.name || existing.name).trim();
  const department = (req.body.department || existing.department).trim();
  const duration_years = req.body.duration_years !== undefined ? Number(req.body.duration_years) : existing.duration_years;
  const description = req.body.description !== undefined ? req.body.description?.trim() : existing.description;

  db.prepare(`
    UPDATE courses
    SET course_code = ?, name = ?, department = ?, duration_years = ?, description = ?
    WHERE id = ?
  `).run(course_code, name, department, duration_years, description, req.params.id);

  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  return res.json(updated);
});

// Delete course
coursesRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.status(204).send();
});

