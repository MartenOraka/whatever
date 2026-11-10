import { findToolIcon } from '../toolIcons';

const hueOf = (name: string) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
const luminance = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const initialsOf = (name: string) => name.trim().slice(0, 2).toUpperCase() || '?';

// Icon for one tool: official-style vector, or a monogram badge, or (unknown tools) a coloured initials badge.
export function ToolIcon({ name, size = 28 }: { name: string; size?: number }) {
  const def = findToolIcon(name);
  if (def?.path && def.hex) {
    const fill = luminance(def.hex) < 0.35 ? '#e8ecf8' : def.hex;      // very dark brand colours would vanish on the dark UI
    return <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={def.label} style={{ display: 'block' }}><path d={def.path} fill={fill} /></svg>;
  }
  if (def?.mono) return <span className="tool-mono" style={{ width: size, height: size, fontSize: size * 0.44, color: def.fg, background: def.bg }}>{def.mono}</span>;
  const hue = hueOf(name);
  return <span className="tool-mono" style={{ width: size, height: size, fontSize: size * 0.4, color: `hsl(${hue} 80% 80%)`, background: `hsl(${hue} 40% 22%)` }}>{initialsOf(name)}</span>;
}

function ToolTile({ name, compact }: { name: string; compact: boolean }) {
  const def = findToolIcon(name);
  const brand = def?.hex && luminance(def.hex) >= 0.35 ? def.hex : def?.fg ?? (def?.hex ? '#8fa0c8' : `hsl(${hueOf(name)} 60% 62%)`);
  return (
    <div className={'tool-tile' + (compact ? ' tool-tile-compact' : '')} style={{ '--accent': brand } as React.CSSProperties} title={def?.label ?? name}>
      <div className="tool-tile-icon"><ToolIcon name={name} size={compact ? 24 : 30} /></div>
      <strong>{def?.label ?? name}</strong>
    </div>
  );
}

// Creative software gets the same visual treatment as games.
export default function ToolArtwork({ tools, limit = 6, compact = false }: { tools: string[]; limit?: number; compact?: boolean }) {
  if (!tools.length) return null;
  return (
    <div className="pcard-section">
      <div className="section-label">TOOLS</div>
      <div className={'tool-art-grid' + (compact ? ' tool-art-grid-compact' : '')}>{tools.slice(0, limit).map((t) => <ToolTile key={t} name={t} compact={compact} />)}</div>
    </div>
  );
}
