import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { z } from 'zod';
import { pool } from './db/pool';
import { COOKIE } from './middleware/auth';
import { markRead, participantOther, sendMessage } from './services/chat';
import { connected, disconnected, isOnline } from './services/presence';
import { emitToUser, setIo } from './services/realtime';

function tokenFromCookie(header?: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function connectedIds(userId: number): Promise<number[]> {
  const r = await pool.query(
    'SELECT CASE WHEN user_a = $1 THEN user_b ELSE user_a END AS id FROM connections WHERE user_a = $1 OR user_b = $1', [userId]);
  return r.rows.map((x) => x.id);
}

const sendSchema = z.object({ conversationId: z.number().int().positive(), body: z.string().trim().min(1).max(2000) });
const typingSchema = z.object({ conversationId: z.number().int().positive(), typing: z.boolean() });
const readSchema = z.object({ conversationId: z.number().int().positive() });

export function initSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN, credentials: true } });
  setIo(io);

  // Same JWT cookie as the REST API. No valid cookie = no socket.
  io.use((socket, next) => {
    try {
      const token = tokenFromCookie(socket.handshake.headers.cookie);
      if (!token) throw new Error('no token');
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as { sub: number };
      socket.data.userId = payload.sub;
      next();
    } catch { next(new Error('unauthorized')); }
  });

  io.on('connection', async (socket) => {
    const userId: number = socket.data.userId;
    socket.join(`user:${userId}`);

    // Presence: tell my contacts I am online, and tell me which of them already are.
    const contacts = await connectedIds(userId);
    if (connected(userId)) contacts.forEach((id) => emitToUser(id, 'presence', { user_id: userId, online: true }));
    socket.emit('presence:snapshot', { online: contacts.filter(isOnline) });

    socket.on('message:send', async (data, ack) => {
      try {
        const { conversationId, body } = sendSchema.parse(data);
        const message = await sendMessage(userId, conversationId, body);
        ack?.(message ? { ok: true, message } : { ok: false, error: 'Not found' });
      } catch { ack?.({ ok: false, error: 'Invalid message' }); }
    });

    // The client sends typing:true while the user types and typing:false when they stop.
    socket.on('typing', async (data) => {
      try {
        const { conversationId, typing } = typingSchema.parse(data);
        const other = await participantOther(userId, conversationId);
        if (other !== null) emitToUser(other, 'typing', { conversation_id: conversationId, user_id: userId, typing });
      } catch { /* ignore bad input */ }
    });

    socket.on('chat:read', async (data) => {
      try { await markRead(userId, readSchema.parse(data).conversationId); } catch { /* ignore */ }
    });

    socket.on('disconnect', async () => {
      if (!disconnected(userId)) return;            // other tabs still open
      await pool.query('UPDATE profiles SET last_seen = now() WHERE user_id = $1', [userId]);
      (await connectedIds(userId)).forEach((id) => emitToUser(id, 'presence', { user_id: userId, online: false }));
    });
  });
}
