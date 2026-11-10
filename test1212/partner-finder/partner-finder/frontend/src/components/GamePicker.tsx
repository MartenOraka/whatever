import { useEffect, useMemo, useRef, useState } from 'react';
import { CatalogGame, norm, useCatalog } from '../gameCatalog';
import { searchGames } from '../steam';
import { GameImage } from './GameArtwork';

interface Item { name: string; game?: CatalogGame }

// Game search box: type a name, an alias (CS2, LoL, GTA V ...) or browse the popular games.
// Library games come first, then other Steam games. Picking always stores the OFFICIAL name.
export default function GamePicker({ value, onChange, taken }: { value: string; onChange: (name: string) => void; taken: string[] }) {
  const cat = useCatalog();
  const box = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [steam, setSteam] = useState<string[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => setText(value), [value]);

  const q = norm(text);
  const items: Item[] = useMemo(() => {
    if (!cat) return [];
    const lib = (q ? cat.games.filter((g) => [g.name, ...(g.aliases ?? [])].some((l) => norm(l).includes(q))) : cat.games.slice(0, 12))
      .sort((a, b) => Number(!norm(a.name).startsWith(q)) - Number(!norm(b.name).startsWith(q))).slice(0, 8);
    const extra = steam.filter((n) => !cat.find(n)).map((name) => ({ name }));
    return [...lib.map((game) => ({ name: game.name, game })), ...extra].slice(0, 10);
  }, [cat, q, steam]);

  useEffect(() => {                                                       // other Steam games, only when the library has few matches
    if (!cat || q.length < 3 || items.filter((i) => i.game).length >= 4) { setSteam([]); return; }
    let live = true;
    const t = setTimeout(() => { searchGames(text.trim()).then((h) => { if (live) setSteam(h.map((x) => x.name)); }).catch(() => {}); }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [cat, q]);                                                           // eslint-disable-line react-hooks/exhaustive-deps

  const isTaken = (name: string) => !!cat && taken.includes(cat.key(name)) && cat.key(name) !== cat.key(value);
  function commit(name: string) {
    const official = cat?.find(name)?.name ?? name.trim();
    if (official && isTaken(official)) { setText(value); setOpen(false); setNote(`${official} is already in your list`); return; }   // never create a duplicate row
    setNote(''); setText(official); setOpen(false); setHi(0);
    if (official !== value) onChange(official);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter' && open) { e.preventDefault(); const it = items[hi]; if (it && !isTaken(it.name)) commit(it.name); else if (text.trim()) commit(text); }
  }

  return (
    <div className="picker" ref={box} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) { setOpen(false); if (text.trim() && text !== value) commit(text); } }}>
      <input value={text} maxLength={60} placeholder="Search games… (CS2, LoL, GTA V, Minecraft)" role="combobox" aria-expanded={open} aria-autocomplete="list"
        onFocus={() => { setOpen(true); setNote(''); }} onKeyDown={onKey} onChange={(e) => { setText(e.target.value); setOpen(true); setHi(0); }} />
      {note && <small className="picker-note">{note}</small>}
      {open && (
        <div className="picker-list" role="listbox">
          {!cat && <div className="picker-empty">Loading games…</div>}
          {cat && !q && <div className="picker-head">Popular games</div>}
          {cat && items.length === 0 && <div className="picker-empty">No match. Press Enter to add “{text.trim()}” as your own game.</div>}
          {items.map((it, i) => {
            const used = isTaken(it.name);
            return (
              <button type="button" key={it.name} role="option" aria-selected={i === hi} disabled={used} className={'picker-item' + (i === hi ? ' hi' : '')}
                onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => commit(it.name)}>
                <span className="picker-thumb"><GameImage name={it.name} /></span>
                <span className="picker-text"><strong>{it.name}</strong><small>{used ? 'Already in your list' : it.game ? `${it.game.category} · ${it.game.platforms.join(', ')}` : 'On Steam'}</small></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
