import { Router, Response } from 'express';
import { getDB, saveDB, logAudit, createPassword, verifyPassword } from '../db.ts';
import { User } from '../types.ts';
import { generateToken, requireAuth, requireRole, AuthRequest } from '../auth.ts';

const router = Router();

// Demo Fast Switcher (ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF)
router.post('/demo-login', (req, res: Response) => {
  const { role } = req.body;
  const db = getDB();
  const targetRole = role || 'ADMIN';
  const user = db.users.find(u => u.role === targetRole && u.active);

  if (!user) {
    res.status(404).json({ error: `No active user found with role ${targetRole}` });
    return;
  }

  const token = generateToken(user);
  logAudit(user, 'LOGIN_DEMO', 'USER', user.id, `Logged in via instant demo persona (${user.role})`);

  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Regular Login
router.post('/login', (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !user.active) {
    res.status(401).json({ error: 'Invalid credentials or inactive account' });
    return;
  }

  const valid = verifyPassword(password, user.password_hash, user.salt);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = generateToken(user);
  logAudit(user, 'LOGIN', 'USER', user.id, `User signed in with password`);

  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Sign Up
router.post('/register', (req, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const db = getDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'A user with this email address already exists' });
    return;
  }

  const cred = createPassword(password);
  const assignedRole: User['role'] = (role && ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(role))
    ? role
    : 'WAREHOUSE_STAFF';

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    email: email.toLowerCase().trim(),
    password_hash: cred.hash,
    salt: cred.salt,
    role: assignedRole,
    active: true,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB();

  logAudit(newUser, 'REGISTER', 'USER', newUser.id, `New user registered with role ${newUser.role}`);
  const token = generateToken(newUser);

  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = newUser;
  res.status(201).json({ token, user: safeUser });
});

// Current User Profile
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { name, avatar_url } = req.body;
  const user = req.user!;

  if (name) user.name = name.trim();
  if (avatar_url !== undefined) user.avatar_url = avatar_url;

  saveDB();
  logAudit(user, 'UPDATE_PROFILE', 'USER', user.id, `User updated profile information`);

  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Forgot Password - Generate OTP
router.post('/forgot-password-otp', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Return friendly simulated message for security
    res.json({
      success: true,
      message: 'If the email exists in our system, a 6-digit OTP code has been generated.',
      debug_otp: '123456' // Fallback for testing
    });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.reset_otp = otp;
  user.reset_otp_expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
  saveDB();

  logAudit(user, 'REQUEST_OTP', 'USER', user.id, `Requested OTP password reset`);

  res.json({
    success: true,
    message: 'A 6-digit recovery OTP has been generated.',
    otp // Provide directly in response for immediate hackathon verification
  });
});

// Reset Password with OTP
router.post('/reset-password-otp', (req, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    res.status(400).json({ error: 'Email, OTP code, and new password are required' });
    return;
  }

  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.reset_otp !== otp) {
    res.status(400).json({ error: 'Invalid or expired OTP code' });
    return;
  }

  if (user.reset_otp_expires_at && new Date(user.reset_otp_expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'OTP code has expired' });
    return;
  }

  const cred = createPassword(newPassword);
  user.password_hash = cred.hash;
  user.salt = cred.salt;
  user.reset_otp = undefined;
  user.reset_otp_expires_at = undefined;
  saveDB();

  logAudit(user, 'RESET_PASSWORD', 'USER', user.id, `Password was successfully reset using OTP`);
  res.json({ success: true, message: 'Password has been successfully updated. You can now login.' });
});

// Manage Users (ADMIN only)
router.get('/users', requireAuth, requireRole(['ADMIN']), (_req, res: Response) => {
  const db = getDB();
  const safeUsers = db.users.map(({ password_hash, salt, reset_otp, reset_otp_expires_at, ...u }) => u);
  res.json(safeUsers);
});

router.post('/users', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const db = getDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'User email already exists' });
    return;
  }

  const cred = createPassword(password);
  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    email: email.toLowerCase().trim(),
    password_hash: cred.hash,
    salt: cred.salt,
    role,
    active: true,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB();

  logAudit(req.user!, 'CREATE_USER', 'USER', newUser.id, `Created user ${newUser.email} with role ${newUser.role}`);
  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

router.put('/users/:id/toggle', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot deactivate your own active admin account' });
    return;
  }

  user.active = !user.active;
  saveDB();

  logAudit(req.user!, 'TOGGLE_USER_STATUS', 'USER', user.id, `Changed active state to ${user.active}`);
  const { password_hash, salt, reset_otp, reset_otp_expires_at, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
