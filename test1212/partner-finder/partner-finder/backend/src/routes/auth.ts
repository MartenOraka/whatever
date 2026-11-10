import bcrypt from 'bcrypt';
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { COOKIE, requireAuth, signToken } from '../middleware/auth';
import { wrap } from '../middleware/errors';

const router = Router();

const cookieOpts = {
  httpOnly: true,                       // JS in the browser cannot read the token
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  nickname: z.string().trim().min(2).max(30),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

router.post('/register', wrap(async (req, res) => {
  const { email, password, nickname } = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(password, 10);       // bcrypt adds a random salt itself
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const u = await client.query('INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id', [email, hash]);
    const id: number = u.rows[0].id;
    await client.query('INSERT INTO profiles (user_id, nickname) VALUES ($1,$2)', [id, nickname]);
    await client.query('INSERT INTO gaming_profiles (user_id) VALUES ($1)', [id]);
    await client.query('INSERT INTO creative_profiles (user_id) VALUES ($1)', [id]);
    await client.query('COMMIT');
    res.cookie(COOKIE, signToken(id), cookieOpts).status(201).json({ id });
  } catch (e: any) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Email is already registered' });
    throw e;
  } finally {
    client.release();
  }
}));

// Compared when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', wrap(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const r = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
  const user = r.rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });
  res.cookie(COOKIE, signToken(user.id), cookieOpts).json({ id: user.id });
}));

router.post('/logout', requireAuth, (_req, res) => {
  res.clearCookie(COOKIE, { ...cookieOpts, maxAge: undefined }).status(204).end();
});

export default router;
