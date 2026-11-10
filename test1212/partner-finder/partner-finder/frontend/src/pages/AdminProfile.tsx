import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import BasicTab from '../components/BasicTab';
import CreativeTab from '../components/CreativeTab';
import GamingTab from '../components/GamingTab';
import { Bio, ProfileData } from '../types';

type Tab = 'basic' | 'gaming' | 'creative';
interface Identity { id: number; name: string; avatar_url: string | null; profile_completed: boolean }

// Edit ANY profile with the same editor people use for their own profile (the server lets admins act as that person).
export default function AdminProfile() {
  const { user } = useAuth();
  const id = Number(useParams().id);
  const nav = useNavigate();
  const base = `/admin/users/${id}`;
  const [tab, setTab] = useState<Tab>('basic');
  const [who, setWho] = useState<Identity | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [error, setError] = useState('');
  const [pw, setPw] = useState('');
  const [pwNote, setPwNote] = useState('');

  const loadIdentity = () => api<Identity>(base).then(setWho);
  useEffect(() => {
    Promise.all([api<Identity>(base), api<ProfileData>(`${base}/profile`), api<Bio>(`${base}/bio`)])
      .then(([w, p, b]) => { setWho(w); setProfile(p); setBio(b); })
      .catch(() => setError('This profile could not be loaded (it may have been deleted).'));
  }, [base]);

  if (!user?.is_admin) return <Navigate to="/" replace />;
  if (error) return <div className="stack"><div className="error">{error}</div><Link to="/admin">← Back to all profiles</Link></div>;
  if (!who || !profile || !bio) return <p className="muted">Loading…</p>;

  async function setPassword() {
    setPwNote('');
    try {
      const r = await api<{ temp_password?: string }>(`${base}/password`, { method: 'PUT', body: pw ? { password: pw } : {} });
      setPwNote(r.temp_password ? `New temporary password: ${r.temp_password}  (shown once, copy it now)` : 'Password changed.'); setPw('');
    } catch (e) { setPwNote(e instanceof ApiError ? e.message : 'Could not change the password'); }
  }
  async function remove() {
    if (!confirm(`Delete the profile "${who!.name}"? This cannot be undone.`)) return;
    try { await api(base, { method: 'DELETE' }); nav('/admin'); } catch (e) { setPwNote(e instanceof ApiError ? e.message : 'Could not delete'); }
  }

  return (
    <div className="stack admin-page">
      <Link to="/admin">← All profiles</Link>
      <div className="card admin-editing">
        <Avatar src={who.avatar_url} size={64} />
        <div className="grow"><span className="section-kicker">EDITING AS ADMIN</span><h1>{who.name}</h1>
          <span className={who.profile_completed ? 'status-pill ok' : 'status-pill'}>{who.profile_completed ? 'Complete: shown in recommendations' : 'Incomplete: needs bio, location and a game or skill'}</span></div>
      </div>
      <div className="page-tabs">
        {(['basic', 'gaming', 'creative'] as Tab[]).map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'basic' ? 'Basic info' : t === 'gaming' ? '🎮 Gaming' : '🎨 Creative'}</button>)}
      </div>
      <div hidden={tab !== 'basic'}><BasicTab base={base} identity={who} profile={profile} bio={bio} onSaved={(p, b) => { setProfile(p); setBio(b); loadIdentity(); }} /></div>
      <div hidden={tab !== 'gaming'}><GamingTab base={base} bio={bio} onSaved={(b) => { setBio(b); loadIdentity(); }} /></div>
      <div hidden={tab !== 'creative'}><CreativeTab base={base} bio={bio} onSaved={(b) => { setBio(b); loadIdentity(); }} /></div>

      <div className="card stack-sm">
        <h3>Login and removal</h3>
        <div className="row"><input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (empty = generate one)" autoComplete="off" /><button className="btn" onClick={setPassword}>Set password</button></div>
        {pwNote && <div className="toast">{pwNote}</div>}
        <div className="row"><button className="btn ghost danger" onClick={remove}>Delete this profile</button></div>
      </div>
    </div>
  );
}
