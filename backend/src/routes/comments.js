import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { parseId, projectPeople, scope, visibleProjectSql } from '../utils/access.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

const commentSchema = z.object({ body: z.string().trim().min(1, 'Write a comment first').max(1500) });

const COMMENT_SELECT = `
  SELECT c.id, c.task_id AS "taskId", c.user_id AS "userId", c.body, c.created_at AS "createdAt",
         u.name AS "userName", u.role AS "userRole", u.avatar_color AS "avatarColor"
  FROM comments c JOIN users u ON u.id = c.user_id`;

async function visibleTask(user, taskId) {
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.project_id AS "projectId", t.assignee_id AS "assigneeId"
     FROM tasks t JOIN projects p ON p.id = t.project_id
     WHERE t.id = $3 AND ${visibleProjectSql('p')}`,
    [...scope(user), taskId]
  );
  if (!rows[0]) throw new HttpError(404, 'Task not found');
  return rows[0];
}

router.get(
  '/tasks/:taskId/comments',
  asyncHandler(async (req, res) => {
    const taskId = parseId(req.params.taskId, 'task id');
    await visibleTask(req.user, taskId);
    const { rows } = await pool.query(`${COMMENT_SELECT} WHERE c.task_id = $1 ORDER BY c.created_at, c.id`, [taskId]);
    res.json({ comments: rows });
  })
);

router.post(
  '/tasks/:taskId/comments',
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    const taskId = parseId(req.params.taskId, 'task id');
    const task = await visibleTask(req.user, taskId);
    const inserted = await pool.query('INSERT INTO comments (task_id, user_id, body) VALUES ($1, $2, $3) RETURNING id', [
      taskId,
      req.user.id,
      req.body.body
    ]);
    const people = await projectPeople(task.projectId);
    await notify(
      [task.assigneeId, people.ownerId, people.mentorId],
      { type: 'comment', message: `${req.user.name} commented on "${task.title}"`, link: `/projects/${task.projectId}?task=${taskId}` },
      req.user.id
    );
    const { rows } = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [inserted.rows[0].id]);
    res.status(201).json({ comment: rows[0] });
  })
);

router.delete(
  '/comments/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'comment id');
    const { rows } = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (!rows[0]) throw new HttpError(404, 'Comment not found');
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      throw new HttpError(403, 'You can only delete your own comments');
    }
    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.status(204).end();
  })
);

export default router;
