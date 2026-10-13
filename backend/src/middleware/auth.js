import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { HttpError, asyncHandler } from './errors.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Sign in to continue');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session expired. Sign in again.');
  }

  const { rows } = await pool.query(
    `SELECT id, name, email, role, bio, avatar_color AS "avatarColor", created_at AS "createdAt"
     FROM users WHERE id = $1`,
    [payload.sub]
  );
  if (!rows[0]) throw new HttpError(401, 'This account no longer exists');
  req.user = rows[0];
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, 'You do not have permission to do that'));
