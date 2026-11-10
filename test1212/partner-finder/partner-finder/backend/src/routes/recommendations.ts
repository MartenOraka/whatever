import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { canViewProfile } from '../services/access';
import { recommend } from '../services/recommendation';

const router = Router();
router.use(requireAuth);

const modeSchema = z.enum(['gaming', 'creative']).default('gaming');

async function requireCompleted(userId: number) {
  const r = await pool.query('SELECT completed FROM profiles WHERE user_id = $1', [userId]);
  return r.rows[0]?.completed === true;
}

// GET /recommendations?mode=gaming|creative  ->  [{ "id": 5 }, ...]   (max 10, ids only)
router.get('/', wrap(async (req, res) => {
  const mode = modeSchema.parse(req.query.mode);
  if (!(await requireCompleted(req.userId!))) return res.status(403).json({ error: 'Complete your profile first' });
  const ids = await recommend(req.userId!, mode);
  res.json(ids.map((id) => ({ id })));
}));

// Extra endpoint: why was this person recommended?  (only for people in your current list)
router.get('/:id/why', wrap(async (req, res) => {
  const mode = modeSchema.parse(req.query.mode);
  const id = Number(req.params.id);
  const r = Number.isInteger(id)
    ? await pool.query('SELECT target_id AS id, score, reasons FROM recommendations_shown WHERE user_id=$1 AND target_id=$2 AND mode=$3', [req.userId, id, mode])
    : { rows: [] };
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));

// Skip: permanent. The dismissed profile never appears in this user's recommendations again.
router.post('/:id/skip', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id === req.userId || !(await canViewProfile(req.userId!, id))) {
    return res.status(404).json({ error: 'Not found' });
  }
  await pool.query('INSERT INTO dismissals (user_id, dismissed_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.userId, id]);
  await pool.query('DELETE FROM recommendations_shown WHERE user_id = $1 AND target_id = $2', [req.userId, id]);
  res.status(204).end();
}));

export default router;
