import { randomBytes } from 'crypto';
import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';

export const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
export const BANNER_DIR = join(process.cwd(), 'uploads', 'banners');
mkdirSync(AVATAR_DIR, { recursive: true });
mkdirSync(BANNER_DIR, { recursive: true });

// Do not trust the client's file name or mimetype: check the real file signature (magic bytes).
function detectExt(b: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (b.length > 12 && b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

interface ImageKind {
  field: 'avatar' | 'banner';          // multipart field name
  column: 'avatar_url' | 'banner_url'; // profiles column (fixed values, never user input)
  dir: string;                         // folder on disk
  urlPrefix: string;                   // public URL folder
  maxBytes: number;
}

// One implementation for every uploadable profile image (avatar + banner): upload / replace / remove.
function makeImageRouter(kind: ImageKind) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: kind.maxBytes, files: 1 } });
  const removeOld = (url: string | null) => {
    if (!url?.startsWith(kind.urlPrefix)) return;
    try { unlinkSync(join(kind.dir, url.split('/').pop()!)); } catch { /* already gone */ }
  };

  const router = Router();
  router.use(requireAuth);

  router.put('/', upload.single(kind.field), wrap(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: `Send an image in the "${kind.field}" field` });
    const ext = detectExt(req.file.buffer);
    if (!ext) return res.status(400).json({ error: 'Only PNG, JPEG or WebP images are allowed' });

    const name = `${req.userId}-${randomBytes(8).toString('hex')}.${ext}`;   // random, unguessable name
    writeFileSync(join(kind.dir, name), req.file.buffer);
    const url = `${kind.urlPrefix}${name}`;

    const old = await pool.query(`SELECT ${kind.column} AS url FROM profiles WHERE user_id = $1`, [req.userId]);
    await pool.query(`UPDATE profiles SET ${kind.column} = $2 WHERE user_id = $1`, [req.userId, url]);
    removeOld(old.rows[0]?.url ?? null);
    res.json({ id: req.userId, [kind.column]: url });
  }));

  router.delete('/', wrap(async (req, res) => {
    const old = await pool.query(`SELECT ${kind.column} AS url FROM profiles WHERE user_id = $1`, [req.userId]);
    await pool.query(`UPDATE profiles SET ${kind.column} = NULL WHERE user_id = $1`, [req.userId]);
    removeOld(old.rows[0]?.url ?? null);
    res.status(204).end();                       // nothing set -> the app shows its default
  }));

  return router;
}

export const bannerRoutes = makeImageRouter({ field: 'banner', column: 'banner_url', dir: BANNER_DIR, urlPrefix: '/uploads/banners/', maxBytes: 4 * 1024 * 1024 });
export default makeImageRouter({ field: 'avatar', column: 'avatar_url', dir: AVATAR_DIR, urlPrefix: '/uploads/avatars/', maxBytes: 2 * 1024 * 1024 });
