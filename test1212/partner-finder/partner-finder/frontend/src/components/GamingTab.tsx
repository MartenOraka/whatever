import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { dedupeGames, useCatalog } from '../gameCatalog';
import { EXTRA_FIELDS, GAMING_FACTORS, G_GOALS, G_TAGS, MODES, PLATFORMS, pretty, SLOTS } from '../options';
import { Bio, Game } from '../types';
import ChipSelect from './ChipSelect';
import { GameThumb } from './GameArtwork';
import GamePicker from './GamePicker';
import Priorities from './Priorities';
import SaveBar from './SaveBar';

export default function GamingTab({ bio, onSaved, base = '/me' }: { bio: Bio; onSaved: (b: Bio) => void; base?: string }) {
  const { refresh } = useAuth();
  const cat = useCatalog();
  const g0 = bio.gaming;
  const [games, setGames] = useState<Game[]>(g0.games);
  const [platforms, setPlatforms] = useState(g0.platforms ?? []);
  const [modes, setModes] = useState(g0.modes);
  const [goals, setGoals] = useState(g0.goals);
  const [availability, setAvailability] = useState(g0.availability);
  const [tags, setTags] = useState(g0.tags);
  const [steam, setSteam] = useState(g0.steam_url ?? '');
  const [prefs, setPrefs] = useState<Record<string, string>>(bio.preferences?.gaming ?? {});

  // older entries ("CS2") become official names ("Counter-Strike 2") once the library is loaded; duplicates merge
  useEffect(() => { if (cat) setGames((gs) => dedupeGames(cat, gs)); }, [cat]);

  const patch = (i: number, p: Partial<Game>) => setGames((gs) => gs.map((g, j) => (j === i ? { ...g, ...p } : g)));
  const num = (v: string) => (v === '' ? undefined : Number(v));

  async function save() {
    const clean = games.filter((g) => g.name.trim()).map((g) => ({
      name: g.name.trim(),
      ...(g.playtime_hours != null ? { playtime_hours: g.playtime_hours } : {}),
      ...(g.rank ? { rank: g.rank } : {}),
      ...(g.extra && Object.keys(g.extra).length ? { extra: g.extra } : {}),
    }));
    const b = await api<Bio>(`${base}/bio`, { method: 'PUT', body: { gaming: { games: clean, platforms, modes, goals, availability, tags, steam_url: steam.trim() || null }, preferences: { gaming: prefs } } });
    setGames(b.gaming.games);                                     // show what the server stored (official names, no duplicates)
    onSaved(b);
    await refresh();
  }

  return (
    <div className="card stack">
      <h3>Games</h3>
      {games.map((g, i) => {
        const entry = cat?.find(g.name);
        const ladder = entry?.ranks;
        const taken = games.filter((_, j) => j !== i).map((x) => cat?.key(x.name) ?? x.name.toLowerCase());
        return (
          <div className="game-row-wrap" key={i}>
            <GameThumb name={g.name} />
            <div className="game-row">
              <label>Game<GamePicker value={g.name} taken={taken} onChange={(v) => { if (v !== g.name) patch(i, { name: v, rank: undefined, extra: undefined }); }} /></label>
              <label>Playtime (hours)<input type="number" min={0} max={100000} value={g.playtime_hours ?? ''} onChange={(e) => patch(i, { playtime_hours: num(e.target.value) })} /></label>
              <label>Rank / level
                {ladder ? (
                  <select value={g.rank ?? ''} onChange={(e) => patch(i, { rank: e.target.value || undefined })}>
                    <option value="">Not set</option>{ladder.map((r) => <option key={r}>{r}</option>)}
                  </select>
                ) : <input value={g.rank ?? ''} maxLength={40} onChange={(e) => patch(i, { rank: e.target.value || undefined })} />}
              </label>
              {(EXTRA_FIELDS[entry?.name ?? g.name] ?? []).map((f) => (
                <label key={f.key}>{f.label}
                  <input type="number" min={f.min} max={f.max} value={g.extra?.[f.key] ?? ''} onChange={(e) => {
                    const extra = { ...g.extra }; const v = num(e.target.value);
                    if (v === undefined) delete extra[f.key]; else extra[f.key] = v;
                    patch(i, { extra });
                  }} />
                </label>
              ))}
              <button type="button" className="btn ghost" onClick={() => setGames(games.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
        );
      })}
      {games.length < 15 && <button type="button" className="btn ghost" onClick={() => setGames([...games, { name: '' }])}>+ Add game</button>}
      <small className="muted">Search over {cat ? cat.games.length : '80+'} popular games, or type any other game. Every field except the game name is optional.</small>

      <h3>Platforms</h3><ChipSelect options={PLATFORMS} value={platforms} onChange={setPlatforms} />
      <h3>Preferred modes</h3><ChipSelect options={MODES} value={modes} onChange={setModes} allowCustom />
      <h3>Gaming goals</h3><ChipSelect options={G_GOALS} value={goals} onChange={setGoals} allowCustom />
      <h3>Availability</h3><ChipSelect options={SLOTS} value={availability} onChange={setAvailability} label={pretty} />
      <h3>Tags</h3><ChipSelect options={G_TAGS} value={tags} onChange={setTags} />
      <label>Steam profile link (optional)<input value={steam} placeholder="https://steamcommunity.com/…" onChange={(e) => setSteam(e.target.value)} /></label>
      <h3>What matters most in a match</h3>
      <p className="muted small">Choose which data points count more or less when we rank people for you.</p>
      <Priorities factors={GAMING_FACTORS} value={prefs} onChange={setPrefs} />
      <SaveBar action={save} />
    </div>
  );
}
