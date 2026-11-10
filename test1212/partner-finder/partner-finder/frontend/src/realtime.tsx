import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from './api';
import { useAuth } from './auth';
import { API_URL } from './config';

interface RT {
  socket: Socket | null;
  unread: number;                         // total unread messages (notification badge)
  online: Record<number, boolean>;        // live presence, filled by socket events
  refreshUnread: () => void;
  setActiveChat: (id: number | null) => void;
}
const Ctx = createContext<RT>({ socket: null, unread: 0, online: {}, refreshUnread: () => {}, setActiveChat: () => {} });
export const useRealtime = () => useContext(Ctx);

// One socket per logged-in user, shared by the whole app. No polling anywhere.
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const meId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState<Record<number, boolean>>({});
  const activeChat = useRef<number | null>(null);

  const refreshUnread = useCallback(() => { api<{ count: number }>('/chats/unread').then((r) => setUnread(r.count)).catch(() => {}); }, []);
  const setActiveChat = useCallback((id: number | null) => { activeChat.current = id; }, []);

  useEffect(() => {
    if (!meId) { setSocket(null); setUnread(0); setOnline({}); return; }
    const s = io(API_URL, { withCredentials: true });
    s.on('presence:snapshot', (d: { online: number[] }) => setOnline(Object.fromEntries(d.online.map((id) => [id, true]))));
    s.on('presence', (d: { user_id: number; online: boolean }) => setOnline((p) => ({ ...p, [d.user_id]: d.online })));
    s.on('message:new', (d: { conversation_id: number; message: { sender_id: number } }) => {
      if (d.message.sender_id !== meId && d.conversation_id !== activeChat.current) setUnread((u) => u + 1);
    });
    s.on('chat:read', (d: { reader_id: number }) => { if (d.reader_id === meId) refreshUnread(); });
    setSocket(s);
    refreshUnread();
    return () => { s.disconnect(); };
  }, [meId, refreshUnread]);

  return <Ctx.Provider value={{ socket, unread, online, refreshUnread, setActiveChat }}>{children}</Ctx.Provider>;
}
