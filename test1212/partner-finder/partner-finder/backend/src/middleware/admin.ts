import { NextFunction, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from './auth';

// Admins are the accounts whose e-mail is listed in backend/.env:   ADMIN_EMAILS=you@example.com,partner@example.com
// (no extra database step: register normally with that e-mail, then the Admin page appears)
export const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export async function isAdminUser(userId: number): Promise<boolean> {
  const list = adminEmails();
  if (!list.length) return false;
  const r = await pool.query('SELECT lower(email) AS email FROM users WHERE id = $1', [userId]);
  return list.includes(r.rows[0]?.email);
}

// Everyone who is not an admin gets the same 404 as for a page that does not exist.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    isAdminUser(req.authUserId!).then((ok) => (ok ? next() : res.status(404).json({ error: 'Not found' }))).catch(next);
  });
}
