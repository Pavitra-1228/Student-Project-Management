import { Router } from 'express';
import { z } from 'zod';
import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getProjectAccess, parseId, projectPeople, scope, visibleProjectSql } from '../utils/access.js';
import { buildUpdate } from '../utils/sql.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD').nullable();

const createSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(2, 'Give the task a title').max(160),
  description: z.string().trim().max(3000).default(''),
  status: z.enum(STATUSES).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assigneeId: z.number().int().positive().nullable().default(null),
  dueDate: dateField.default(null)
});

const updateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(3000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
  dueDate: dateField.optional()
});

const moveSchema = z.object({
  status: z.enum(STATUSES),
  index: z.number().int().min(0).default(0)
});

const TASK_SELECT = `
  SELECT t.id, t.project_id AS "projectId", p.title AS "projectTitle", t.title, t.description, t.status, t.priority,
         t.assignee_id AS "assigneeId", a.name AS "assigneeName", a.avatar_color AS "assigneeColor",
         t.created_by AS "createdBy", t.due_date AS "dueDate", t.position,
         t.created_at AS "createdAt", t.updated_at AS "updatedAt",
         (SELECT COUNT(*)::int FROM comments c WHERE c.task_id = t.id) AS "commentCount"
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  LEFT JOIN users a ON a.id = t.assignee_id`;

export async function fetchTasks(user, filters = {}) {
  const params = [...scope(user)];
  const where = [visibleProjectSql('p')];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };
  if (filters.id) add('t.id = ?', filters.id);
  if (filters.projectId) add('t.project_id = ?', filters.projectId);
  if (filters.status) add('t.status = ?', filters.status);
  if (filters.priority) add('t.priority = ?', filters.priority);
  if (filters.assignee === 'me') add('t.assignee_id = ?', user.id);
  else if (filters.assignee === 'none') where.push('t.assignee_id IS NULL');
  else if (filters.assignee) add('t.assignee_id = ?', Number(filters.assignee));
  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }
  const { rows } = await pool.query(
    `${TASK_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY p.id, CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'review' THEN 2 ELSE 3 END, t.position, t.id`,
    params
  );
  return rows;
}

async function loadTask(user, id) {
  const [task] = await fetchTasks(user, { id });
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

async function assertAssignable(projectId, assigneeId) {
  if (!assigneeId) return;
  const people = await projectPeople(projectId);
  const allowed = [people.ownerId, people.mentorId, ...people.memberIds];
  if (!allowed.includes(assigneeId)) {
    throw new HttpError(400, 'Assign tasks to people who are part of this project');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = req.query;
    const tasks = await fetchTasks(req.user, {
      projectId: q.projectId ? parseId(q.projectId, 'project id') : undefined,
      status: q.status ? String(q.status) : undefined,
      priority: q.priority ? String(q.priority) : undefined,
      assignee: q.assignee ? String(q.assignee) : undefined,
      search: q.search ? String(q.search) : undefined
    });
    res.json({ tasks });
  })
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { projectId, title, description, status, priority, assigneeId, dueDate } = req.body;
    await getProjectAccess(req.user, projectId);
    await assertAssignable(projectId, assigneeId);

    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, created_by, position)
       VALUES ($1, $2, $3, $4::varchar, $5, $6, $7, $8,
         COALESCE((SELECT MAX(position) + 1 FROM tasks WHERE project_id = $1 AND status = $4::varchar), 0))
       RETURNING id`,
      [projectId, title, description, status, priority, assigneeId, dueDate, req.user.id]
    );
    await notify(
      [assigneeId],
      { type: 'assignment', message: `${req.user.name} assigned you "${title}"`, link: `/projects/${projectId}?task=${rows[0].id}` },
      req.user.id
    );
    res.status(201).json({ task: await loadTask(req.user, rows[0].id) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json({ task: await loadTask(req.user, parseId(req.params.id, 'task id')) });
  })
);

router.put(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'task id');
    const task = await loadTask(req.user, id);
    const changes = req.body;
    if (changes.assigneeId !== undefined) await assertAssignable(task.projectId, changes.assigneeId);

    const { sets, values } = buildUpdate(changes, {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      assigneeId: 'assignee_id',
      dueDate: 'due_date'
    });
    if (!sets.length) throw new HttpError(400, 'Nothing to update');

    const statusChanged = changes.status !== undefined && changes.status !== task.status;
    if (statusChanged) {
      values.push(task.projectId, changes.status);
      sets.push(
        `position = COALESCE((SELECT MAX(position) + 1 FROM tasks WHERE project_id = $${values.length - 1} AND status = $${values.length}), 0)`
      );
    }
    sets.push('updated_at = NOW()');
    values.push(id);
    await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${values.length}`, values);

    const link = `/projects/${task.projectId}?task=${id}`;
    if (changes.assigneeId && changes.assigneeId !== task.assigneeId) {
      await notify([changes.assigneeId], { type: 'assignment', message: `${req.user.name} assigned you "${task.title}"`, link }, req.user.id);
    }
    if (statusChanged && changes.status === 'done') {
      const people = await projectPeople(task.projectId);
      await notify(
        [people.ownerId, people.mentorId, task.assigneeId],
        { type: 'status', message: `${req.user.name} marked "${task.title}" as done`, link },
        req.user.id
      );
    }
    res.json({ task: await loadTask(req.user, id) });
  })
);

router.patch(
  '/:id/move',
  validate(moveSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'task id');
    const task = await loadTask(req.user, id);
    const { status, index } = req.body;

    await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id FROM tasks WHERE project_id = $1 AND status = $2 AND id <> $3 ORDER BY position, id`,
        [task.projectId, status, id]
      );
      const ids = rows.map((row) => row.id);
      ids.splice(Math.min(index, ids.length), 0, id);
      await client.query('UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
      await client.query(
        `UPDATE tasks t SET position = v.pos - 1
         FROM unnest($1::int[]) WITH ORDINALITY AS v(id, pos) WHERE t.id = v.id`,
        [ids]
      );
    });

    if (status === 'done' && task.status !== 'done') {
      const people = await projectPeople(task.projectId);
      await notify(
        [people.ownerId, people.mentorId, task.assigneeId],
        { type: 'status', message: `${req.user.name} marked "${task.title}" as done`, link: `/projects/${task.projectId}?task=${id}` },
        req.user.id
      );
    }
    res.json({ task: await loadTask(req.user, id) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'task id');
    const task = await loadTask(req.user, id);
    const access = await getProjectAccess(req.user, task.projectId);
    if (!access.canManage && task.createdBy !== req.user.id) {
      throw new HttpError(403, 'Only the task creator, project owner or mentor can delete this task');
    }
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).end();
  })
);

export default router;
