import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import avatarRoutes, { AVATAR_DIR, BANNER_DIR, bannerRoutes } from './routes/avatar';
import gameRoutes from './routes/games';
import { ensureSchema } from './db/migrate';
import connectionRoutes from './routes/connections';
import meRoutes from './routes/me';
import recommendationRoutes from './routes/recommendations';
import requestRoutes from './routes/requests';
import userRoutes from './routes/users';
import { errorHandler } from './middleware/errors';
import { initSocket } from './socket';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Avatars and banners: random file names, served as images only.
const staticOpts = { index: false, dotfiles: 'deny' as const, setHeaders: (res: express.Response) => res.setHeader('X-Content-Type-Options', 'nosniff') };
app.use('/uploads/avatars', express.static(AVATAR_DIR, staticOpts));
app.use('/uploads/banners', express.static(BANNER_DIR, staticOpts));

app.use('/auth', authRoutes);
app.use('/me/avatar', avatarRoutes);
app.use('/me/banner', bannerRoutes);
app.use('/me', meRoutes);
app.use('/users', userRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/connections', connectionRoutes);
app.use('/requests', requestRoutes);
app.use('/chats', chatRoutes);
app.use('/games', gameRoutes);
app.use('/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
const server = http.createServer(app);
initSocket(server);                       // Socket.IO shares the same port
ensureSchema()
  .then(() => server.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((e) => { console.error('Database is not ready:', e.message); process.exit(1); });
