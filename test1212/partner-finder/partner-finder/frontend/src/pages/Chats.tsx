import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import Avatar from '../components/Avatar';
import { useRealtime } from '../realtime';
import { UserBrief } from '../types';

interface ChatRow { id: number; user_id: number; last_message_at: string; last_body: string | null; last_sender_id: number | null; unread_count: number }
interface Msg { id: number; sender_id: number; body: string; created_at: string; read_at: string | null }
interface Page { messages: Msg[]; has_more: boolean; next_before: number | null }
const fmt = (iso: string) => new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

export default function Chats() {
  const { convId } = useParams();
  const active = convId ? Number(convId) : null;
  const { user } = useAuth();
  const { socket } = useRealtime();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [people, setPeople] = useState<Record<number, UserBrief>>({});
  const [loaded, setLoaded] = useState(false);

  const loadChats = useCallback(async () => {
    const rows = await api<ChatRow[]>('/chats');
    setChats(rows); setLoaded(true);
    const briefs = await Promise.all(rows.map((r) => api<UserBrief>(`/users/${r.user_id}`).catch(() => null)));
    setPeople((p) => { const n = { ...p }; briefs.forEach((b) => { if (b) n[b.id] = b; }); return n; });
  }, []);
  useEffect(() => { loadChats().catch(() => setLoaded(true)); }, [loadChats]);

  // Live updates of the chat list: new message -> preview, unread count, move to the top.
  useEffect(() => {
    if (!socket) return;
    const onNew = (d: { conversation_id: number; message: Msg }) => {
      setChats((prev) => {
        const i = prev.findIndex((c) => c.id === d.conversation_id);
        if (i < 0) { loadChats().catch(() => {}); return prev; }
        const c = prev[i];
        const fromOther = d.message.sender_id !== user!.id;
        const upd = { ...c, last_body: d.message.body, last_sender_id: d.message.sender_id, last_message_at: d.message.created_at,
          unread_count: fromOther && d.conversation_id !== active ? c.unread_count + 1 : c.unread_count };
        return [upd, ...prev.filter((_, j) => j !== i)];
      });
    };
    const onRead = (d: { conversation_id: number; reader_id: number }) => {
      if (d.reader_id === user!.id) setChats((prev) => prev.map((c) => (c.id === d.conversation_id ? { ...c, unread_count: 0 } : c)));
    };
    socket.on('message:new', onNew); socket.on('chat:read', onRead);
    return () => { socket.off('message:new', onNew); socket.off('chat:read', onRead); };
  }, [socket, user, active, loadChats]);

  const current = chats.find((c) => c.id === active);
  return (
    <div className={'chat-layout' + (active ? ' has-active' : '')}>
      <aside className="chat-list">
        <h1>Chats</h1>
        {loaded && !chats.length && <p className="muted">No chats yet. Accept a request, or open a connection and press Chat.</p>}
        {chats.map((c) => (
          <Link key={c.id} to={`/chats/${c.id}`} className={'chat-item' + (c.id === active ? ' on' : '')}>
            <Avatar src={people[c.user_id]?.avatar_url ?? null} size={42} />
            <div className="grow">
              <div className="row between"><strong>{people[c.user_id]?.name ?? `User ${c.user_id}`}</strong><span className="muted small">{fmt(c.last_message_at)}</span></div>
              <div className="row between"><span className="muted small clip">{c.last_body ? (c.last_sender_id === user!.id ? 'You: ' : '') + c.last_body : 'Say hello 👋'}</span>
                {c.unread_count > 0 && <span className="badge">{c.unread_count}</span>}</div>
            </div>
          </Link>
        ))}
      </aside>
      <section className="chat-pane card">
        {current ? <Conversation key={current.id} convId={current.id} peerId={current.user_id} />
          : <p className="muted">{active && loaded ? 'Chat not found.' : 'Select a chat to start talking.'}</p>}
      </section>
    </div>
  );
}

