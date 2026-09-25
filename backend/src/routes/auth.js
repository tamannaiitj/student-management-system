import { Router } from 'express';
import { db } from '../database.js';
import { hashPassword, verifyPassword, createToken } from '../utils/security.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export const authRouter = Router();

// Bootstrap initial admin account (only allowed if no admin exists)
authRouter.post('/bootstrap', (req, res) => {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (adminExists) {
    return res.status(400).json({ message: 'Bootstrap is closed. An administrator already exists.' });
  }

  const { name, full_name, email, username, password } = req.body;
  const adminName = (full_name || name || '').trim();
  const adminEmail = (email || '').trim();
  const adminUser = (username || adminEmail.split('@')[0] || 'admin').trim();

  if (!password || password.length < 6 || !adminName) {
    return res.status(400).json({ message: 'Name and a password (min 6 chars) are required.' });
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email)
    VALUES (?, ?, 'admin', ?, ?)
  `).run(adminUser, passwordHash, adminName, adminEmail || null);

  const newUser = db.prepare(
    'SELECT id, username, role, full_name, email, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  const token = createToken({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    full_name: newUser.full_name
  });

  return res.status(201).json({ message: 'Admin account created successfully.', user: newUser, token });
});

// Register user (supports role: 'admin', 'faculty'/'staff', 'student')
authRouter.post('/register', (req, res) => {
  const { username, password, role = 'student', full_name, name, email, student_id } = req.body;
  const displayName = (full_name || name || '').trim();
  const userIdentifier = (username || email?.split('@')[0] || '').trim();

  if (!userIdentifier || !password || !displayName) {
    return res.status(400).json({ message: 'Username, password, and full name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  // Normalize staff/faculty
  let normalizedRole = role.toLowerCase();
  if (normalizedRole === 'staff') normalizedRole = 'faculty';

  const validRoles = ['admin', 'faculty', 'student'];
  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}.` });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)').get(userIdentifier, email || '');
  if (existing) {
    return res.status(409).json({ message: 'A user with that username or email already exists.' });
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email, student_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userIdentifier,
    passwordHash,
    normalizedRole,
    displayName,
    email?.trim() || null,
    student_id?.trim() || null
  );

  const newUser = db.prepare(
    'SELECT id, username, role, full_name, email, student_id, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  const token = createToken({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    full_name: newUser.full_name,
    student_id: newUser.student_id
  });

  return res.status(201).json({ user: newUser, token });
});

// Login (supports either username OR email)
authRouter.post('/login', (req, res) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);
  if (!user) {
    return res.status(401).json({ message: 'Invalid username/email or password.' });
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid username/email or password.' });
  }

  const token = createToken({
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
    student_id: user.student_id
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      student_id: user.student_id,
      created_at: user.created_at
    }
  });
});

// Self-Service Password Reset
authRouter.post('/reset-password', (req, res) => {
  const { identifier, email, username, verification, student_id, full_name, new_password } = req.body;
  const userKey = (identifier || email || username || '').trim();
  const verifyKey = (verification || student_id || full_name || '').trim().toLowerCase();
  const nextPassword = (new_password || '').trim();

  if (!userKey || !verifyKey || !nextPassword) {
    return res.status(400).json({ message: 'Username/email, verification detail, and new password are required.' });
  }

  if (nextPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(userKey, userKey);
  if (!user) {
    return res.status(404).json({ message: 'No account found matching that username or email.' });
  }

  // Verification check: matches registered student_id, full_name, or email
  const matchesStudentId = user.student_id && user.student_id.toLowerCase() === verifyKey;
  const matchesFullName = user.full_name && user.full_name.toLowerCase() === verifyKey;
  const matchesEmail = user.email && user.email.toLowerCase() === verifyKey;

  if (!matchesStudentId && !matchesFullName && !matchesEmail) {
    return res.status(400).json({
      message: 'Verification failed: Student Roll No or Full Name does not match our records for this account.'
    });
  }

  const passwordHash = hashPassword(nextPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);

  return res.json({
    message: 'Your password has been successfully reset! You can now sign in with your new password.'
  });
});

// Current User Profile
authRouter.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, role, full_name, email, student_id, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json(user);
});

// Admin-only user management
authRouter.get('/users', authenticateToken, requireRole('admin'), (_req, res) => {
  const users = db.prepare(
    'SELECT id, username, role, full_name, email, student_id, created_at FROM users ORDER BY id DESC'
  ).all();
  return res.json(users);
});

authRouter.post('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const { username, password, role = 'faculty', full_name, name, email, student_id } = req.body;
  const displayName = (full_name || name || '').trim();
  const userIdentifier = (username || email?.split('@')[0] || '').trim();

  if (!userIdentifier || !password || !displayName) {
    return res.status(400).json({ message: 'Name, email/username, and password are required.' });
  }

  let normalizedRole = role.toLowerCase();
  if (normalizedRole === 'staff') normalizedRole = 'faculty';

  const validRoles = ['admin', 'faculty', 'student'];
  if (!validRoles.includes(normalizedRole)) {
    return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}.` });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)').get(userIdentifier, email || '');
  if (existing) {
    return res.status(409).json({ message: 'A user with that username or email already exists.' });
  }

  const passwordHash = hashPassword(password);
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name, email, student_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userIdentifier,
    passwordHash,
    normalizedRole,
    displayName,
    email?.trim() || null,
    student_id?.trim() || null
  );

  const newUser = db.prepare(
    'SELECT id, username, role, full_name, email, student_id, created_at FROM users WHERE id = ?'
  ).get(result.lastInsertRowid);

  return res.status(201).json(newUser);
});
