import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const AVATAR_COLORS = ['#0E7C7B', '#EF6351', '#2F80ED', '#8B5CF6', '#D97706', '#DB2777', '#16A37F', '#475569'];

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  password: z.string().min(8, 'Use at least 8 characters').max(72),
  role: z.enum(['student', 'mentor']).default('student')
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
});

const USER_COLUMNS = `id, name, email, role, bio, avatar_color AS "avatarColor", created_at AS "createdAt"`;

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount) throw new HttpError(409, 'An account with this email already exists');

    const hash = await bcrypt.hash(password, 10);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${USER_COLUMNS}`,
      [name, email, hash, role, color]
    );
    res.status(201).json({ token: signToken(rows[0]), user: rows[0] });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`, [email]);
    const record = rows[0];
    const valid = record && (await bcrypt.compare(password, record.password_hash));
    if (!valid) throw new HttpError(401, 'Email or password is incorrect');
    const { password_hash: _omit, ...user } = record;
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

export default router;
