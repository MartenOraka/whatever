import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request { userId?: number; authUserId?: number; actingAs?: number }
  }
}

export const COOKIE = 'token';

export function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as { sub: number };
    req.authUserId = payload.sub;                    // who is really logged in
    req.userId = req.actingAs ?? payload.sub;       // actingAs is only ever set by the admin guard (routes/admin.ts)
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
