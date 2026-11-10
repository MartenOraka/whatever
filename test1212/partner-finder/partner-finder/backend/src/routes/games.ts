import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { wrap } from '../middleware/errors';
import { CATEGORIES, GAME_CATALOG } from '../data/gameCatalog';
import { findGame, normGame } from '../services/gameCatalog';

// Steam artwork lookup. The browser cannot call the Steam store API itself (no CORS), so the
// backend asks Steam, remembers the answer, and the frontend builds the image URL from the app id.
// No hand-maintained game list: every game in Steam's catalogue can get artwork.
const router = Router();
router.use(requireAuth);

// "HELLDIVERS™ 2" and "helldivers 2" compare equal.
const norm = normGame;

interface Hit { app_id: number; name: string }
const cache = new Map<string, { at: number; hits: Hit[] }>();
const TTL_MS = 60 * 60 * 1000;

async function steamSearch(term: string): Promise<Hit[]> {
  const key = norm(term);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.hits;
  try {
    const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`,
      { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: { id: number; name: string; type?: string }[] };
    const hits = (json.items ?? []).filter((i) => !i.type || i.type === 'app').map((i) => ({ app_id: i.id, name: i.name.replace(/[™®©]/g, '').replace(/\s+/g, ' ').trim() }));   // clean names, so everyone's "Helldivers 2" matches
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), hits });          // only successful answers are remembered
    return hits;
  } catch {
    return [];                                          // Steam unreachable: the UI shows its fallback tile
  }
}

// GET /games/catalog  ->  the whole QREW game library (the frontend loads it once; one source of truth)
router.get('/catalog', (_req, res) => res.json({ categories: CATEGORIES, games: GAME_CATALOG }));

// GET /games/artwork?name=Helldivers 2  ->  { name, app_id }   (app_id null = no Steam artwork, the UI shows its branded tile)
// Library games answer from the catalogue. Any other name is looked up on Steam (exact title only, never a wrong cover).
router.get('/artwork', wrap(async (req, res) => {
  const name = z.string().trim().min(1).max(80).parse(req.query.name);
  const known = findGame(name);
  if (known) return res.json({ name: known.name, app_id: known.steam ?? null });
  const exact = (await steamSearch(name)).find((h) => norm(h.name) === norm(name));
  res.json({ name, app_id: exact?.app_id ?? null });
}));

// GET /games/search?q=hell  ->  Steam games that are NOT in our library yet (library matches are searched in the browser)
router.get('/search', wrap(async (req, res) => {
  const q = z.string().trim().min(2).max(60).parse(req.query.q);
  res.json((await steamSearch(q)).filter((h) => !findGame(h.name)).slice(0, 8));
}));

export default router;
