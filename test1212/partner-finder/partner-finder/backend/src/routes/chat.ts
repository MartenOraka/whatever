import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { markRead, participantOther, sendMessage } from '../services/chat';

const router = Router();
router.use(requireAuth);

// Chat list, most recent activity first, with unread counts.
router.get('/', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT c.id,
            CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS user_id,
            c.last_message_at,
            lm.body AS last_body, lm.sender_id AS last_sender_id,
            (SELECT count(*)::int FROM messages m
              WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read_at IS NULL) AS unread_count
       FROM conversations c
       JOIN connections k ON k.user_a = c.user_a AND k.user_b = c.user_b
       LEFT JOIN LATERAL (SELECT body, sender_id FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) lm ON true
      WHERE c.user_a = $1 OR c.user_b = $1
      ORDER BY c.last_message_at DESC`, [req.userId]);
  res.json(r.rows);
}));

// Total unread, for the notification icon when the app loads.
router.get('/unread', wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT count(*)::int AS count FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       JOIN connections k ON k.user_a = c.user_a AND k.user_b = c.user_b
      WHERE (c.user_a = $1 OR c.user_b = $1) AND m.sender_id <> $1 AND m.read_at IS NULL`, [req.userId]);
  res.json(r.rows[0]);
}));

// Start or resume the chat with a connected user (used by the button on their profile).
router.get('/with/:userId', wrap(async (req, res) => {
  const other = Number(req.params.userId);
  const me = req.userId!;
  if (!Number.isInteger(other) || other === me) return res.status(404).json({ error: 'Not found' });
  const k = await pool.query(
    'SELECT 1 FROM connections WHERE user_a = LEAST($1::int,$2::int) AND user_b = GREATEST($1::int,$2::int)', [me, other]);
  if (!k.rows[0]) return res.status(404).json({ error: 'Not found' });
  const c = await pool.query(
    `INSERT INTO conversations (user_a, user_b) VALUES (LEAST($1::int,$2::int), GREATEST($1::int,$2::int))
     ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a RETURNING id`, [me, other]);
  res.json({ id: c.rows[0].id, user_id: other });
}));

// Paginated history: newest page first, then pass ?before=<oldest id you have> for older ones.
const pageSchema = z.object({
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

router.get('/:id/messages', wrap(async (req, res) => {
  const convId = Number(req.params.id);
  if (!Number.isInteger(convId) || (await participantOther(req.userId!, convId)) === null) {
    return res.status(404).json({ error: 'Not found' });
  }
  const { before, limit } = pageSchema.parse(req.query);
  const r = await pool.query(
    `SELECT id, sender_id, body, created_at, read_at FROM messages
      WHERE conversation_id = $1 AND ($2::int IS NULL OR id < $2)
      ORDER BY id DESC LIMIT $3`, [convId, before ?? null, limit + 1]);
  const hasMore = r.rows.length > limit;
  const messages = r.rows.slice(0, limit).reverse();          // oldest -> newest for display
  res.json({ messages, has_more: hasMore, next_before: messages[0]?.id ?? null });
}));

// REST fallback for sending (the app itself sends over the socket).
router.post('/:id/messages', wrap(async (req, res) => {
  const convId = Number(req.params.id);
  const { body } = z.object({ body: z.string().trim().min(1).max(2000) }).parse(req.body);
  const message = Number.isInteger(convId) ? await sendMessage(req.userId!, convId, body) : null;
  if (!message) return res.status(404).json({ error: 'Not found' });
  res.status(201).json(message);
}));

router.post('/:id/read', wrap(async (req, res) => {
  const convId = Number(req.params.id);
  if (!Number.isInteger(convId) || !(await markRead(req.userId!, convId))) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

export default router;
