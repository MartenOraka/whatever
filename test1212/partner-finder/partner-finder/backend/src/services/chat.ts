import { pool } from '../db/pool';
import { emitToUser } from './realtime';

// The other person in a conversation, or null if the conversation does not exist,
// the user is not part of it, or the two are no longer connected.
// Every chat action goes through this check.
export async function participantOther(userId: number, convId: number): Promise<number | null> {
  const r = await pool.query(
    `SELECT CASE WHEN c.user_a = $2 THEN c.user_b ELSE c.user_a END AS other
       FROM conversations c
       JOIN connections k ON k.user_a = c.user_a AND k.user_b = c.user_b
      WHERE c.id = $1 AND (c.user_a = $2 OR c.user_b = $2)`, [convId, userId]);
  return r.rows[0]?.other ?? null;
}

// Saves a message and pushes it to BOTH users in real time (no polling anywhere).
export async function sendMessage(senderId: number, convId: number, body: string) {
  const other = await participantOther(senderId, convId);
  if (other === null) return null;
  const r = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)
     RETURNING id, sender_id, body, created_at, read_at`, [convId, senderId, body]);
  const message = r.rows[0];
  await pool.query('UPDATE conversations SET last_message_at = $2 WHERE id = $1', [convId, message.created_at]);
  const payload = { conversation_id: convId, message };
  emitToUser(senderId, 'message:new', payload);   // sender's other tabs
  emitToUser(other, 'message:new', payload);      // recipient: badge + reorder + live message
  return message;
}

export async function markRead(userId: number, convId: number): Promise<boolean> {
  const other = await participantOther(userId, convId);
  if (other === null) return false;
  await pool.query(
    'UPDATE messages SET read_at = now() WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL', [convId, userId]);
  const payload = { conversation_id: convId, reader_id: userId };
  emitToUser(userId, 'chat:read', payload);
  emitToUser(other, 'chat:read', payload);
  return true;
}
