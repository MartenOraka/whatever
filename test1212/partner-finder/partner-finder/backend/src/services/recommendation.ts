import { pool } from '../db/pool';
import { gameKey, rankLadder } from './gameCatalog';
import { ROLE_SKILLS } from './ladders';

export type Mode = 'gaming' | 'creative';

// Weak matches are cut off here. Tune these numbers if you see too few / too many results.
export const MIN_SCORE: Record<Mode, number> = { gaming: 40, creative: 35 };
const LIMIT = 10;
const EXPERIENCE = ['beginner', 'intermediate', 'advanced', 'professional'];

interface Game { name: string; playtime_hours?: number; rank?: string }
export interface Person {
  id: number; lat: number; lng: number; radius_km: number;
  games: Game[]; g_modes: string[]; g_goals: string[]; availability: string[];
  skills: string[]; interests: string[]; tools: string[]; experience: string | null;
  roles: string[]; c_goals: string[]; c_tags: string[];
  prefs?: Partial<Record<Mode, Record<string, string>>>;   // the viewer's own priorities
}
export interface Scored { id: number; score: number; reasons: string[] }

// ---------- small helpers ----------
const lc = (a: string[]) => a.map((x) => x.toLowerCase());
const common = (a: string[], b: string[]) => { const s = new Set(lc(b)); return a.filter((x) => s.has(x.toLowerCase())); };
const overlap = (a: string[], b: string[]) =>           // shared / size of the smaller list
  a.length && b.length ? common(a, b).length / Math.min(a.length, b.length) : 0;
const jaccard = (a: string[], b: string[]) => {          // shared / total distinct
  if (!a.length || !b.length) return 0;
  const c = common(a, b).length;
  return c / (a.length + b.length - c);
};
const avg = (xs: number[], fallback: number) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : fallback);

function rankSim(game: string, a?: string, b?: string): number | null {
  const ladder = rankLadder(game);
  if (!ladder || !a || !b) return null;
  const ia = ladder.findIndex((r) => r.toLowerCase() === a.toLowerCase());
  const ib = ladder.findIndex((r) => r.toLowerCase() === b.toLowerCase());
  if (ia < 0 || ib < 0) return null;
  return 1 - Math.abs(ia - ib) / (ladder.length - 1);
}

// Users can mark each data point Less important / Normal / Very important.
// Weights are scaled by that and re-normalised, so the score stays on 0-100.
const MULT: Record<string, number> = { low: 0.5, normal: 1, high: 2 };
function combine(base: Record<string, number>, vals: Record<string, number>, prefs: Record<string, string> = {}): number {
  let num = 0, den = 0;
  for (const k of Object.keys(base)) {
    const w = base[k] * (MULT[prefs[k] ?? 'normal'] ?? 1);
    num += w * vals[k]; den += w;
  }
  return Math.round((100 * num) / den);
}

// ---------- GAMING: 100 points ----------
// shared games 35 | rank 15 | playtime 10 | modes 15 | availability 15 | goals 10
// Hard rule: at least one shared game, otherwise not a gaming match at all.
export function scoreGaming(me: Person, o: Person): Scored | null {
  const mine = new Map(me.games.map((g) => [gameKey(g.name), g]));      // "CS2" and "Counter-Strike 2" are the same game
  const shared = o.games.filter((g) => mine.has(gameKey(g.name)));
  if (!shared.length) return null;

  const gameCoef = shared.length / Math.min(me.games.length, o.games.length);
  const ranks: number[] = [];
  const plays: number[] = [];
  for (const g of shared) {
    const m = mine.get(gameKey(g.name))!;
    const r = rankSim(g.name, m.rank, g.rank);
    if (r !== null) ranks.push(r);
    if (m.playtime_hours != null && g.playtime_hours != null) {
      // within a factor of 10 counts as similar experience
      const diff = Math.abs(Math.log(m.playtime_hours + 1) - Math.log(g.playtime_hours + 1));
      plays.push(1 - Math.min(1, diff / Math.log(10)));
    }
  }
  const rank = avg(ranks, 0.5);   // unknown data = neutral, neither reward nor punish
  const play = avg(plays, 0.5);
  const modes = jaccard(me.g_modes, o.g_modes);
  const avail = overlap(me.availability, o.availability);
  const goals = jaccard(me.g_goals, o.g_goals);

  const score = combine({ games: 35, rank: 15, playtime: 10, modes: 15, availability: 15, goals: 10 },
    { games: gameCoef, rank, playtime: play, modes, availability: avail, goals }, me.prefs?.gaming);

  const reasons = [`Both play ${shared.map((g) => g.name).slice(0, 3).join(', ')}`];
  if (ranks.length && rank >= 0.8) reasons.push('Similar rank');
  if (plays.length && play >= 0.8) reasons.push('Similar playtime');
  const m = common(me.g_modes, o.g_modes); if (m.length) reasons.push(`Both like: ${m.slice(0, 2).join(', ')}`);
  const a = common(me.availability, o.availability); if (a.length) reasons.push(`Both free: ${a.slice(0, 2).join(', ')}`);
  const g = common(me.g_goals, o.g_goals); if (g.length) reasons.push(`Same goal: ${g[0]}`);
  return { id: o.id, score, reasons };
}

