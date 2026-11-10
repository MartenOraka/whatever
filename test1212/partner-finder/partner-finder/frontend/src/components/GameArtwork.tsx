import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { CatalogGame, useCatalog } from '../gameCatalog';
import { GAME_GLYPHS } from '../gameGlyphs';
import { steamImage, useSteamApp } from '../steam';
import { Game } from '../types';

const hueOf = (name: string) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
const initialsOf = (name: string) => {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
};

// The one consistent fallback tile: the game's brand colour + its glyph (or initials) + its name.
// Used for games without artwork, while artwork loads, and whenever an image fails.
export function GameFallback({ name, entry, loading = false }: { name: string; entry?: CatalogGame | null; loading?: boolean }) {
  const glyph = entry?.glyph ? GAME_GLYPHS[entry.glyph] : undefined;
  const tile = entry?.color ?? `hsl(${hueOf(name)} 62% 52%)`;
  return (
    <div className={'game-art-fallback game-brand-tile' + (loading ? ' is-loading' : '')} style={{ '--tile': tile, '--hue': hueOf(name) } as CSSProperties}>
      {glyph ? <svg className="game-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d={glyph.path} /></svg> : <span>{initialsOf(entry?.name ?? name)}</span>}
      <b>{entry?.name ?? name}</b>
    </div>
  );
}

// Artwork order: Steam cover -> Steam header -> branded tile.  Library games know their Steam id already;
// any other name is looked up on Steam (exact title only).
export function GameImage({ name }: { name: string }) {
  const cat = useCatalog();
  const entry = cat ? cat.find(name) : undefined;                      // undefined = library still loading
  const lookup = useSteamApp(cat && entry === null ? name : '');
  const appId = entry ? entry.steam ?? null : entry === null ? lookup : undefined;
  const [stage, setStage] = useState(0);
  useEffect(() => setStage(0), [appId]);
  if (appId === undefined) return <GameFallback name={name} entry={entry ?? null} loading />;
  const src = appId ? [steamImage(appId, 'library'), steamImage(appId, 'header')][stage] : undefined;
  return src ? <img src={src} alt={`${entry?.name ?? name} artwork`} loading="lazy" onError={() => setStage((s) => s + 1)} /> : <GameFallback name={name} entry={entry} />;
}

// Small cover next to a game in the profile editor. Waits for the user to stop typing before looking anything up.
export function GameThumb({ name }: { name: string }) {
  const [settled, setSettled] = useState(name.trim());
  useEffect(() => { const t = setTimeout(() => setSettled(name.trim()), 500); return () => clearTimeout(t); }, [name]);
  return <div className="game-thumb">{settled ? <GameImage name={settled} /> : <div className="game-thumb-empty">🎮</div>}</div>;
}

function GameTile({ game, index, compact = false }: { game: Game; index: number; compact?: boolean }) {
  const cat = useCatalog();
  const label = cat?.find(game.name)?.name ?? game.name;               // old "CS2" entries show the official name
  return (
    <div className={`game-art-tile ${compact ? 'game-art-compact' : ''} game-art-tone-${index % 4}`} title={label}>
      <GameImage name={game.name} />
      <div className="game-art-shade" />
      <div className="game-art-caption"><strong>{label}</strong>{game.rank && <small>{game.rank}</small>}</div>
    </div>
  );
}

export default function GameArtwork({ games, limit = 3, compact = false }: { games: Game[]; limit?: number; compact?: boolean }) {
  if (!games.length) return null;
  return <div className={`game-art-grid ${compact ? 'game-art-grid-compact' : ''}`}>{games.slice(0, limit).map((game, index) => <GameTile key={`${game.name}-${index}`} game={game} index={index} compact={compact} />)}</div>;
}
