import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import pool from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { parseId } from '../utils/access.js';
import { buildUpdate } from '../utils/sql.js';

const router = Router();
router.use(authenticate);

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(100).optional(),
  bio: z.string().trim().max(400, 'Keep your bio under 400 characters').optional(),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex color').optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Use at least 8 characters').max(72)
});

const roleSchema = z.object({ role: z.enum(['student', 'mentor', 'admin']) });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = [];
    const where = [];
    if (req.query.role) {
      params.push(String(req.query.role));
      where.push(`role = $${params.length}`);
    }
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    const { rows } = await pool.query(
      `SELECT id, name, email, role, bio, avatar_color AS "avatarColor", created_at AS "createdAt"
       FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name`,
      params
    );
    res.json({ users: rows });
  })
);

router.patch(
  '/me',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { sets, values } = buildUpdate(req.body, { name: 'name', bio: 'bio', avatarColor: 'avatar_color' });
    if (!sets.length) throw new HttpError(400, 'Nothing to update');
    values.push(req.user.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, email, role, bio, avatar_color AS "avatarColor", created_at AS "createdAt"`,
      values
    );
    res.json({ user: rows[0] });
  })
);

router.patch(
  '/me/password',
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const matches = await bcrypt.compare(req.body.currentPassword, rows[0].password_hash);
    if (!matches) throw new HttpError(400, 'Your current password is incorrect');
    const hash = await bcrypt.hash(req.body.newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  })
);

router.patch(
  '/:id/role',
  requireRole('admin'),
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'user id');
    if (id === req.user.id) throw new HttpError(400, 'You cannot change your own role');
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role, bio, avatar_color AS "avatarColor", created_at AS "createdAt"`,
      [req.body.role, id]
    );
    if (!rows[0]) throw new HttpError(404, 'User not found');
    res.json({ user: rows[0] });
  })
);

router.delete(
  '/:id',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'user id');
    if (id === req.user.id) throw new HttpError(400, 'You cannot delete your own account');
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (!result.rowCount) throw new HttpError(404, 'User not found');
    res.status(204).end();
  })
);

export default router;
