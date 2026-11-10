import { useEffect, useId, useState } from 'react';
import { GAME_NAMES } from '../options';
import { searchGames } from '../steam';

// Game name field with live suggestions from Steam's catalogue (plus our few quick picks).
export default function GameNameInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const listId = useId();
  const [remote, setRemote] = useState<string[]>([]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setRemote([]); return; }
    let live = true;
    const t = setTimeout(() => { searchGames(q).then((hits) => { if (live) setRemote(hits.map((h) => h.name)); }).catch(() => {}); }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [value]);

  const q = value.trim().toLowerCase();
  const options = [...new Set([...remote, ...GAME_NAMES.filter((n) => n.toLowerCase().includes(q))])].slice(0, 12);
  return (
    <>
      <input list={listId} value={value} maxLength={60} placeholder="Start typing a game…" onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>{options.map((n) => <option key={n} value={n} />)}</datalist>
    </>
  );
}
