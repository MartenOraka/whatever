// Demo without a frontend: user1 and user75 (already connected) chat in real time.
// Run the server first (npm run dev), then in another terminal: npm run test:chat
import { io } from 'socket.io-client';

const API = 'http://localhost:4000';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function login(email: string): Promise<string> {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  return r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
}
const get = async (cookie: string, path: string) => (await fetch(API + path, { headers: { cookie } })).json();

async function main() {
  const c1 = await login('user1@example.com');
  const c75 = await login('user75@example.com');
  const conv = await get(c1, '/chats/with/75');
  console.log('conversation:', conv);

  const alice = io(API, { extraHeaders: { cookie: c1 } });
  const bob = io(API, { extraHeaders: { cookie: c75 } });
  bob.on('presence:snapshot', (d) => console.log('[bob] online contacts:', d.online));
  bob.on('typing', (d) => console.log('[bob] typing event:', d));
  bob.on('message:new', (d) => console.log('[bob] NEW MESSAGE:', d.message.body));
  await wait(800);

  alice.emit('typing', { conversationId: conv.id, typing: true });
  await wait(500);
  alice.emit('message:send', { conversationId: conv.id, body: 'Hello from the socket test!' }, (ack: unknown) => console.log('[alice] ack:', ack));
  alice.emit('typing', { conversationId: conv.id, typing: false });
  await wait(800);

  console.log('[bob] chat list:', await get(c75, '/chats'));
  bob.emit('chat:read', { conversationId: conv.id });
  await wait(500);
  console.log('[bob] unread after reading:', await get(c75, '/chats/unread'));
  console.log('[bob] history:', (await get(c75, `/chats/${conv.id}/messages?limit=5`)).messages.length, 'messages');

  bob.on('presence', (d) => console.log('[bob] presence event:', d));
  alice.disconnect();
  await wait(800);
  bob.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
