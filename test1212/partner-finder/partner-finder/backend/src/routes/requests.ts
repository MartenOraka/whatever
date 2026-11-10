import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { canViewProfile } from '../services/access';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  to: z.number().int().positive(),
  type: z.enum(['connect', 'message']),
  message: z.string().trim().min(1).max(500).optional(),
}).refine((d) => d.type !== 'message' || !!d.message, { message: 'A message is required', path: ['message'] });

// "Interested" (type connect) or "Message" (type message + first message text)
router.post('/', wrap(async (req, res) => {
  const d = createSchema.parse(req.body);
  const me = req.userId!;

  const done = await pool.query('SELECT completed FROM profiles WHERE user_id = $1', [me]);
  if (!done.rows[0]?.completed) return res.status(403).json({ error: 'Complete your profile first' });

  // Same 404 as the profile endpoints: you can only act on people you are allowed to see.
  if (d.to === me || !(await canViewProfile(me, d.to))) return res.status(404).json({ error: 'Not found' });

  const connected = await pool.query(
    'SELECT 1 FROM connections WHERE user_a = LEAST($1::int,$2::int) AND user_b = GREATEST($1::int,$2::int)', [me, d.to]);
  if (connected.rows[0]) return res.status(409).json({ error: 'Already connected' });

  const existing = await pool.query(
    'SELECT 1 FROM requests WHERE (from_id=$1 AND to_id=$2) OR (from_id=$2 AND to_id=$1)', [me, d.to]);
  if (existing.rows[0]) return res.status(409).json({ error: 'A request between you two already exists' });

  const r = await pool.query(
    'INSERT INTO requests (from_id, to_id, type, message) VALUES ($1,$2,$3,$4) RETURNING id',
    [me, d.to, d.type, d.type === 'message' ? d.message : null]);
  res.status(201).json({ id: r.rows[0].id });
}));

// Inbox. Message requests live in their own list: /requests/incoming?type=message
const typeSchema = z.enum(['connect', 'message']).optional();

router.get('/incoming', wrap(async (req, res) => {
  const type = typeSchema.parse(req.query.type);
  const r = await pool.query(
    `SELECT id, from_id, type, message, created_at FROM requests
      WHERE to_id = $1 AND status = 'pending' AND ($2::text IS NULL OR type = $2)
      ORDER BY created_at DESC`, [req.userId, type ?? null]);
  res.json(r.rows);
}));

router.get('/outgoing', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT id, to_id, type, message, created_at FROM requests
      WHERE from_id = $1 AND status = 'pending' ORDER BY created_at DESC`, [req.userId]);
  res.json(r.rows);
}));

// Accepting creates the connection AND the (single) conversation.
// A message request's first message becomes the first chat message.
router.post('/:id/accept', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const me = req.userId!;
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Not found' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Only the RECIPIENT of a PENDING request can accept it.
    const r = await client.query(
      `UPDATE requests SET status = 'accepted' WHERE id = $1 AND to_id = $2 AND status = 'pending'
       RETURNING from_id, type, message, created_at`, [id, me]);
    if (!r.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }

    const { from_id, type, message, created_at } = r.rows[0];
    const a = Math.min(from_id, me), b = Math.max(from_id, me);
    await client.query('INSERT INTO connections (user_a, user_b) VALUES ($1,$2) ON CONFLICT DO NOTHING', [a, b]);
    const conv = await client.query(
      `INSERT INTO conversations (user_a, user_b) VALUES ($1,$2)
       ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a RETURNING id`, [a, b]);
    if (type === 'message' && message) {
      await client.query('INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES ($1,$2,$3,$4)',
        [conv.rows[0].id, from_id, message, created_at]);
      await client.query('UPDATE conversations SET last_message_at = $2 WHERE id = $1', [conv.rows[0].id, created_at]);
    }
    await client.query('COMMIT');
    res.json({ connected_with: from_id });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// Declining never creates a connection.
router.post('/:id/decline', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const r = Number.isInteger(id)
    ? await pool.query(`UPDATE requests SET status = 'declined' WHERE id = $1 AND to_id = $2 AND status = 'pending' RETURNING id`, [id, req.userId])
    : { rows: [] };
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

// Cancel a request I sent. The row is really DELETED (not hidden), and only if:
//  - I am the sender (incoming requests of mine are untouched), and
//  - it is still pending (an accepted connection can never be removed through this route).
router.delete('/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const r = Number.isInteger(id)
    ? await pool.query(`DELETE FROM requests WHERE id = $1 AND from_id = $2 AND status = 'pending' RETURNING id`, [id, req.userId])
    : { rows: [] };
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

export default router;
