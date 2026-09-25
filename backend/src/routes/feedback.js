import { Router } from 'express';
import { db } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const feedbackRouter = Router();
const staffOnly = [authenticateToken, requireRole('admin', 'faculty')];
const studentOnly = [authenticateToken, requireRole('student')];

function formResponse(row) {
  return { ...row, questions: JSON.parse(row.questions) };
}

function getForm(id) {
  return db.prepare(`
    SELECT f.*, u.full_name AS creator_name
    FROM feedback_forms f JOIN users u ON u.id = f.created_by WHERE f.id = ?
  `).get(id);
}

// Students see only forms currently floated; faculty/admin can also see drafts and closed forms.
feedbackRouter.get('/', authenticateToken, (req, res) => {
  const rows = ['admin', 'faculty'].includes(req.user.role)
    ? db.prepare(`SELECT f.*, u.full_name AS creator_name FROM feedback_forms f JOIN users u ON u.id = f.created_by ORDER BY f.created_at DESC`).all()
    : db.prepare(`SELECT f.*, u.full_name AS creator_name,
        EXISTS(SELECT 1 FROM feedback_responses r WHERE r.form_id = f.id AND r.student_user_id = ?) AS has_submitted
      FROM feedback_forms f JOIN users u ON u.id = f.created_by WHERE f.status = 'open' ORDER BY f.created_at DESC`).all(req.user.id);

  return res.json(rows.map(formResponse));
});

feedbackRouter.post('/', ...staffOnly, (req, res) => {
  const { title, professor_name, course = '', description = '', questions, status = 'draft' } = req.body;
  const cleanQuestions = Array.isArray(questions)
    ? questions.map((question) => ({
      id: String(question.id || '').trim(),
      prompt: String(question.prompt || '').trim().slice(0, 300),
      type: question.type === 'text' ? 'text' : 'rating'
    }))
    : [];

  if (!String(title || '').trim() || String(title).length > 120 || !String(professor_name || '').trim() || String(professor_name).length > 120) {
    return res.status(400).json({ message: 'Form title and professor name are required.' });
  }
  if (cleanQuestions.length < 1 || cleanQuestions.length > 20 || cleanQuestions.some((q) => !q.id || !q.prompt) || new Set(cleanQuestions.map((q) => q.id)).size !== cleanQuestions.length) {
    return res.status(400).json({ message: 'Add between 1 and 20 questions, each with a prompt.' });
  }
  if (!['draft', 'open'].includes(status)) {
    return res.status(400).json({ message: 'New forms can be saved as draft or opened.' });
  }

  const result = db.prepare(`
    INSERT INTO feedback_forms (title, professor_name, course, description, questions, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(String(title).trim(), String(professor_name).trim(), String(course).trim(), String(description).trim(), JSON.stringify(cleanQuestions), status, req.user.id);
  return res.status(201).json(formResponse(getForm(result.lastInsertRowid)));
});

feedbackRouter.patch('/:id/status', ...staffOnly, (req, res) => {
  const { status } = req.body;
  if (!['draft', 'open', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be draft, open, or closed.' });
  }
  const result = db.prepare(`UPDATE feedback_forms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, req.params.id);
  if (!result.changes) return res.status(404).json({ message: 'Feedback form not found.' });
  return res.json(formResponse(getForm(req.params.id)));
});

feedbackRouter.post('/:id/responses', ...studentOnly, (req, res) => {
  const form = getForm(req.params.id);
  if (!form || form.status !== 'open') return res.status(404).json({ message: 'This feedback form is not available.' });
  const submitted = req.body.answers;
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    return res.status(400).json({ message: 'Provide an answer for each question.' });
  }
  const questions = JSON.parse(form.questions);
  const answers = {};
  for (const question of questions) {
    const value = submitted[question.id];
    if (question.type === 'rating') {
      const rating = Number(value);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Please rate every item from 1 to 5.' });
      }
      answers[question.id] = rating;
    } else {
      const answer = String(value || '').trim();
      if (!answer || answer.length > 2000) return res.status(400).json({ message: 'Please answer each question (up to 2,000 characters).' });
      answers[question.id] = answer;
    }
  }
  try {
    db.prepare('INSERT INTO feedback_responses (form_id, student_user_id, answers) VALUES (?, ?, ?)')
      .run(form.id, req.user.id, JSON.stringify(answers));
    return res.status(201).json({ message: 'Your feedback has been submitted.' });
  } catch (error) {
    const existing = db.prepare('SELECT id FROM feedback_responses WHERE form_id = ? AND student_user_id = ?').get(form.id, req.user.id);
    if (existing) return res.status(409).json({ message: 'You have already submitted feedback for this form.' });
    throw error;
  }
});

feedbackRouter.get('/:id/responses', ...staffOnly, (req, res) => {
  const form = getForm(req.params.id);
  if (!form) return res.status(404).json({ message: 'Feedback form not found.' });
  const responses = db.prepare(`
    SELECT r.id, r.answers, r.created_at, u.full_name AS student_name, u.username, u.student_id
    FROM feedback_responses r JOIN users u ON u.id = r.student_user_id
    WHERE r.form_id = ? ORDER BY r.created_at DESC
  `).all(form.id).map((row) => ({ ...row, answers: JSON.parse(row.answers) }));
  return res.json(responses);
});
