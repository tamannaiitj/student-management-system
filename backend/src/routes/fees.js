import { Router } from 'express';
import { db } from '../database.js';

export const feesRouter = Router();

// List all fee invoices (with optional filters)
feesRouter.get('/', (req, res) => {
  const { student_id, status } = req.query;
  const conditions = [];
  const params = [];

  if (student_id) {
    conditions.push('f.student_id = ?');
    params.push(student_id);
  }
  if (status) {
    conditions.push('f.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT f.*, s.first_name, s.last_name, s.course, s.email
    FROM fees f
    LEFT JOIN students s ON f.student_id = s.student_id
    ${whereClause}
    ORDER BY f.id DESC
  `;

  const fees = db.prepare(query).all(...params);
  return res.json(fees);
});

// Get student fee summary and invoices
feesRouter.get('/student/:student_id', (req, res) => {
  const { student_id } = req.params;

  const invoices = db.prepare(`
    SELECT * FROM fees
    WHERE student_id = ?
    ORDER BY id DESC
  `).all(student_id);

  let totalBilled = 0;
  let totalPaid = 0;
  let totalPending = 0;

  for (const inv of invoices) {
    totalBilled += Number(inv.amount);
    if (inv.status === 'Paid') {
      totalPaid += Number(inv.amount);
    } else {
      totalPending += Number(inv.amount);
    }
  }

  return res.json({
    student_id,
    summary: {
      total_billed: totalBilled,
      total_paid: totalPaid,
      total_pending: totalPending
    },
    invoices
  });
});

// Create new fee invoice
feesRouter.post('/', (req, res) => {
  const { student_id, title, amount, due_date } = req.body;

  if (!student_id?.trim() || !title?.trim() || amount === undefined || !due_date?.trim()) {
    return res.status(400).json({ message: 'student_id, title, amount, and due_date are required.' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return res.status(400).json({ message: 'Amount must be a positive number.' });
  }

  const result = db.prepare(`
    INSERT INTO fees (student_id, title, amount, due_date, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `).run(student_id.trim(), title.trim(), numAmount, due_date.trim());

  const created = db.prepare('SELECT * FROM fees WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(created);
});

// Mark fee invoice as paid (generates receipt)
feesRouter.post('/:id/pay', (req, res) => {
  const existing = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Fee invoice not found.' });
  }

  if (existing.status === 'Paid') {
    return res.status(400).json({ message: 'This invoice is already marked as paid.', invoice: existing });
  }

  const payment_mode = req.body.payment_mode || 'Cash';
  const receipt_no = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const paid_date = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE fees
    SET status = 'Paid', paid_date = ?, receipt_no = ?, payment_mode = ?
    WHERE id = ?
  `).run(paid_date, receipt_no, payment_mode, req.params.id);

  const updated = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
  return res.json({ message: 'Payment recorded successfully.', invoice: updated });
});

// Delete fee record
feesRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM fees WHERE id = ?').run(req.params.id);
  if (!result.changes) {
    return res.status(404).json({ message: 'Fee invoice not found.' });
  }
  return res.status(204).send();
});

