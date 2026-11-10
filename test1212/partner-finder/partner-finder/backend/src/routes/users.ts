import { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { canViewProfile } from '../services/access';
import { isOnline } from '../services/presence';
import { getBio, getProfile, getUser } from '../services/shapes';

const router = Router();
router.use(requireAuth);

// Missing profile and forbidden profile give the SAME 404, so nobody can probe which ids exist.
const visible = wrap(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || !(await canViewProfile(req.userId!, id))) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.locals.targetId = id;
  next();
});

router.get('/:id', visible, wrap(async (_req, res) => res.json(await getUser(res.locals.targetId))));
router.get('/:id/profile', visible, wrap(async (_req, res) => res.json(await getProfile(res.locals.targetId))));
router.get('/:id/bio', visible, wrap(async (req, res) =>
  res.json(await getBio(res.locals.targetId, res.locals.targetId === req.userId))));

// Online indicator for profile and chat views (same visibility rules as the profile itself).
router.get('/:id/status', visible, wrap(async (_req, res) => {
  const id: number = res.locals.targetId;
  const r = await pool.query('SELECT last_seen FROM profiles WHERE user_id = $1', [id]);
  res.json({ id, online: isOnline(id), last_seen: r.rows[0]?.last_seen ?? null });
}));

export default router;
