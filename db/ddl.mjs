// Skema database (idempoten: aman dijalankan berulang kali).
export const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
    member_code   TEXT UNIQUE,
    phone         TEXT,
    address       TEXT,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS books (
    id               SERIAL PRIMARY KEY,
    isbn             TEXT,
    title            TEXT NOT NULL,
    author           TEXT NOT NULL,
    publisher        TEXT,
    year             INTEGER,
    category_id      INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description      TEXT,
    shelf            TEXT,
    total_copies     INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS loans (
    id          SERIAL PRIMARY KEY,
    book_id     INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    borrowed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at      TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    fine        INTEGER NOT NULL DEFAULT 0,
    fine_paid   BOOLEAN NOT NULL DEFAULT FALSE
  )`,
  `CREATE INDEX IF NOT EXISTS loans_user_idx ON loans(user_id)`,
  `CREATE INDEX IF NOT EXISTS loans_active_idx ON loans(returned_at) WHERE returned_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS books_title_idx ON books(lower(title))`,
];
