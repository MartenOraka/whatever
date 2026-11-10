# QREW — PLAY. CODE. CREATE. AS A CREW.

Full-stack recommendation app that connects people for **gaming** and **creative** projects.
Users register, complete one unified profile (Gaming + Creative sections), get recommendations from our own
scoring algorithm, send connection / message requests, and chat in real time.

**Stack:** React + TypeScript (Vite) · Node.js + Express + TypeScript · PostgreSQL · Socket.IO · bcrypt + JWT.

## Setup

Requirements: Node.js 20+, Docker (or a local PostgreSQL).

```bash
# 1. database
docker run --name pf-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=partnerfinder -p 5432:5432 -d postgres:16

# 2. backend (http://localhost:4000)
cd backend
cp .env.example .env          # set JWT_SECRET to a long random string
npm install
npm run db:reset              # drops everything, creates the empty schema
npm run db:seed               # OPTIONAL separate step: 120 fictional users
npm run dev

# 3. frontend (http://localhost:5173)
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

Seed users: `user1@example.com` … `user120@example.com`, password `password123`.
Run `npm run db:reset` again to get an empty database; run `npm run db:seed` for many users.
Demo of real-time chat without a browser: `npm run test:chat` (backend folder).

## Usage guide
1. **Sign up**, then open **Profile** and fill in: about me, location (browser geolocation + max distance), and at least one game or creative skill.
2. **Discover**: switch Gaming / Creative. Each card shows why you match. *Interested* sends a connection request, *Message* sends a request with a first message, *Skip* removes the person forever.
3. **Requests**: accept or decline connection requests and (separately listed) message requests. Disconnect from connections here.
4. **Chats**: real-time messages, unread badge, typing indicator, online indicator, paginated history ("Load older messages").
5. Log out from the top bar on any page.

## Recommendation algorithm
Eligibility is decided in SQL: complete profile, not yourself, not dismissed, not connected, no earlier request, and inside **your** maximum distance (bounding box + Haversine distance in km).
Then each candidate gets a 0–100 score (data points in brackets):
- **Gaming:** shared games 35, rank similarity 15, playtime similarity 10, preferred modes 15, availability overlap 15, goals 10 (needs ≥ 1 shared game).
- **Creative:** interests 25, tools 20, role fit both ways 20, goals 15, skills 10, experience 10 (needs a shared interest or a role fit).
Candidates below the minimum score (40 gaming / 35 creative) are never shown, results are sorted strongest first, max 10.
Missing optional data scores neutral. Users can set every data point to *Less important / Normal / Very important* (Profile → Gaming / Creative → "What matters most in a match"); weights are rescaled so the score stays 0–100.
Proof on good/poor pairs without a database: `npm run demo:algorithm` (backend folder). Each card explains the match via `GET /recommendations/{id}/why`.

## API
Required: `/users/{id}`, `/users/{id}/profile`, `/users/{id}/bio`, `/me`, `/me/profile`, `/me/bio`, `/recommendations` (ids only, max 10), `/connections` (ids only).
Missing or forbidden profiles both return **404**. No response contains email or password data.
Extra: `/auth/*`, `/requests`, `/recommendations/{id}/skip|why`, `/chats*`, `/me/avatar`, `/users/{id}/status`, Socket.IO events (`message:send`, `message:new`, `typing`, `chat:read`, `presence`).

## Security
bcrypt (salted) passwords · JWT in httpOnly cookie · zod validation on every input · one central visibility check (`services/access.ts`) · chat access requires an active connection · avatar uploads checked by real file signature, random file names, 2 MB limit · only http(s) links are rendered.

## Bonus features
Online/offline indicator · typing indicator · proximity filter from browser coordinates with user-set radius · 👤 avatar placeholder · responsive layout (bottom navigation on phones).

## Known limitations
Distance uses plain SQL math (fine for hundreds of users; a PostGIS index would be the next step at scale).
Statuses of brand-new connections appear after the next page load.

## Round 4 additions

- **Outgoing requests:** Requests page has Incoming / Outgoing / Connections tabs. `DELETE /requests/{id}` cancels a request you sent (the row is deleted; only the sender, only while pending, so incoming requests and accepted connections are never affected).
- **Profile banner:** `PUT /me/banner` (multipart field `banner`, PNG/JPEG/WebP, max 4 MB) and `DELETE /me/banner`. The URL is returned as `banner_url` by `/me/profile` and `/users/{id}/profile`. Default banner is shown when none is set. Existing databases get the new column automatically at server start (`src/db/migrate.ts`).
- **Game artwork:** `GET /games/artwork?name=` resolves any game on Steam (exact title match, cached) and `GET /games/search?q=` powers game-name suggestions. No hard-coded game list; games without Steam artwork get a generated fallback tile.
- **Creative tool icons:** `frontend/src/toolIcons.ts` (Blender, Unreal Engine, Unity, Godot, DaVinci Resolve, Figma, Krita, Python, ... plus monogram badges for Photoshop, Premiere, After Effects, Illustrator, VS Code, FL Studio). Icon paths from Simple Icons (CC0).
- **Default avatar:** `frontend/src/components/DefaultAvatarIcon.tsx` is used everywhere a user has no photo, including the landing page.


## Round 5 additions (QREW branding, game library, profile management)

- **Branding:** the QREW logo (`frontend/public/brand/`) is used on every page through one component (`Logo`). Official slogan: `PLAY. CODE. CREATE. AS A CREW.` (`SLOGAN` in `frontend/src/config.ts`). The landing hero shows the four crew roles (lightbulb = Ideator, controller = Gamer, `</>` = Developer, palette = Artist / Designer).
- **Game library:** 80+ games in 10 categories (`backend/src/data/gameCatalog.ts`), served by `GET /games/catalog`. Each game has an official name, aliases (CS2, LoL, GTA V ...), Steam id, brand colour, glyph and rank ladder. Names are canonicalised and de-duplicated on save; matching uses the same canonical names. Artwork order: Steam cover, Steam header, branded fallback tile.
- **Profile fields:** `username`, `crew_roles` (ideator / gamer / developer / artist), `platforms`. New columns are added automatically at server start (`src/db/migrate.ts`).
- **Admin:** accounts listed in `ADMIN_EMAILS` (backend `.env`) get an Admin page: list/search profiles, create, edit (same editor as users, the server lets admins act as that profile), set password, delete. Endpoints: `GET/POST /admin/users`, `PUT /admin/users/{id}/password`, `DELETE /admin/users/{id}`, and `/admin/users/{id}/(profile|bio|avatar|banner)`. Everyone else gets 404.
- **Team seed:** `npm run db:seed:team` creates / updates real profiles from `backend/data/team-profiles.json` (see `backend/data/team-profiles.example.json`). Run it after `db:reset`.
- **Guide for beginners:** `docs/PROFILES-GUIDE.md`.
