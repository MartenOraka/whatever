import { pool } from './pool';

// Safe, repeatable upgrades that run every time the server starts.
// Existing databases get new columns automatically, so nobody has to reset anything.
export async function ensureSchema() {
  await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT');
  await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT');
  await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crew_roles TEXT[] NOT NULL DEFAULT '{}'");
  await pool.query("ALTER TABLE gaming_profiles ADD COLUMN IF NOT EXISTS platforms TEXT[] NOT NULL DEFAULT '{}'");
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles (lower(username)) WHERE username IS NOT NULL');
  await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS match_prefs JSONB NOT NULL DEFAULT '{}'");
}
