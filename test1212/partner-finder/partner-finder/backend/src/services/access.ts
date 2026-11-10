import { pool } from '../db/pool';

// The ONE place that decides if `viewer` may see `target`'s profile.
// Allowed: yourself, a connection, a pending request (either direction),
// or a profile currently recommended to you (and not dismissed).
export async function canViewProfile(viewerId: number, targetId: number): Promise<boolean> {
  if (viewerId === targetId) return true;
  const r = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = $2) AND (
        EXISTS (SELECT 1 FROM connections WHERE user_a = LEAST($1::int, $2::int) AND user_b = GREATEST($1::int, $2::int))
        OR EXISTS (SELECT 1 FROM requests WHERE status = 'pending'
                    AND ((from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)))
        OR (EXISTS (SELECT 1 FROM recommendations_shown WHERE user_id = $1 AND target_id = $2)
            AND NOT EXISTS (SELECT 1 FROM dismissals WHERE user_id = $1 AND dismissed_id = $2))
      ) AS ok`, [viewerId, targetId]);
  return r.rows[0].ok;
}