function Conversation({ convId, peerId }: { convId: number; peerId: number }) {
  const { user } = useAuth();
  const { socket, online, setActiveChat } = useRealtime();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [more, setMore] = useState(false);
  const [oldest, setOldest] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [peer, setPeer] = useState<UserBrief | null>(null);
  const [status, setStatus] = useState<{ online: boolean; last_seen: string | null } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const skipScroll = useRef(false);
  const hideTyping = useRef<number>();
  const stopTimer = useRef<number>();
  const lastSent = useRef(0);

  useEffect(() => {
    setActiveChat(convId);
    api<Page>(`/chats/${convId}/messages?limit=30`).then((r) => {
      setMsgs(r.messages); setMore(r.has_more); setOldest(r.next_before);
      socket?.emit('chat:read', { conversationId: convId });
    }).catch(() => setError('Could not load messages'));
    api<UserBrief>(`/users/${peerId}`).then(setPeer).catch(() => {});
    api<{ online: boolean; last_seen: string | null }>(`/users/${peerId}/status`).then(setStatus).catch(() => {});
    return () => setActiveChat(null);
  }, [convId, peerId, socket, setActiveChat]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (d: { conversation_id: number; message: Msg }) => {
      if (d.conversation_id !== convId) return;
      setMsgs((m) => (m.some((x) => x.id === d.message.id) ? m : [...m, d.message]));   // appears immediately
      if (d.message.sender_id !== user!.id) { setTyping(false); socket.emit('chat:read', { conversationId: convId }); }
    };
    const onTyping = (d: { conversation_id: number; user_id: number; typing: boolean }) => {
      if (d.conversation_id !== convId || d.user_id !== peerId) return;
      setTyping(d.typing);
      window.clearTimeout(hideTyping.current);
      if (d.typing) hideTyping.current = window.setTimeout(() => setTyping(false), 4000);   // safety: disappears on its own
    };
    const onRead = (d: { conversation_id: number; reader_id: number }) => {
      if (d.conversation_id === convId && d.reader_id !== user!.id)
        setMsgs((m) => m.map((x) => (x.sender_id === user!.id && !x.read_at ? { ...x, read_at: new Date().toISOString() } : x)));
    };
    socket.on('message:new', onNew); socket.on('typing', onTyping); socket.on('chat:read', onRead);
    return () => { socket.off('message:new', onNew); socket.off('typing', onTyping); socket.off('chat:read', onRead); };
  }, [socket, convId, peerId, user]);

  useEffect(() => {
    if (skipScroll.current) { skipScroll.current = false; return; }
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, typing]);

  async function loadOlder() {
    const r = await api<Page>(`/chats/${convId}/messages?limit=30&before=${oldest}`);
    skipScroll.current = true;
    setMsgs((m) => [...r.messages, ...m]); setMore(r.has_more); setOldest(r.next_before);
  }

  const stopTyping = () => { window.clearTimeout(stopTimer.current); lastSent.current = 0; socket?.emit('typing', { conversationId: convId, typing: false }); };
  function onInput(v: string) {
    setText(v);
    if (Date.now() - lastSent.current > 2000) { socket?.emit('typing', { conversationId: convId, typing: true }); lastSent.current = Date.now(); }
    window.clearTimeout(stopTimer.current);
    stopTimer.current = window.setTimeout(stopTyping, 2500);
  }
  function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !socket) return;
    setError('');
    socket.emit('message:send', { conversationId: convId, body }, (ack: { ok: boolean; error?: string }) => { if (!ack.ok) setError(ack.error ?? 'Could not send'); });
    setText(''); stopTyping();
  }

  const isOn = online[peerId] ?? status?.online ?? false;
  return (
    <>
      <div className="chat-head">
        <Link to="/chats" className="back">←</Link>
        <Avatar src={peer?.avatar_url ?? null} size={40} />
        <div>
          <Link to={`/u/${peerId}`}><strong>{peer?.name ?? `User ${peerId}`}</strong></Link><br />
          <span className="small muted">
            {typing ? '💬 typing…' : <><span className={'dot' + (isOn ? ' on' : '')} /> {isOn ? 'Online' : 'Offline'}</>}
          </span>
        </div>
      </div>
      <div className="messages">
        {more && <button className="btn ghost" onClick={loadOlder}>Load older messages</button>}
        {msgs.map((m) => {
          const mine = m.sender_id === user!.id;
          return (
            <div key={m.id} className={'bubble ' + (mine ? 'mine' : 'theirs')}>
              <div>{m.body}</div>
              <div className="stamp">{fmt(m.created_at)}{mine && m.read_at ? ' · Seen' : ''}</div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <div className="error">{error}</div>}
      <form className="composer" onSubmit={send}>
        <input value={text} onChange={(e) => onInput(e.target.value)} placeholder="Write a message…" maxLength={2000} autoFocus />
        <button className="btn primary" disabled={!text.trim()}>Send</button>
      </form>
    </>
  );
}
