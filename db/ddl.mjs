// Skema database. Semua perintah idempoten: aman dijalankan berulang kali,
// termasuk di atas database versi lama (satu perpustakaan).
export const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone         TEXT,
    address       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS libraries (
    id           SERIAL PRIMARY KEY,
    slug         TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    city         TEXT,
    address      TEXT,
    description  TEXT,
    loan_days    INTEGER NOT NULL DEFAULT 7 CHECK (loan_days BETWEEN 1 AND 365),
    max_loans    INTEGER NOT NULL DEFAULT 3 CHECK (max_loans BETWEEN 1 AND 100),
    fine_per_day INTEGER NOT NULL DEFAULT 1000 CHECK (fine_per_day >= 0),
    open_join    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS memberships (
    id          SERIAL PRIMARY KEY,
    library_id  INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
    member_code TEXT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (library_id, user_id),
    UNIQUE (library_id, member_code)
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
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
  // Kolom kepemilikan perpustakaan (ditambahkan di versi multi-perpustakaan)
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE`,
  `ALTER TABLE books ADD COLUMN IF NOT EXISTS library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE`,
  `ALTER TABLE loans ADD COLUMN IF NOT EXISTS library_id INTEGER REFERENCES libraries(id) ON DELETE CASCADE`,
  `ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key`,
  `CREATE UNIQUE INDEX IF NOT EXISTS categories_lib_name_idx ON categories(library_id, lower(name))`,
  `CREATE INDEX IF NOT EXISTS books_lib_idx ON books(library_id)`,
  `CREATE INDEX IF NOT EXISTS loans_lib_idx ON loans(library_id)`,
  `CREATE INDEX IF NOT EXISTS loans_user_idx ON loans(user_id)`,
  `CREATE INDEX IF NOT EXISTS loans_active_idx ON loans(returned_at) WHERE returned_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id)`,
];

// Dijalankan setelah DDL bila masih ada data versi lama (tanpa library_id).
export const LEGACY_COLUMNS_SQL = `
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users' AND column_name IN ('role','member_code','active')`;
