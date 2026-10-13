import pool from '../config/db.js';
import { HttpError } from '../middleware/errors.js';

export const visibleProjectSql = (alias = 'p') =>
  `($1::boolean OR ${alias}.owner_id = $2 OR ${alias}.mentor_id = $2 OR EXISTS (
    SELECT 1 FROM project_members vm WHERE vm.project_id = ${alias}.id AND vm.user_id = $2
  ))`;

export const scope = (user) => [user.role === 'admin', user.id];

export function parseId(value, label = 'id') {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `Invalid ${label}`);
  return id;
}

export async function getProjectAccess(user, projectId, db = pool) {
  const { rows } = await db.query(
    `SELECT p.id, p.title, p.owner_id AS "ownerId", p.mentor_id AS "mentorId"
     FROM projects p WHERE p.id = $3 AND ${visibleProjectSql('p')}`,
    [...scope(user), projectId]
  );
  const project = rows[0];
  if (!project) throw new HttpError(404, 'Project not found');
  const isAdmin = user.role === 'admin';
  const isOwner = project.ownerId === user.id;
  const isMentor = project.mentorId === user.id;
  return { project, canManage: isAdmin || isOwner || isMentor, canDelete: isAdmin || isOwner };
}

export async function projectPeople(projectId, db = pool) {
  const { rows } = await db.query(
    `SELECT owner_id AS "ownerId", mentor_id AS "mentorId",
            COALESCE((SELECT array_agg(user_id) FROM project_members WHERE project_id = $1), '{}') AS "memberIds"
     FROM projects WHERE id = $1`,
    [projectId]
  );
  return rows[0];
}
