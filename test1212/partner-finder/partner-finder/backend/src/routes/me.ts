import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { isAdminUser } from '../middleware/admin';
import { canonicalizeGames } from '../services/gameCatalog';
import { getBio, getProfile, getUser, recomputeCompleted } from '../services/shapes';

const router = Router();
router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  const user = await getUser(req.userId!);
  const done = await pool.query('SELECT completed FROM profiles WHERE user_id = $1', [req.userId]);
  res.json({ ...user, profile_completed: done.rows[0]?.completed ?? false, is_admin: await isAdminUser(req.userId!) });
}));
router.get('/profile', wrap(async (req, res) => res.json(await getProfile(req.userId!))));
router.get('/bio', wrap(async (req, res) => res.json(await getBio(req.userId!, true))));

const list = z.array(z.string().trim().min(1).max(40)).max(20);
const url = z.string().trim().url().max(200).refine((u) => /^https?:\/\//i.test(u), 'Link must start with http:// or https://');

export const usernameSchema = z.preprocess((v) => (v === '' ? null : v),
  z.string().trim().toLowerCase().regex(/^[a-z0-9_.]{3,20}$/, 'Username: 3-20 characters, only letters, numbers, _ and .').nullable());
export const CREW_ROLE_KEYS = ['ideator', 'gamer', 'developer', 'artist'] as const;

const profileSchema = z.object({
  nickname: z.string().trim().min(2).max(30),          // display name
  bio: z.string().trim().max(500),
  links: z.array(url).max(5),
  username: usernameSchema.optional(),                 // omitted = unchanged, "" = remove
  crew_roles: z.array(z.enum(CREW_ROLE_KEYS)).max(4).optional(),
});

router.put('/profile', wrap(async (req, res) => {
  const d = profileSchema.parse(req.body);
  try {
    await pool.query(
      `UPDATE profiles SET nickname=$2, bio=$3, links=$4,
         username = CASE WHEN $5::boolean THEN $6 ELSE username END,
         crew_roles = CASE WHEN $7::boolean THEN $8::text[] ELSE crew_roles END
       WHERE user_id=$1`,
      [req.userId, d.nickname, d.bio, d.links, d.username !== undefined, d.username ?? null, d.crew_roles !== undefined, [...new Set(d.crew_roles ?? [])]]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'That username is already taken' });
    throw e;
  }
  await recomputeCompleted(req.userId!);
  res.json(await getProfile(req.userId!));
}));

const gameSchema = z.object({
  name: z.string().trim().min(1).max(60),
  playtime_hours: z.number().int().min(0).max(100000).optional(),
  rank: z.string().trim().max(40).optional(),
  extra: z.record(z.union([z.string().max(60), z.number()])).optional(), // game-specific, e.g. faceit_level
});

const bioSchema = z.object({
  location: z.object({
    city: z.string().trim().max(60).optional(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radius_km: z.number().int().min(1).max(20000),
  }).optional(),
  gaming: z.object({
    games: z.array(gameSchema).max(15),
    platforms: list.optional(),
    modes: list, goals: list, availability: list, tags: list,
    steam_url: url.nullable().optional(),
  }).optional(),
  creative: z.object({
    skills: list, interests: list, tools: list, roles: list, goals: list, tags: list,
    experience: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).nullable().optional(),
  }).optional(),
  preferences: z.lazy(() => prefsSchema).optional(),
});

const level = z.enum(['low', 'normal', 'high']);
const prefsSchema = z.object({
  gaming: z.record(z.enum(['games', 'rank', 'playtime', 'modes', 'availability', 'goals']), level).optional(),
  creative: z.record(z.enum(['interests', 'tools', 'roles', 'goals', 'skills', 'experience']), level).optional(),
});

router.put('/bio', wrap(async (req, res) => {
  const d = bioSchema.parse(req.body);
  const id = req.userId!;
  if (d.location) {
    await pool.query('UPDATE profiles SET city=$2, lat=$3, lng=$4, radius_km=$5 WHERE user_id=$1',
      [id, d.location.city ?? null, d.location.lat, d.location.lng, d.location.radius_km]);
  }
  if (d.gaming) {
    const g = d.gaming;
    await pool.query(
      `UPDATE gaming_profiles SET games=$2, modes=$3, goals=$4, availability=$5, tags=$6, steam_url=$7 WHERE user_id=$1`,
      [id, JSON.stringify(canonicalizeGames(g.games)), g.modes, g.goals, g.availability, g.tags, g.steam_url ?? null]);
    if (g.platforms) await pool.query('UPDATE gaming_profiles SET platforms = $2 WHERE user_id = $1', [id, g.platforms]);
  }
  if (d.creative) {
    const c = d.creative;
    await pool.query(
      `UPDATE creative_profiles SET skills=$2, interests=$3, tools=$4, experience=$5, roles=$6, goals=$7, tags=$8 WHERE user_id=$1`,
      [id, c.skills, c.interests, c.tools, c.experience ?? null, c.roles, c.goals, c.tags]);
  }
  if (d.preferences) {
    await pool.query('UPDATE profiles SET match_prefs = match_prefs || $2::jsonb WHERE user_id = $1', [id, JSON.stringify(d.preferences)]);
  }
  await recomputeCompleted(id);
  res.json(await getBio(id, true));
}));

export default router;
