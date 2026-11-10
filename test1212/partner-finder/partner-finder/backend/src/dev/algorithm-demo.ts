// Shows the recommendation logic on obvious good / poor pairs (no database needed).
// Run: npm run demo:algorithm
import { MIN_SCORE, Person, scoreCreative, scoreGaming } from '../services/recommendation';

const base: Person = { id: 0, lat: 0, lng: 0, radius_km: 50, games: [], g_modes: [], g_goals: [], availability: [], skills: [], interests: [],
  tools: [], experience: null, roles: [], c_goals: [], c_tags: [], prefs: {} };
const P = (o: Partial<Person>): Person => ({ ...base, ...o });

function show(title: string, kind: 'gaming' | 'creative', a: Person, b: Person, expectRecommended: boolean) {
  const r = kind === 'gaming' ? scoreGaming(a, b) : scoreCreative(a, b);
  const recommended = r !== null && r.score >= MIN_SCORE[kind];
  console.log(`${recommended === expectRecommended ? 'PASS' : 'FAIL'}  ${title}`);
  console.log(`      ${r ? `score ${r.score} (minimum ${MIN_SCORE[kind]})` : 'no link at all (hard rule)'} -> ${recommended ? 'RECOMMENDED' : 'not recommended'}`);
  if (r && recommended) console.log(`      why: ${r.reasons.join(' | ')}`);
}

const cs = (rank: string, h: number) => [{ name: 'CS2', rank, playtime_hours: h }];
const common = { g_modes: ['Ranked', 'Competitive team'], g_goals: ['Climb ranks'], availability: ['weekday-evening', 'weekend-evening'] };

show('Gaming - obviously GOOD: same game, same rank, same modes, same evenings', 'gaming',
  P({ ...common, games: cs('Gold Nova', 900) }), P({ id: 1, ...common, games: cs('Gold Nova', 1100) }), true);
show('Gaming - obviously POOR: completely different games', 'gaming',
  P({ ...common, games: [{ name: 'Minecraft', playtime_hours: 300 }] }), P({ id: 1, ...common, games: [{ name: 'Valorant', rank: 'Gold' }] }), false);
show('Gaming - obviously POOR: same game but Silver vs Global Elite, 20h vs 4000h, nothing else in common', 'gaming',
  P({ games: cs('Silver', 20), g_modes: ['Casual'], g_goals: ['Have fun'], availability: ['weekday-morning'] }),
  P({ id: 1, games: cs('Global Elite', 4000), g_modes: ['Ranked'], g_goals: ['Play competitively'], availability: ['weekend-night'] }), false);

show('Gaming - same game typed differently ("CS2" vs "Counter-Strike 2") still counts as the SAME game', 'gaming',
  P({ ...common, games: cs('Gold Nova', 900) }), P({ id: 1, ...common, games: [{ name: 'Counter-Strike 2', rank: 'Gold Nova', playtime_hours: 1100 }] }), true);

const artist = { skills: ['3D Modeling'], tools: ['Blender'], interests: ['Indie games', 'Game jams'], roles: ['Programmer'], c_goals: ['Join a game jam'], experience: 'intermediate' };
const coder = { skills: ['Programming'], tools: ['Unity', 'Blender'], interests: ['Indie games', 'Game jams'], roles: ['3D Artist'], c_goals: ['Join a game jam'], experience: 'intermediate' };
show('Creative - obviously GOOD: 3D artist + programmer, each wants what the other offers, same interests', 'creative', P(artist), P({ id: 1, ...coder }), true);
show('Creative - obviously POOR: no shared interests, tools, roles or goals', 'creative',
  P({ skills: ['Writing'], interests: ['Comics'], tools: ['VS Code'], roles: ['Writer'], c_goals: ['Just for fun'], experience: 'beginner' }),
  P({ id: 1, skills: ['Sound Design'], interests: ['VR'], tools: ['FL Studio'], roles: ['Composer'], c_goals: ['Build a startup'], experience: 'professional' }), false);

console.log('\nUser priorities (same pair, availability matters less vs more):');
const a = P({ games: cs('Gold Nova', 900), g_modes: ['Ranked'], availability: ['weekday-morning'] });
const b = P({ id: 1, games: cs('Gold Nova', 900), g_modes: ['Ranked'], availability: ['weekend-night'] });
for (const lvl of ['low', 'normal', 'high']) {
  console.log(`      availability = ${lvl.padEnd(6)} -> score ${scoreGaming({ ...a, prefs: { gaming: { availability: lvl } } }, b)?.score}`);
}