// ---------- CREATIVE: 100 points ----------
// interests 25 | tools 20 | roles fit 20 | goals 15 | skills 10 | experience 10
// Hard rule: need a shared interest OR a role fit, otherwise no real link.
function roleFit(wanted: string[], other: Person) {
  if (!wanted.length) return null;
  const skills = lc(other.skills), tags = lc(other.c_tags);
  const hit = wanted.filter((r) => tags.includes(r.toLowerCase()) || (ROLE_SKILLS[r] ?? []).some((s) => skills.includes(s.toLowerCase())));
  return { ratio: hit.length / wanted.length, hit };
}

export function scoreCreative(me: Person, o: Person): Scored | null {
  const interests = common(me.interests, o.interests);
  const mineWanted = roleFit(me.roles, o);          // does THEY offer what I want?
  const theirsWanted = roleFit(o.roles, me);        // do I offer what THEY want?
  const roleScore = avg([mineWanted, theirsWanted].filter((x) => x !== null).map((x) => x!.ratio), 0);
  if (!interests.length && roleScore === 0) return null;

  const ia = EXPERIENCE.indexOf(me.experience ?? ''), ib = EXPERIENCE.indexOf(o.experience ?? '');
  const exp = ia < 0 || ib < 0 ? 0.5 : 1 - Math.abs(ia - ib) / (EXPERIENCE.length - 1);

  const score = combine({ interests: 25, tools: 20, roles: 20, goals: 15, skills: 10, experience: 10 },
    { interests: overlap(me.interests, o.interests), tools: overlap(me.tools, o.tools), roles: roleScore,
      goals: jaccard(me.c_goals, o.c_goals), skills: overlap(me.skills, o.skills), experience: exp }, me.prefs?.creative);

  const reasons: string[] = [];
  if (interests.length) reasons.push(`Shared interests: ${interests.slice(0, 3).join(', ')}`);
  if (mineWanted?.hit.length) reasons.push(`Offers what you look for: ${mineWanted.hit.join(', ')}`);
  if (theirsWanted?.hit.length) reasons.push(`Looking for what you offer: ${theirsWanted.hit.join(', ')}`);
  const t = common(me.tools, o.tools); if (t.length) reasons.push(`Same tools: ${t.slice(0, 3).join(', ')}`);
  const g = common(me.c_goals, o.c_goals); if (g.length) reasons.push(`Same goal: ${g[0]}`);
  if (exp === 1) reasons.push('Same experience level');
  return { id: o.id, score, reasons };
}

// ---------- loading + ranking ----------
const COLS = `p.user_id AS id, p.lat, p.lng, p.radius_km, p.match_prefs AS prefs,
  g.games, g.modes AS g_modes, g.goals AS g_goals, g.availability,
  c.skills, c.interests, c.tools, c.experience, c.roles, c.goals AS c_goals, c.tags AS c_tags`;
const FROM = `FROM profiles p
  JOIN gaming_profiles g ON g.user_id = p.user_id
  JOIN creative_profiles c ON c.user_id = p.user_id`;

export async function recommend(userId: number, mode: Mode): Promise<number[]> {
  const meRes = await pool.query(`SELECT ${COLS} ${FROM} WHERE p.user_id = $1`, [userId]);
  const me: Person = meRes.rows[0];

  // Eligibility is decided in SQL: complete profile, not me, inside MY radius,
  // not dismissed, not connected, no request between us (any status).
  // The lat BETWEEN is a cheap bounding box; the haversine formula then gives the exact distance in km.
  const cands = await pool.query(
    `SELECT ${COLS} ${FROM}
      WHERE p.completed AND p.user_id <> $1
        AND p.lat BETWEEN $2::float8 - $4::float8 / 111.0 AND $2::float8 + $4::float8 / 111.0
        AND 6371 * acos(least(1, cos(radians($2::float8)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians($3::float8))
                               + sin(radians($2::float8)) * sin(radians(p.lat)))) <= $4::float8
        AND NOT EXISTS (SELECT 1 FROM dismissals d WHERE d.user_id = $1 AND d.dismissed_id = p.user_id)
        AND NOT EXISTS (SELECT 1 FROM connections k WHERE k.user_a = LEAST($1::int, p.user_id) AND k.user_b = GREATEST($1::int, p.user_id))
        AND NOT EXISTS (SELECT 1 FROM requests r WHERE (r.from_id = $1 AND r.to_id = p.user_id) OR (r.from_id = p.user_id AND r.to_id = $1))`,
    [userId, me.lat, me.lng, me.radius_km]);

  const top = (cands.rows as Person[])
    .map((o) => (mode === 'gaming' ? scoreGaming(me, o) : scoreCreative(me, o)))
    .filter((s): s is Scored => s !== null && s.score >= MIN_SCORE[mode])
    .sort((a, b) => b.score - a.score || a.id - b.id)   // strongest first
    .slice(0, LIMIT);                                    // never more than 10, never duplicates

  // Remember what was shown: this is what makes those profiles viewable (see access.ts).
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM recommendations_shown WHERE user_id = $1 AND mode = $2', [userId, mode]);
    for (const s of top) {
      await client.query(
        'INSERT INTO recommendations_shown (user_id, target_id, mode, score, reasons) VALUES ($1,$2,$3,$4,$5)',
        [userId, s.id, mode, s.score, s.reasons]);
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }

  return top.map((s) => s.id);
}
