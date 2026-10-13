import { Router } from 'express';
import pool from '../config/db.js';
import { asyncHandler } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';
import { scope, visibleProjectSql } from '../utils/access.js';

const router = Router();
router.use(authenticate);

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const base = scope(req.user);
    const visible = visibleProjectSql('p');

    const [taskStats, projectStats, weekly, upcoming, roles] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE t.status = 'todo')::int AS todo,
                COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
                COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
                COUNT(*) FILTER (WHERE t.status = 'done')::int AS done,
                COUNT(*) FILTER (WHERE t.priority = 'low' AND t.status <> 'done')::int AS low,
                COUNT(*) FILTER (WHERE t.priority = 'medium' AND t.status <> 'done')::int AS medium,
                COUNT(*) FILTER (WHERE t.priority = 'high' AND t.status <> 'done')::int AS high,
                COUNT(*) FILTER (WHERE t.status <> 'done' AND t.due_date < CURRENT_DATE)::int AS overdue,
                COUNT(*) FILTER (WHERE t.status <> 'done' AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7)::int AS due_soon,
                COUNT(*) FILTER (WHERE t.status <> 'done' AND t.assignee_id = $3)::int AS my_open
         FROM tasks t JOIN projects p ON p.id = t.project_id WHERE ${visible}`,
        [...base, req.user.id]
      ),
      pool.query(
        `SELECT p.id, p.title, p.status, COUNT(t.id)::int AS total,
                COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done
         FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
         WHERE ${visible} GROUP BY p.id ORDER BY p.created_at DESC`,
        base
      ),
      pool.query(
        `SELECT to_char(d::date, 'YYYY-MM-DD') AS date,
                (SELECT COUNT(*)::int FROM tasks t JOIN projects p ON p.id = t.project_id
                  WHERE ${visible} AND t.created_at::date = d::date) AS created,
                (SELECT COUNT(*)::int FROM tasks t JOIN projects p ON p.id = t.project_id
                  WHERE ${visible} AND t.status = 'done' AND t.updated_at::date = d::date) AS completed
         FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, interval '1 day') d ORDER BY d`,
        base
      ),
      pool.query(
        `SELECT t.id, t.title, t.status, t.priority, t.due_date AS "dueDate", t.project_id AS "projectId",
                p.title AS "projectTitle", a.name AS "assigneeName"
         FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users a ON a.id = t.assignee_id
         WHERE ${visible} AND t.status <> 'done' AND t.due_date IS NOT NULL
         ORDER BY t.due_date, t.id LIMIT 6`,
        base
      ),
      req.user.role === 'admin'
        ? pool.query(`SELECT role, COUNT(*)::int AS count FROM users GROUP BY role`)
        : Promise.resolve({ rows: [] })
    ]);

    const stats = taskStats.rows[0];
    const projectProgress = projectStats.rows.map((row) => ({
      ...row,
      progress: row.total ? Math.round((row.done / row.total) * 100) : 0
    }));

    res.json({
      totals: {
        projects: projectProgress.length,
        activeProjects: projectProgress.filter((project) => project.status === 'active').length,
        tasks: stats.total,
        done: stats.done,
        open: stats.total - stats.done,
        overdue: stats.overdue,
        dueSoon: stats.due_soon,
        myOpen: stats.my_open,
        completionRate: stats.total ? Math.round((stats.done / stats.total) * 100) : 0
      },
      statusCounts: { todo: stats.todo, in_progress: stats.in_progress, review: stats.review, done: stats.done },
      priorityCounts: { low: stats.low, medium: stats.medium, high: stats.high },
      projectProgress,
      weekly: weekly.rows,
      upcoming: upcoming.rows,
      usersByRole: roles.rows.reduce((acc, row) => ({ ...acc, [row.role]: row.count }), {})
    });
  })
);

export default router;
