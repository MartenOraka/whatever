import { pool } from '../db/pool';

// /users/{id}  ->  id, name, picture
export async function getUser(id: number) {
  const r = await pool.query(
    'SELECT user_id AS id, nickname AS name, avatar_url FROM profiles WHERE user_id = $1', [id]);
  return r.rows[0] ?? null;
}

// /users/{id}/profile  ->  "about me"
export async function getProfile(id: number) {
  const r = await pool.query('SELECT user_id AS id, bio, links, banner_url, username, crew_roles FROM profiles WHERE user_id = $1', [id]);
  return r.rows[0] ?? null;
}

// /users/{id}/bio  ->  data that powers recommendations.
// Exact coordinates are only returned to the owner; others get the city only.
export async function getBio(id: number, isSelf: boolean) {
  const r = await pool.query(
    `SELECT p.user_id AS id, p.city, p.lat, p.lng, p.radius_km, p.match_prefs,
            to_jsonb(g) - 'user_id' AS gaming, to_jsonb(c) - 'user_id' AS creative
       FROM profiles p
       LEFT JOIN gaming_profiles g ON g.user_id = p.user_id
       LEFT JOIN creative_profiles c ON c.user_id = p.user_id
      WHERE p.user_id = $1`, [id]);
  const row = r.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    location: isSelf
      ? { city: row.city, lat: row.lat, lng: row.lng, radius_km: row.radius_km }
      : { city: row.city },
    gaming: row.gaming,
    creative: row.creative,
    ...(isSelf ? { preferences: row.match_prefs } : {}),   // priorities are private to the owner
  };
}

// A profile is "complete" when the basics, a location and at least one section have content.
export async function recomputeCompleted(userId: number) {
  await pool.query(
    `UPDATE profiles p SET completed = (
        length(trim(p.nickname)) > 0 AND length(trim(p.bio)) > 0 AND p.lat IS NOT NULL AND p.lng IS NOT NULL
        AND (
          EXISTS (SELECT 1 FROM gaming_profiles g WHERE g.user_id = p.user_id AND jsonb_array_length(g.games) > 0)
          OR EXISTS (SELECT 1 FROM creative_profiles c WHERE c.user_id = p.user_id AND cardinality(c.skills) > 0)
        ))
      WHERE p.user_id = $1`, [userId]);
}
