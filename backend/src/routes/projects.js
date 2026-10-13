import { Router } from 'express';
import { z } from 'zod';
import pool, { withTransaction } from '../config/db.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getProjectAccess, parseId, scope, visibleProjectSql } from '../utils/access.js';
import { buildUpdate } from '../utils/sql.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(authenticate);

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .nullable();

const createSchema = z.object({
  title: z.string().trim().min(3, 'Give the project a title of at least 3 characters').max(140),
  description: z.string().trim().max(2000).default(''),
  status: z.enum(['planning', 'active', 'on_hold', 'completed']).default('planning'),
  dueDate: dateField.optional().default(null),
  mentorId: z.number().int().positive().nullable().optional(),
  memberIds: z.array(z.number().int().positive()).max(30).default([])
});

const updateSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed']).optional(),
  dueDate: dateField.optional(),
  mentorId: z.number().int().positive().nullable().optional()
});

const memberSchema = z.object({ userId: z.number().int().positive() });

const PROJECT_SELECT = `
  SELECT p.id, p.title, p.description, p.status, p.due_date AS "dueDate", p.created_at AS "createdAt",
         p.owner_id AS "ownerId", o.name AS "ownerName", p.mentor_id AS "mentorId", m.name AS "mentorName",
         tc.total, tc.todo, tc.in_progress, tc.review, tc.done,
         (SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name, 'role', u.role, 'avatarColor', u.avatar_color) ORDER BY u.name), '[]'::json)
            FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = p.id) AS members
  FROM projects p
  JOIN users o ON o.id = p.owner_id
  LEFT JOIN users m ON m.id = p.mentor_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE t.status = 'todo')::int AS todo,
           COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
           COUNT(*) FILTER (WHERE t.status = 'review')::int AS review,
           COUNT(*) FILTER (WHERE t.status = 'done')::int AS done
    FROM tasks t WHERE t.project_id = p.id
  ) tc ON TRUE`;

function mapProject({ total, todo, in_progress, review, done, ...project }) {
  return {
    ...project,
    taskCounts: { total, todo, in_progress, review, done },
    progress: total ? Math.round((done / total) * 100) : 0
  };
}

async function fetchProjects(user, { id, search, status } = {}) {
  const params = [...scope(user)];
  const where = [visibleProjectSql('p')];
  if (id) {
    params.push(id);
    where.push(`p.id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    where.push(`p.status = $${params.length}`);
  }
  const { rows } = await pool.query(`${PROJECT_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC`, params);
  return rows.map(mapProject);
}

async function assertMentor(mentorId) {
  if (!mentorId) return;
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [mentorId]);
  if (!rows[0] || !['mentor', 'admin'].includes(rows[0].role)) {
    throw new HttpError(400, 'The selected mentor must have a mentor account');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await fetchProjects(req.user, {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined
    });
    res.json({ projects });
  })
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { title, description, status, dueDate, memberIds } = req.body;
    let { mentorId } = req.body;
    if (req.user.role !== 'student' && mentorId === undefined) mentorId = req.user.id;
    mentorId = mentorId ?? null;
    await assertMentor(mentorId);

    const id = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO projects (title, description, status, due_date, owner_id, mentor_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [title, description, status, dueDate, req.user.id, mentorId]
      );
      const projectId = rows[0].id;
      const members = [...new Set([req.user.id, ...memberIds])];
      await client.query(
        `INSERT INTO project_members (project_id, user_id)
         SELECT $1, u.id FROM users u WHERE u.id = ANY($2::int[]) ON CONFLICT DO NOTHING`,
        [projectId, members]
      );
      await notify(
        [mentorId, ...memberIds],
        { type: 'project', message: `${req.user.name} added you to "${title}"`, link: `/projects/${projectId}` },
        req.user.id,
        client
      );
      return projectId;
    });

    const [project] = await fetchProjects(req.user, { id });
    res.status(201).json({ project });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [project] = await fetchProjects(req.user, { id: parseId(req.params.id, 'project id') });
    if (!project) throw new HttpError(404, 'Project not found');
    res.json({ project });
  })
);

router.put(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'project id');
    const access = await getProjectAccess(req.user, id);
    if (!access.canManage) throw new HttpError(403, 'Only the project owner or mentor can edit this project');
    if (req.body.mentorId !== undefined) await assertMentor(req.body.mentorId);

    const { sets, values } = buildUpdate(req.body, {
      title: 'title',
      description: 'description',
      status: 'status',
      dueDate: 'due_date',
      mentorId: 'mentor_id'
    });
    if (!sets.length) throw new HttpError(400, 'Nothing to update');
    values.push(id);
    await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = $${values.length}`, values);

    if (req.body.mentorId && req.body.mentorId !== access.project.mentorId) {
      await notify(
        [req.body.mentorId],
        { type: 'project', message: `You are now mentoring "${access.project.title}"`, link: `/projects/${id}` },
        req.user.id
      );
    }
    const [project] = await fetchProjects(req.user, { id });
    res.json({ project });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'project id');
    const access = await getProjectAccess(req.user, id);
    if (!access.canDelete) throw new HttpError(403, 'Only the project owner can delete this project');
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.status(204).end();
  })
);

router.post(
  '/:id/members',
  validate(memberSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'project id');
    const access = await getProjectAccess(req.user, id);
    if (!access.canManage) throw new HttpError(403, 'Only the project owner or mentor can manage the team');
    const target = await pool.query('SELECT id, role FROM users WHERE id = $1', [req.body.userId]);
    if (!target.rows[0]) throw new HttpError(404, 'User not found');
    await pool.query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      id,
      req.body.userId
    ]);
    await notify(
      [req.body.userId],
      { type: 'project', message: `${req.user.name} added you to "${access.project.title}"`, link: `/projects/${id}` },
      req.user.id
    );
    const [project] = await fetchProjects(req.user, { id });
    res.status(201).json({ project });
  })
);

router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'project id');
    const userId = parseId(req.params.userId, 'user id');
    const access = await getProjectAccess(req.user, id);
    if (!access.canManage) throw new HttpError(403, 'Only the project owner or mentor can manage the team');
    if (userId === access.project.ownerId) throw new HttpError(400, 'The project owner cannot be removed');
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userId]);
    await pool.query('UPDATE tasks SET assignee_id = NULL WHERE project_id = $1 AND assignee_id = $2', [id, userId]);
    const [project] = await fetchProjects(req.user, { id });
    res.json({ project });
  })
);

export default router;
