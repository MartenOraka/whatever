import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';

const router = Router();
router.use(requireAuth);

// GET /connections  ->  [{ "id": 7 }, ...]   (ids only)
router.get('/', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS id
       FROM connections WHERE user_a = $1 OR user_b = $1 ORDER BY created_at DESC`, [req.userId]);
  res.json(r.rows);
}));

// Disconnect. Chat history is kept in the database but the chat endpoints will require a connection.
router.delete('/:id', wrap(async (req, res) => {
  const other = Number(req.params.id);
  const r = Number.isInteger(other)
    ? await pool.query(
        'DELETE FROM connections WHERE user_a = LEAST($1::int,$2::int) AND user_b = GREATEST($1::int,$2::int) RETURNING user_a',
        [req.userId, other])
    : { rows: [] };
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

export default router;
