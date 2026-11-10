import { useId } from 'react';

// The default profile picture, used everywhere a user has no photo (and on the landing page).
// To use a different design, change only this file: every avatar in the app picks it up.
// bare = silhouette only, for placing on top of an existing gradient tile.
export default function DefaultAvatarIcon({ bare = false }: { bare?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="Default profile picture" focusable="false" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`${id}b`} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#9d7bff" /><stop offset="1" stopColor="#3f8fb0" /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="14" x2="0" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#ffffff" stopOpacity=".97" /><stop offset="1" stopColor="#d9e1ff" stopOpacity=".8" /></linearGradient>
        <clipPath id={`${id}c`}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      {!bare && <circle cx="32" cy="32" r="32" fill={`url(#${id}b)`} />}
      {!bare && <circle cx="32" cy="32" r="31.4" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth=".8" />}
      <g clipPath={bare ? undefined : `url(#${id}c)`}>
        <circle cx="32" cy="25" r="10.5" fill={`url(#${id}f)`} />
        <path d="M10 64c1.2-13.5 10.6-22.5 22-22.5S52.8 50.5 54 64z" fill={`url(#${id}f)`} />
      </g>
      <path d="M51 9l1.7 4.6L57.3 15.3l-4.6 1.7L51 21.6l-1.7-4.6-4.6-1.7 4.6-1.7z" fill="#8ff0ff" opacity=".92" />
    </svg>
  );
}
