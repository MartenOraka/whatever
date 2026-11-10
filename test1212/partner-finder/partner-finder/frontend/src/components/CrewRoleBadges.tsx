import { CREW_ROLES } from '../options';
import RoleIcon from './RoleIcons';

// The person's crew roles (Ideator, Gamer, Developer, Artist / Designer) as small icon pills.
export default function CrewRoleBadges({ roles }: { roles?: string[] }) {
  const items = CREW_ROLES.filter((r) => roles?.includes(r.key));
  if (!items.length) return null;
  return <div className="role-badges">{items.map((r) => <span key={r.key} className="role-badge" title={r.hint}><RoleIcon role={r.key} size={13} />{r.short}</span>)}</div>;
}
