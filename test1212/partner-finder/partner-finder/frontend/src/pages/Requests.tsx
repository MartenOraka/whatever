import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import UserLine, { useOpenChat } from '../components/UserLine';
import { PublicBio } from '../types';

interface Incoming { id: number; from_id: number; type: 'connect' | 'message'; message: string | null; created_at: string }
interface Outgoing { id: number; to_id: number; type: 'connect' | 'message'; message: string | null; created_at: string }
type Tab = 'incoming' | 'outgoing' | 'connections';

// One request I sent: who, what, "Pending", and a Cancel button. Shows Gaming and Creative details equally.
function OutgoingCard({ req, busy, onCancel }: { req: Outgoing; busy: boolean; onCancel: () => void }) {
  const [bio, setBio] = useState<PublicBio | null>(null);
  useEffect(() => { api<PublicBio>(`/users/${req.to_id}/bio`).then(setBio).catch(() => setBio(null)); }, [req.to_id]);
  const games = bio?.gaming.games.map((g) => g.name).slice(0, 3) ?? [];
  const skills = bio?.creative.skills.slice(0, 3) ?? [];
  return (
    <div className="card stack-sm request-card">
      <UserLine id={req.to_id}>
        <span className="pending-pill">⏳ Pending</span>
        <button className="btn ghost" disabled={busy} onClick={onCancel}>{busy ? 'Cancelling…' : 'Cancel request'}</button>
      </UserLine>
      <div className="request-meta">
        <span>{req.type === 'message' ? '✉ Message request' : '★ Connection request'}</span>
        <span>Sent {new Date(req.created_at).toLocaleDateString()}</span>
        {bio?.location.city && <span>⌖ {bio.location.city}</span>}
      </div>
      {req.message && <p className="quote">“{req.message}”</p>}
      {(games.length > 0 || skills.length > 0) && (
        <div className="chips compact-chips">
          {games.map((g) => <span key={'g' + g} className="chip static">🎮 {g}</span>)}
          {skills.map((s) => <span key={'s' + s} className="chip static">🎨 {s}</span>)}
        </div>
      )}
    </div>
  );
}

export default function Requests() {
  const [tab, setTab] = useState<Tab>('incoming');
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [conns, setConns] = useState<{ id: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const openChat = useOpenChat();

  const load = useCallback(async () => {
    try {
      const [i, o, c] = await Promise.all([api<Incoming[]>('/requests/incoming'), api<Outgoing[]>('/requests/outgoing'), api<{ id: number }[]>('/connections')]);
      setIncoming(i); setOutgoing(o); setConns(c); setError('');
    } catch { setError('Could not load your requests.'); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Something went wrong'); }
  };
  const answer = (id: number, action: 'accept' | 'decline') => run(() => api(`/requests/${id}/${action}`, { method: 'POST' }));
  const disconnect = (id: number) => { if (confirm('Disconnect from this person?')) run(() => api(`/connections/${id}`, { method: 'DELETE' })); };

  // Cancel = a real DELETE on the server. The card disappears as soon as the server confirms.
  async function cancel(id: number) {
    setCancelling(id); setError(''); setNotice('');
    try {
      await api(`/requests/${id}`, { method: 'DELETE' });
      setOutgoing((prev) => prev.filter((r) => r.id !== id));
      setNotice('Request cancelled.'); setTimeout(() => setNotice(''), 3000);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { setError('That request was already answered, so it cannot be cancelled any more.'); load(); }
      else setError(e instanceof ApiError ? e.message : 'Could not cancel the request');
    } finally { setCancelling(null); }
  }

  const list = (type: 'message' | 'connect') => incoming.filter((r) => r.type === type).map((r) => (
    <div className="card stack-sm" key={r.id}>
      <UserLine id={r.from_id}>
        <button className="btn primary" onClick={() => answer(r.id, 'accept')}>Accept</button>
        <button className="btn ghost" onClick={() => answer(r.id, 'decline')}>Decline</button>
      </UserLine>
      {r.message && <p className="quote">“{r.message}”</p>}
    </div>
  ));
  const messages = list('message'), connects = list('connect');

  const tabs: [Tab, string, number][] = [['incoming', 'Incoming', incoming.length], ['outgoing', 'Outgoing', outgoing.length], ['connections', 'Connections', conns.length]];

  return (
    <div className="stack">
      <h1>Requests</h1>
      <div className="page-tabs">
        {tabs.map(([key, label, count]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}{count > 0 && <span className="tab-count">{count}</span>}</button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      {notice && <div className="toast">{notice}</div>}
      {!loaded ? <p className="muted">Loading your requests…</p> : tab === 'incoming' ? (
        <>
          <h3>✉ Message requests</h3>
          {messages.length ? messages : <p className="muted">No message requests.</p>}
          <h3>★ Connection requests</h3>
          {connects.length ? connects : <p className="muted">No connection requests.</p>}
        </>
      ) : tab === 'outgoing' ? (
        <>
          <p className="muted small">Requests you sent that nobody has answered yet. Cancel one and it is removed completely.</p>
          {outgoing.length ? outgoing.map((r) => <OutgoingCard key={r.id} req={r} busy={cancelling === r.id} onCancel={() => cancel(r.id)} />)
            : <div className="card"><p className="muted">You have no pending requests. Find people on <Link to="/discover">Discover</Link>.</p></div>}
        </>
      ) : (
        conns.length ? conns.map((c) => (
          <div className="card" key={c.id}>
            <UserLine id={c.id}>
              <button className="btn" onClick={() => run(() => openChat(c.id))}>Chat</button>
              <button className="btn ghost" onClick={() => disconnect(c.id)}>Disconnect</button>
            </UserLine>
          </div>
        )) : <p className="muted">No connections yet. Send some “Interested” requests from Discover.</p>
      )}
    </div>
  );
}
