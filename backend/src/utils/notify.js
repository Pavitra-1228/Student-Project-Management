import pool from '../config/db.js';

export async function notify(userIds, { type, message, link }, actorId, db = pool) {
  const targets = [...new Set(userIds.filter((id) => id && id !== actorId))];
  if (!targets.length) return;
  await db.query(
    `INSERT INTO notifications (user_id, type, message, link)
     SELECT unnest($1::int[]), $2, $3, $4`,
    [targets, type, message, link || null]
  );
}
