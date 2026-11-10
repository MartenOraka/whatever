// Loads 120 fictional users. Safe to run on a fresh schema, as a separate step.
// Every seed user has the password: password123   (emails: user1@example.com ...)
import bcrypt from 'bcrypt';
import { GAME_CATALOG } from '../data/gameCatalog';
import { pool } from './pool';

const COUNT = 120;
const PASSWORD = 'password123';

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const pickN = <T,>(a: T[], min: number, max: number): T[] => {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  return [...a].sort(() => Math.random() - 0.5).slice(0, n);
};
const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const FIRST = ['Neon','Pixel','Shadow','Frost','Nova','Echo','Blaze','Orbit','Rogue','Zen','Cyber','Lunar','Storm','Viper','Aero','Mystic'];
const SECOND = ['Fox','Wolf','Hawk','Byte','Ghost','Rider','Spark','Drift','Knight','Pilot','Wizard','Raven','Cat','Panda','Fang','Tide'];
const CITIES = [
  { city: 'Tallinn', lat: 59.437, lng: 24.7536 },
  { city: 'Tartu',   lat: 58.378, lng: 26.7290 },
  { city: 'Pärnu',   lat: 58.385, lng: 24.4971 },
  { city: 'Narva',   lat: 59.377, lng: 28.1903 },
  { city: 'Helsinki', lat: 60.1699, lng: 24.9384 },
  { city: 'Riga',    lat: 56.9496, lng: 24.1052 },
];

const MODES = ['Ranked','Casual','Co-op','PvE','Competitive team','Custom games'];
const G_GOALS = ['Climb ranks','Have fun','Find a regular squad','Learn the game','Play competitively'];
const SLOTS = ['weekday-morning','weekday-evening','weekday-night','weekend-day','weekend-evening','weekend-night'];
const G_TAGS = ['Looking for a teammate','Team player','Looking for regular games','Casual player','Competitive player'];

const SKILLS = ['Programming','3D Modeling','Video Editing','Graphic Design','Music Production','Game Design','Writing','Animation','Sound Design','UI/UX'];
const TOOLS = ['Blender','Unity','Unreal Engine','Godot','DaVinci Resolve','Premiere Pro','Figma','Photoshop','VS Code','FL Studio','Aseprite'];
const INTERESTS = ['Indie games','Short films','Pixel art','Game jams','Web apps','Music','Comics','VR','Mods','Open source'];
const EXP = ['beginner','intermediate','advanced','professional'];
const ROLES = ['Programmer','3D Artist','Video Editor','Designer','Composer','Writer','Producer'];
const C_GOALS = ['Finish a portfolio project','Join a game jam','Learn together','Build a startup','Just for fun'];
const C_TAGS = ['Looking for a project','Looking for a collaborator','Learning together','Programmer','3D Artist','Video Editor','Designer'];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10); // hashed once, bcrypt adds its own salt
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 1; i <= COUNT; i++) {
      const u = await client.query(
        'INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id',
        [`user${i}@example.com`, hash],
      );
      const id: number = u.rows[0].id;
      const c = pick(CITIES);
      const nick = `${pick(FIRST)}${pick(SECOND)}${int(1, 99)}`;

      await client.query(
        `INSERT INTO profiles (user_id, nickname, username, crew_roles, bio, city, lat, lng, radius_km, completed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [id, nick, `${nick.toLowerCase()}_${i}`, pickN(['ideator', 'gamer', 'developer', 'artist'], 1, 2), `Fictional user #${i}. Always up for good company and a good project.`,
         c.city, c.lat + (Math.random() - 0.5) * 0.2, c.lng + (Math.random() - 0.5) * 0.2,
         pick([25, 50, 100, 250, 500])],
      );

      // games come from the shared QREW catalogue (official names, real rank ladders), popular ones more often
      const games = pickN(GAME_CATALOG.slice(0, 55), 1, 4).map((g) => ({
        name: g.name,
        playtime_hours: int(20, 4000),
        ...(g.ranks && Math.random() > 0.2 ? { rank: pick(g.ranks) } : {}),
        ...(g.name === 'Counter-Strike 2' && Math.random() > 0.5 ? { extra: { faceit_level: int(1, 10) } } : {}),
      }));
      await client.query(
        `INSERT INTO gaming_profiles (user_id, games, platforms, modes, goals, availability, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, JSON.stringify(games), pickN(['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 1, 3), pickN(MODES, 1, 3), pickN(G_GOALS, 1, 2), pickN(SLOTS, 1, 4), pickN(G_TAGS, 1, 3)],
      );

      await client.query(
        `INSERT INTO creative_profiles (user_id, skills, interests, tools, experience, roles, goals, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, pickN(SKILLS, 1, 4), pickN(INTERESTS, 1, 4), pickN(TOOLS, 1, 4), pick(EXP),
         pickN(ROLES, 1, 3), pickN(C_GOALS, 1, 2), pickN(C_TAGS, 1, 3)],
      );
    }
    await client.query('COMMIT');
    console.log(`Seeded ${COUNT} users. Login: user1@example.com / ${PASSWORD}`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
