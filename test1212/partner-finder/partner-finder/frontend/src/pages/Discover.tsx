import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import ProfileCard from '../components/ProfileCard';
import { CardData, Mode, ProfileData, PublicBio, UserBrief, Why } from '../types';

// The API is deliberately generic: /recommendations gives ids only, so we fetch
// each user's parts and combine them into one card object.
async function fetchCards(mode: Mode): Promise<CardData[]> {
  const ids = await api<{ id: number }[]>(`/recommendations?mode=${mode}`);
  return Promise.all(ids.map(async ({ id }) => {
    const [u, p, bio, why] = await Promise.all([
      api<UserBrief>(`/users/${id}`),
      api<ProfileData>(`/users/${id}/profile`),
      api<PublicBio>(`/users/${id}/bio`),
      api<Why>(`/recommendations/${id}/why?mode=${mode}`),
    ]);
    return { ...u, about: p.bio, username: p.username ?? null, crew_roles: p.crew_roles ?? [], banner_url: p.banner_url ?? null, bio, why };
  }));
}

export default function Discover() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('gaming');
  const [cards, setCards] = useState<CardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const latest = useRef(0);

  const load = useCallback(async (m: Mode) => {
    const req = ++latest.current;            // ignore stale responses when switching modes quickly
    setLoading(true); setError('');
    try {
      const list = await fetchCards(m);
      if (req !== latest.current) return;
      setCards(list); setTotal(list.length);
    } catch (e) {
      if (req !== latest.current) return;
      setCards([]); setError(e instanceof ApiError ? e.message : 'Could not load recommendations');
    } finally { if (req === latest.current) setLoading(false); }
  }, []);

  const completed = user?.profile_completed;
  useEffect(() => { if (completed) load(mode); else setLoading(false); }, [mode, completed, load]);

  if (!completed) {
    return (
      <div className="card warn">
        <h1>Almost there</h1>
        <p className="muted">Complete your profile to see recommendations and connect with people. <Link to="/profile/edit">Complete my profile →</Link></p>
      </div>
    );
  }

  const card = cards[0];

  async function act(kind: 'connect' | 'message' | 'skip') {
    if (!card) return;
    setBusy(true); setError('');
    let note = '';
    try {
      if (kind === 'skip') {
        await api(`/recommendations/${card.id}/skip`, { method: 'POST' });
        note = `Skipped ${card.name}`;
      } else {
        await api('/requests', { method: 'POST', body: { to: card.id, type: kind, message: kind === 'message' ? msg.trim() : undefined } });
        note = kind === 'connect' ? `Request sent to ${card.name}` : `Message request sent to ${card.name}`;
      }
    } catch (e) {
      if (!(e instanceof ApiError) || (e.status !== 409 && e.status !== 404)) {
        setError(e instanceof ApiError ? e.message : 'Something went wrong');
        setBusy(false);
        return;
      }
      note = e.status === 409 ? `You already have a request with ${card.name}` : 'That profile is no longer available';
    }
    setToast(note); setTimeout(() => setToast(''), 3000);
    setComposing(false); setMsg(''); setBusy(false);
    const rest = cards.slice(1);
    setCards(rest);
    if (rest.length === 0) load(mode);       // fetch the next batch of strong matches
  }

  const other: Mode = mode === 'gaming' ? 'creative' : 'gaming';

  return (
    <div className="stack">
      <div className="row between">
        <h1>Discover</h1>
        <div className="page-tabs">
          <button className={mode === 'gaming' ? 'active' : ''} onClick={() => setMode('gaming')}>🎮 Gaming</button>
          <button className={mode === 'creative' ? 'active' : ''} onClick={() => setMode('creative')}>🎨 Creative</button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
      {error && <div className="error">{error}</div>}

      {loading ? <p className="muted">Finding your best matches…</p> : card ? (
        <div className="deck">
          <div className="muted small">{total - cards.length + 1} of {total} · strongest matches first</div>
          <ProfileCard key={card.id} card={card} mode={mode} />
          {composing ? (
            <div className="card stack-sm">
              <label>Your first message to {card.name}
                <textarea rows={3} maxLength={500} autoFocus value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Hi! I saw we both play…" />
              </label>
              <div className="row">
                <button className="btn primary" disabled={busy || !msg.trim()} onClick={() => act('message')}>Send message request</button>
                <button className="btn ghost" onClick={() => setComposing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="actions">
              <button className="btn" disabled={busy} onClick={() => act('skip')}>✕ Skip</button>
              <button className="btn" disabled={busy} onClick={() => setComposing(true)}>✉ Message</button>
              <button className="btn primary" disabled={busy} onClick={() => act('connect')}>★ Interested</button>
            </div>
          )}
        </div>
      ) : !error && (
        <div className="card empty">
          <div className="big-emoji">🔭</div>
          <h2>No strong matches right now</h2>
          <p className="muted">You have seen everyone who fits your profile and distance. Add more to your profile, or look at the other area. We only show people who genuinely match.</p>
          <div className="row center-row">
            <Link className="btn primary" to="/profile/edit">Expand my interests</Link>
            <button className="btn" onClick={() => setMode(other)}>Explore {other === 'gaming' ? 'Gaming' : 'Creative'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
