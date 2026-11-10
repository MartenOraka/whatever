import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useRealtime } from '../realtime';
import { UserBrief } from '../types';
import Avatar from './Avatar';

// Start or resume the (single) chat with a connected user, then open it.
export function useOpenChat() {
  const nav = useNavigate();
  return async (userId: number) => { const c = await api<{ id: number }>(`/chats/with/${userId}`); nav(`/chats/${c.id}`); };
}

// One row: avatar + name (+ online dot) linking to the profile, with action buttons on the right.
export default function UserLine({ id, children }: { id: number; children?: ReactNode }) {
  const [u, setU] = useState<UserBrief | null>(null);
  const { online } = useRealtime();
  useEffect(() => { api<UserBrief>(`/users/${id}`).then(setU).catch(() => setU(null)); }, [id]);
  return (
    <div className="userline">
      <Link to={`/u/${id}`} className="userline-main">
        <Avatar src={u?.avatar_url ?? null} size={44} />
        <span>{u?.name ?? `User ${id}`}</span>
        {online[id] && <span className="dot on" title="Online" />}
      </Link>
      <div className="row">{children}</div>
    </div>
  );
}
