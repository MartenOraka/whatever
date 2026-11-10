// The four crew roles, drawn in the same outlined style as the emblems on the hero hoodies.
export type CrewRole = 'ideator' | 'gamer' | 'developer' | 'artist';

const PATHS: Record<CrewRole, JSX.Element> = {
  ideator: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  gamer: <><path d="M7 8h10a4 4 0 0 1 4 4v2a3 3 0 0 1-5.2 2L14 14h-4l-1.8 2A3 3 0 0 1 3 14v-2a4 4 0 0 1 4-4z" /><path d="M8 11v3M6.5 12.5h3" /><circle cx="16" cy="11.5" r=".7" /><circle cx="18" cy="13.5" r=".7" /></>,
  developer: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" />,
  artist: <><path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.8 2-1.7 0-1.2-1-1.5-1-2.6 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14.5" cy="7.5" r="1" /></>,
};

export default function RoleIcon({ role, size = 18 }: { role: string; size?: number }) {
  const p = PATHS[role as CrewRole];
  if (!p) return null;
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>;
}
