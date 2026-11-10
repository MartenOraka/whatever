-- Auth data lives ONLY here and is never returned by the API.
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic info + location + preferences
CREATE TABLE profiles (
  user_id    INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,                 -- display name
  username   TEXT,                          -- @handle, unique (case-insensitive), optional
  crew_roles TEXT[] NOT NULL DEFAULT '{}',  -- ideator | gamer | developer | artist
  bio        TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,                       -- NULL = show the default avatar icon
  banner_url TEXT,                       -- NULL = show the default banner
  links      TEXT[] NOT NULL DEFAULT '{}',
  city       TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  radius_km  INT NOT NULL DEFAULT 50 CHECK (radius_km BETWEEN 1 AND 20000),
  match_prefs JSONB NOT NULL DEFAULT '{}',   -- how much the user cares about each data point
  completed  BOOLEAN NOT NULL DEFAULT false,
  last_seen  TIMESTAMPTZ
);

-- games: [{ "name":"CS2", "playtime_hours":1200, "rank":"Gold Nova", "extra":{"faceit_level":6} }]
CREATE TABLE gaming_profiles (
  user_id      INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games        JSONB NOT NULL DEFAULT '[]',
  platforms    TEXT[] NOT NULL DEFAULT '{}',   -- PC, PlayStation, Xbox, ...
  modes        TEXT[] NOT NULL DEFAULT '{}',
  goals        TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT[] NOT NULL DEFAULT '{}',   -- e.g. 'weekday-evening', 'weekend-day'
  tags         TEXT[] NOT NULL DEFAULT '{}',
  steam_url    TEXT
);

CREATE TABLE creative_profiles (
  user_id    INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills     TEXT[] NOT NULL DEFAULT '{}',
  interests  TEXT[] NOT NULL DEFAULT '{}',
  tools      TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT,                              -- beginner | intermediate | advanced | professional
  roles      TEXT[] NOT NULL DEFAULT '{}',      -- roles the user WANTS from a collaborator
  goals      TEXT[] NOT NULL DEFAULT '{}',
  tags       TEXT[] NOT NULL DEFAULT '{}'
);

-- Permanent "Skip"
CREATE TABLE dismissals (
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dismissed_id)
);

-- "Interested" (connect) and "Message" requests
CREATE TABLE requests (
  id         SERIAL PRIMARY KEY,
  from_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('connect','message')),
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_id <> to_id)
);
CREATE UNIQUE INDEX one_pending_request ON requests (from_id, to_id) WHERE status = 'pending';

-- One row per connected pair; user_a < user_b keeps the pair unique
CREATE TABLE connections (
  user_a     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

-- One conversation per pair
CREATE TABLE conversations (
  id               SERIAL PRIMARY KEY,
  user_a           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);
CREATE INDEX messages_page_idx ON messages (conversation_id, id DESC);
CREATE INDEX profiles_geo_idx ON profiles (lat, lng);
CREATE UNIQUE INDEX profiles_username_key ON profiles (lower(username)) WHERE username IS NOT NULL;

-- The list last shown to a user, per mode. Used to decide "is this profile recommended to me?"
-- (profile access) and to explain WHY someone was recommended. Rewritten on every /recommendations call.
CREATE TABLE recommendations_shown (
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode      TEXT NOT NULL CHECK (mode IN ('gaming','creative')),
  score     INT NOT NULL,
  reasons   TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, target_id, mode)
);
