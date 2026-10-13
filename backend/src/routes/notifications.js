import { Router } from 'express';
import pool from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';
import { parseId } from '../utils/access.js';

const router = Router();
router.use(authenticate);

const COLUMNS = `id, type, message, link, is_read AS "read", created_at AS "createdAt"`;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ notifications: rows, unread: rows.filter((row) => !row.read).length });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'notification id');
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING ${COLUMNS}`,
      [id, req.user.id]
    );
    if (!rows[0]) throw new HttpError(404, 'Notification not found');
    res.json({ notification: rows[0] });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'notification id');
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.status(204).end();
  })
);

export default router;
