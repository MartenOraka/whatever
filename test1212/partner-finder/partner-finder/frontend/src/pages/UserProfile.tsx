import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import Avatar from '../components/Avatar';
import CrewRoleBadges from '../components/CrewRoleBadges';
import ProfileBanner from '../components/ProfileBanner';
import { CreativeDetails, GamingDetails } from '../components/ProfileCard';
import { useOpenChat } from '../components/UserLine';
import { useRealtime } from '../realtime';
import { ProfileData, PublicBio, UserBrief } from '../types';

interface Loaded { u: UserBrief; p: ProfileData; b: PublicBio; s: { online: boolean; last_seen: string | null }; connected: boolean }

export default function UserProfile() {
  const uid = Number(useParams().id);
  const { online } = useRealtime();
  const openChat = useOpenChat();
  const [data, setData] = useState<Loaded | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setData(null); setMissing(false);
    Promise.all([
      api<UserBrief>(`/users/${uid}`), api<ProfileData>(`/users/${uid}/profile`), api<PublicBio>(`/users/${uid}/bio`),
      api<Loaded['s']>(`/users/${uid}/status`), api<{ id: number }[]>('/connections'),
    ]).then(([u, p, b, s, c]) => setData({ u, p, b, s, connected: c.some((x) => x.id === uid) })).catch(() => setMissing(true));
  };
  useEffect(load, [uid]);

  // Wrong id and "not allowed to see" look the same on purpose (API answers 404 for both).
  if (missing) return <div className="card"><h1>Profile not found</h1><p className="muted">This profile does not exist or is not available to you.</p></div>;
  if (!data) return <p className="muted">Loading…</p>;

  const { u, p, b, s, connected } = data;
  const isOn = online[uid] ?? s.online;
  const safeLinks = p.links.filter((l) => /^https?:\/\//i.test(l));   // never render javascript: links

  async function disconnect() {
    if (!confirm('Disconnect from this person?')) return;
    try { await api(`/connections/${uid}`, { method: 'DELETE' }); load(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed'); }
  }

  return (
    <div className="stack deck">
      <div className="card pcard user-profile-card">
        <ProfileBanner src={p.banner_url ?? null} />
        <div className="pcard-content">
          <div className="pcard-head">
            <Avatar src={u.avatar_url} size={80} />
            <div className="grow pcard-identity">
              <h1>{u.name}</h1>{p.username && <span className="handle">@{p.username}</span>}
              <span className="muted">⌖ {b.location.city ?? 'Location not shared'}</span><br />
              <span className={isOn ? 'ok small' : 'muted small'}><span className={'dot' + (isOn ? ' on' : '')} /> {isOn ? 'Online' : s.last_seen ? `Last seen ${new Date(s.last_seen).toLocaleString()}` : 'Offline'}</span>
            </div>
          </div>
          <CrewRoleBadges roles={p.crew_roles} />
          {p.bio && <p className="pcard-about">{p.bio}</p>}
          {safeLinks.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer">{l}</a>)}
          {error && <div className="error">{error}</div>}
          {connected && (
            <div className="row">
              <button className="btn primary" onClick={() => openChat(uid).catch(() => setError('Could not open chat'))}>💬 Chat</button>
              <button className="btn ghost" onClick={disconnect}>Disconnect</button>
            </div>
          )}
        </div>
      </div>
      <div className="card pcard"><div className="pcard-content user-profile-section"><h3>🎮 Gaming</h3><GamingDetails g={b.gaming} /></div></div>
      <div className="card pcard"><div className="pcard-content user-profile-section"><h3>🎨 Creative</h3><CreativeDetails c={b.creative} /></div></div>
      <Link to="/requests">← Back</Link>
    </div>
  );
}
