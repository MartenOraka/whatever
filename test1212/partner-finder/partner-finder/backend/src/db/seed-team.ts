// Creates or updates the REAL team / demo profiles from  backend/data/team-profiles.json
// Safe to run again and again (matches people by e-mail). Run it again after every  npm run db:reset.
//   npm run db:seed:team
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { copyFileSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { z } from 'zod';
import { AVATAR_DIR, BANNER_DIR } from '../routes/avatar';
import { canonicalizeGames } from '../services/gameCatalog';
import { recomputeCompleted } from '../services/shapes';
import { pool } from './pool';

const DATA = join(__dirname, '../../data');
const CITIES: Record<string, [number, number]> = {
  tallinn: [59.437, 24.7536], tartu: [58.378, 26.729], 'pärnu': [58.385, 24.4971], narva: [59.377, 28.1903], helsinki: [60.1699, 24.9384],
  riga: [56.9496, 24.1052], stockholm: [59.3293, 18.0686], berlin: [52.52, 13.405], london: [51.5072, -0.1276], 'new york': [40.7128, -74.006],
};

const list = z.array(z.string()).default([]);
const entry = z.object({
  email: z.string().email(), password: z.string().min(8).optional(),
  nickname: z.string().min(2).max(30), username: z.string().regex(/^[a-z0-9_.]{3,20}$/).optional(),
  bio: z.string().max(500).default(''), links: z.array(z.string().url()).default([]),
  city: z.string().optional(), lat: z.number().optional(), lng: z.number().optional(), radius_km: z.number().int().min(1).max(20000).default(300),
  crew_roles: z.array(z.enum(['ideator', 'gamer', 'developer', 'artist'])).default([]),
  avatar: z.string().optional(), banner: z.string().optional(),
  gaming: z.object({
    games: z.array(z.object({ name: z.string(), playtime_hours: z.number().optional(), rank: z.string().optional(), extra: z.record(z.union([z.string(), z.number()])).optional() })).default([]),
    platforms: list, modes: list, goals: list, availability: list, tags: list, steam_url: z.string().nullable().optional(),
  }).default({}),
  creative: z.object({ skills: list, interests: list, tools: list, roles: list, goals: list, tags: list, experience: z.string().nullable().optional() }).default({}),
});
const fileSchema = z.object({ defaultPassword: z.string().min(8).default('qrew-demo-123'), profiles: z.array(entry) });

// copy a picture from data/team-images into uploads/ under a random name, remove the previous one
async function setImage(id: number, fileName: string | undefined, kind: 'avatar' | 'banner') {
  if (!fileName) return;
  const src = join(DATA, 'team-images', fileName);
  if (!existsSync(src)) { console.warn(`  ! ${kind} file not found: data/team-images/${fileName} (skipped)`); return; }
  const dir = kind === 'avatar' ? AVATAR_DIR : BANNER_DIR, col = kind === 'avatar' ? 'avatar_url' : 'banner_url';
  const prefix = kind === 'avatar' ? '/uploads/avatars/' : '/uploads/banners/';
  const name = `${id}-${randomBytes(8).toString('hex')}${extname(fileName).toLowerCase()}`;
  copyFileSync(src, join(dir, name));
  const old = (await pool.query(`SELECT ${col} AS url FROM profiles WHERE user_id = $1`, [id])).rows[0]?.url as string | null;
  await pool.query(`UPDATE profiles SET ${col} = $2 WHERE user_id = $1`, [id, prefix + name]);
  if (old?.startsWith(prefix)) { try { unlinkSync(join(dir, old.split('/').pop()!)); } catch { /* gone */ } }
}

async function main() {
  const path = process.env.TEAM_FILE ?? join(DATA, 'team-profiles.json');
  if (!existsSync(path)) {
    console.error(`Cannot find ${path}\nCreate it first:  cp data/team-profiles.example.json data/team-profiles.json   (then edit it)`);
    process.exit(1);
  }
  const parsed = fileSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')));
  if (!parsed.success) {
    console.error('team-profiles.json has a problem:'); parsed.error.issues.forEach((i) => console.error(`  - ${i.path.join(' > ')}: ${i.message}`)); process.exit(1);
  }
  const { defaultPassword, profiles } = parsed.data;

  for (const p of profiles) {
    const email = p.email.toLowerCase();
    let id: number | undefined = (await pool.query('SELECT id FROM users WHERE email = $1', [email])).rows[0]?.id;
    const created = !id;
    if (!id) {
      id = (await pool.query('INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id', [email, await bcrypt.hash(p.password ?? defaultPassword, 10)])).rows[0].id as number;
      await pool.query('INSERT INTO profiles (user_id, nickname) VALUES ($1,$2)', [id, p.nickname]);
      await pool.query('INSERT INTO gaming_profiles (user_id) VALUES ($1)', [id]);
      await pool.query('INSERT INTO creative_profiles (user_id) VALUES ($1)', [id]);
    } else if (p.password) {
      await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, await bcrypt.hash(p.password, 10)]);
    }
    const coords = p.lat != null && p.lng != null ? [p.lat, p.lng] : CITIES[(p.city ?? '').toLowerCase()];
    if (!coords) { console.warn(`  ! ${p.nickname}: unknown city "${p.city}" and no lat/lng. Known cities: ${Object.keys(CITIES).join(', ')}`); }
    try {
      await pool.query(
        `UPDATE profiles SET nickname=$2, username=$3, bio=$4, links=$5, city=$6, lat=$7, lng=$8, radius_km=$9, crew_roles=$10 WHERE user_id=$1`,
        [id, p.nickname, p.username ?? null, p.bio, p.links, p.city ?? null, coords?.[0] ?? null, coords?.[1] ?? null, p.radius_km, p.crew_roles]);
    } catch (e: any) {
      if (e.code === '23505') { console.error(`  x ${p.nickname}: the username "${p.username}" is already used by someone else`); continue; }
      throw e;
    }
    const g = p.gaming, c = p.creative;
    await pool.query('UPDATE gaming_profiles SET games=$2, platforms=$3, modes=$4, goals=$5, availability=$6, tags=$7, steam_url=$8 WHERE user_id=$1',
      [id, JSON.stringify(canonicalizeGames(g.games)), g.platforms, g.modes, g.goals, g.availability, g.tags, g.steam_url ?? null]);
    await pool.query('UPDATE creative_profiles SET skills=$2, interests=$3, tools=$4, experience=$5, roles=$6, goals=$7, tags=$8 WHERE user_id=$1',
      [id, c.skills, c.interests, c.tools, c.experience ?? null, c.roles, c.goals, c.tags]);
    await setImage(id, p.avatar, 'avatar'); await setImage(id, p.banner, 'banner');
    await recomputeCompleted(id);
    const done = (await pool.query('SELECT completed FROM profiles WHERE user_id = $1', [id])).rows[0].completed;
    console.log(`${created ? '+ created' : '~ updated'}  ${p.nickname}  (${email})  profile ${done ? 'complete' : 'INCOMPLETE - needs bio, a known city and a game or a skill'}`);
  }
  console.log(`\nDone. Log in with the e-mail above and the password from team-profiles.json (default: ${defaultPassword}).`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
