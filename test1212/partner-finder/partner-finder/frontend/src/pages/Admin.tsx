import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import CrewRoleBadges from '../components/CrewRoleBadges';

interface Row { id: number; email: string; nickname: string; username: string | null; avatar_url: string | null; city: string | null; completed: boolean; crew_roles: string[]; is_admin: boolean }

// Admin: all profiles in one place. Create a profile, open its editor, delete demo profiles.
export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: number; email: string; temp_password?: string } | null>(null);
  const [form, setForm] = useState({ email: '', nickname: '', username: '', password: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (query: string, offset = 0) => {
    setLoading(true);
    try {
      const r = await api<{ total: number; users: Row[] }>(`/admin/users?q=${encodeURIComponent(query)}&limit=30&offset=${offset}`);
      setRows((prev) => (offset ? [...prev, ...r.users] : r.users)); setTotal(r.total); setError('');
    } catch { setError('Could not load the profiles.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);

  if (!user?.is_admin) return <Navigate to="/" replace />;

  async function create(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setCreated(null);
    try {
      const r = await api<{ id: number; temp_password?: string }>('/admin/users', { method: 'POST', body: { email: form.email.trim(), nickname: form.nickname.trim(), username: form.username.trim().replace(/^@/, ''), ...(form.password ? { password: form.password } : {}) } });
      setCreated({ id: r.id, email: form.email.trim().toLowerCase(), temp_password: r.temp_password });
      setForm({ email: '', nickname: '', username: '', password: '' }); load(q);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not create the profile'); } finally { setBusy(false); }
  }
  async function remove(r: Row) {
    if (!confirm(`Delete the profile "${r.nickname}" (${r.email})? This also removes their requests, chats and pictures and cannot be undone.`)) return;
    try { await api(`/admin/users/${r.id}`, { method: 'DELETE' }); setRows((p) => p.filter((x) => x.id !== r.id)); setTotal((t) => t - 1); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not delete'); }
  }

  return (
    <div className="stack admin-page">
      <div><span className="section-kicker">ADMIN</span><h1>Profiles</h1>
        <p className="muted">Add yourself, your project partner and demo users. Each profile is a real account stored in the database.</p></div>

      <form className="card stack admin-create" onSubmit={create}>
        <h3>Add a profile</h3>
        <div className="grid-2">
          <label>E-mail (used to log in)<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="partner@example.com" /></label>
          <label>Display name<input required minLength={2} maxLength={30} value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Alex Kask" /></label>
          <label>Username (optional)<input value={form.username} maxLength={21} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="alexkask" autoCapitalize="none" /></label>
          <label>Password (optional)<input type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="empty = make one for me" autoComplete="off" /></label>
        </div>
        <small className="muted">Next step after creating: open the profile to add the picture, banner, bio, games and skills.</small>
        <div className="row"><button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create profile'}</button></div>
        {created && (
          <div className="toast admin-created">
            <strong>Profile created.</strong> {created.temp_password && <>Temporary password for <b>{created.email}</b>: <code>{created.temp_password}</code> (shown only once, copy it now). </>}
            <button type="button" className="btn" onClick={() => nav(`/admin/profiles/${created.id}`)}>Open the editor →</button>
          </div>
        )}
      </form>

      {error && <div className="error">{error}</div>}
      <div className="row between"><h3>{total} profile{total === 1 ? '' : 's'}</h3><input className="admin-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, @username or e-mail" /></div>
      <div className="stack-sm">
        {rows.map((r) => (
          <div className="card admin-row" key={r.id}>
            <Avatar src={r.avatar_url} size={46} />
            <div className="grow admin-row-main">
              <strong>{r.nickname}</strong>{r.username && <span className="handle">@{r.username}</span>}{r.is_admin && <span className="pending-pill">ADMIN</span>}
              <div className="muted small">{r.email}{r.city ? ` · ⌖ ${r.city}` : ''}</div>
              <CrewRoleBadges roles={r.crew_roles} />
            </div>
            <span className={r.completed ? 'status-pill ok' : 'status-pill'}>{r.completed ? 'Complete' : 'Incomplete'}</span>
            <div className="row"><Link className="btn" to={`/admin/profiles/${r.id}`}>Edit</Link><button className="btn ghost" onClick={() => remove(r)}>Delete</button></div>
          </div>
        ))}
        {!loading && rows.length === 0 && <div className="card"><p className="muted">No profiles match.</p></div>}
        {loading && <p className="muted">Loading…</p>}
        {!loading && rows.length < total && <button className="btn ghost" onClick={() => load(q, rows.length)}>Load more</button>}
      </div>
    </div>
  );
}
