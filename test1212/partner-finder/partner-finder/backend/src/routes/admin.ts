import { randomBytes } from 'crypto';
import { unlinkSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';
import { NextFunction, Request, Response, Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { adminEmails, isAdminUser, requireAdmin } from '../middleware/admin';
import { wrap } from '../middleware/errors';
import avatarRoutes, { AVATAR_DIR, BANNER_DIR, bannerRoutes } from './avatar';
import meRoutes, { usernameSchema } from './me';

// Admin area: manage profiles for the demo / project review.  Everything here is behind requireAdmin.
// Editing a profile re-uses the normal profile routes ("acting as" that user), so there is ONE set of rules for validation,
// image handling and "profile completed" - the admin editor and the user's own editor can never disagree.
const router = Router();
router.use(requireAdmin);

const tempPassword = () => randomBytes(9).toString('base64url');            // 12 readable characters

router.get('/users', wrap(async (req, res) => {
  const { q, limit, offset } = z.object({
    q: z.string().trim().max(60).default(''),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    offset: z.coerce.number().int().min(0).default(0),
  }).parse(req.query);
  const like = `%${q}%`;
  const where = `WHERE ($1 = '' OR p.nickname ILIKE $2 OR p.username ILIKE $2 OR u.email ILIKE $2)`;
  const total = await pool.query(`SELECT count(*)::int AS n FROM users u JOIN profiles p ON p.user_id = u.id ${where}`, [q, like]);
  const rows = await pool.query(
    `SELECT u.id, u.email, u.created_at, p.nickname, p.username, p.avatar_url, p.city, p.completed, p.crew_roles
       FROM users u JOIN profiles p ON p.user_id = u.id ${where} ORDER BY u.id DESC LIMIT $3 OFFSET $4`, [q, like, limit, offset]);
  const admins = adminEmails();
  res.json({ total: total.rows[0].n, users: rows.rows.map((r) => ({ ...r, is_admin: admins.includes(r.email.toLowerCase()) })) });
}));

// Create a new profile = a new account. Give a password, or leave it empty and a temporary one is generated (shown once).
const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72).optional(),
  nickname: z.string().trim().min(2).max(30),
  username: usernameSchema.optional(),
});
router.post('/users', wrap(async (req, res) => {
  const d = createSchema.parse(req.body);
  const password = d.password ?? tempPassword();
  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query('INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id', [d.email, hash]);
    const id: number = u.rows[0].id;
    await client.query('INSERT INTO profiles (user_id, nickname, username) VALUES ($1,$2,$3)', [id, d.nickname, d.username ?? null]);
    await client.query('INSERT INTO gaming_profiles (user_id) VALUES ($1)', [id]);
    await client.query('INSERT INTO creative_profiles (user_id) VALUES ($1)', [id]);
    await client.query('COMMIT');
    res.status(201).json({ id, ...(d.password ? {} : { temp_password: password }) });
  } catch (e: any) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: String(e.constraint).includes('username') ? 'That username is already taken' : 'That email is already registered' });
    throw e;
  } finally { client.release(); }
}));

router.put('/users/:id/password', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const d = z.object({ password: z.string().min(8).max(72).optional() }).parse(req.body);
  const password = d.password ?? tempPassword();
  const r = Number.isInteger(id) ? await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id', [id, await bcrypt.hash(password, 10)]) : { rows: [] };
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(d.password ? { id } : { id, temp_password: password });
}));

const removeFile = (url: string | null) => {
  if (!url) return;
  const dir = url.startsWith('/uploads/avatars/') ? AVATAR_DIR : url.startsWith('/uploads/banners/') ? BANNER_DIR : null;
  if (dir) { try { unlinkSync(join(dir, url.split('/').pop()!)); } catch { /* already gone */ } }
};

router.delete('/users/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.authUserId) return res.status(400).json({ error: 'You cannot delete the account you are logged in with' });
  const files = Number.isInteger(id) ? await pool.query('SELECT avatar_url, banner_url FROM profiles WHERE user_id = $1', [id]) : { rows: [] };
  const r = Number.isInteger(id) ? await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]) : { rows: [] };   // cascades to everything
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  removeFile(files.rows[0]?.avatar_url ?? null); removeFile(files.rows[0]?.banner_url ?? null);
  res.status(204).end();
}));

// "Act as": the next router sees req.userId = the profile being edited (never the admin's own id).
const actAs = wrap(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.uid);
  const found = Number.isInteger(id) && id > 0 ? await pool.query('SELECT 1 FROM users WHERE id = $1', [id]) : { rows: [] };
  if (!found.rows[0]) return res.status(404).json({ error: 'Not found' });
  req.actingAs = id;
  next();
});
router.use('/users/:uid/avatar', actAs, avatarRoutes);
router.use('/users/:uid/banner', actAs, bannerRoutes);
router.use('/users/:uid', actAs, meRoutes);           // GET /, /profile, /bio  and  PUT /profile, /bio

export default router;
