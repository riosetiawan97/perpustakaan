import bcrypt from "bcryptjs";
import { DDL, LEGACY_COLUMNS_SQL } from "./ddl.mjs";

/**
 * Membuat/memperbarui tabel, memindahkan data versi lama, lalu mengisi data contoh
 * bila database masih kosong.
 * @param {(sql: string, params?: unknown[]) => Promise<any[]>} query
 */
export async function bootstrap(query) {
  for (const stmt of DDL) await query(stmt);

  const [{ libs }] = await query("SELECT COUNT(*)::int AS libs FROM libraries");
  const [{ users }] = await query("SELECT COUNT(*)::int AS users FROM users");

  if (libs === 0 && users > 0) {
    await migrateSingleLibrary(query);
    return { migrated: true };
  }
  if (users === 0) {
    await seed(query);
    return { seeded: true };
  }
  return {};
}

/** Versi lama hanya punya satu perpustakaan: jadikan "perpustakaan-demo". */
async function migrateSingleLibrary(query) {
  const [lib] = await query(
    `INSERT INTO libraries (slug, name, city, description)
     VALUES ('perpustakaan-demo','Perpustakaan Demo','Jakarta','Perpustakaan contoh untuk mencoba aplikasi.')
     RETURNING id`,
  );
  await query("UPDATE categories SET library_id = $1 WHERE library_id IS NULL", [lib.id]);
  await query("UPDATE books SET library_id = $1 WHERE library_id IS NULL", [lib.id]);
  await query(
    "UPDATE loans l SET library_id = b.library_id FROM books b WHERE l.book_id = b.id AND l.library_id IS NULL",
  );
  const legacy = (await query(LEGACY_COLUMNS_SQL)).map((r) => r.column_name);
  if (legacy.length === 3) {
    await query(
      `INSERT INTO memberships (library_id, user_id, role, member_code, active)
       SELECT $1, id, role, COALESCE(member_code, 'PTG-' || LPAD(id::text, 4, '0')), active FROM users
       ON CONFLICT DO NOTHING`,
      [lib.id],
    );
  }
  await dropLegacyUserColumns(query);

  const [exists] = await query("SELECT id FROM users WHERE email = 'melati@perpustakaan.id'");
  if (!exists) {
    const melati = await addUser(query, "Petugas Melati", "melati@perpustakaan.id", "melati123");
    const tbm = await seedMelati(query, melati);
    const [anggota] = await query("SELECT id FROM users WHERE email = 'anggota@perpustakaan.id'");
    if (anggota) await member(query, tbm, anggota.id, "member", "AGT-0001");
  }
}

async function dropLegacyUserColumns(query) {
  for (const c of ["role", "member_code", "active"]) await query(`ALTER TABLE users DROP COLUMN IF EXISTS ${c}`);
}

async function addUser(query, name, email, password) {
  const [u] = await query("INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id", [
    name,
    email,
    await bcrypt.hash(password, 10),
  ]);
  return u.id;
}

async function addLibrary(query, lib, cats, books) {
  const [l] = await query(
    `INSERT INTO libraries (slug, name, city, address, description, loan_days, max_loans, fine_per_day)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [lib.slug, lib.name, lib.city, lib.address, lib.description, lib.loanDays ?? 7, lib.maxLoans ?? 3, lib.fine ?? 1000],
  );
  const catId = {};
  for (const c of cats) {
    const [row] = await query("INSERT INTO categories (library_id, name) VALUES ($1,$2) RETURNING id", [l.id, c]);
    catId[c] = row.id;
  }
  for (const [isbn, title, author, publisher, year, c, shelf, copies] of books) {
    await query(
      `INSERT INTO books (library_id, isbn, title, author, publisher, year, category_id, shelf, total_copies, available_copies)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
      [l.id, isbn, title, author, publisher, year, catId[c], shelf, copies],
    );
  }
  return l.id;
}

const member = (query, libraryId, userId, role, code) =>
  query("INSERT INTO memberships (library_id, user_id, role, member_code) VALUES ($1,$2,$3,$4)", [libraryId, userId, role, code]);

async function seed(query) {
  await dropLegacyUserColumns(query);
  const admin = await addUser(query, "Administrator", "admin@perpustakaan.id", process.env.ADMIN_PASSWORD || "admin123");
  const anggota = await addUser(query, "Anggota Demo", "anggota@perpustakaan.id", "anggota123");
  const melati = await addUser(query, "Petugas Melati", "melati@perpustakaan.id", "melati123");

  const demo = await addLibrary(
    query,
    {
      slug: "perpustakaan-demo",
      name: "Perpustakaan Demo",
      city: "Jakarta",
      address: "Jl. Merdeka No. 1",
      description: "Perpustakaan contoh untuk mencoba aplikasi.",
    },
    ["Fiksi", "Sains & Teknologi", "Sejarah", "Pengembangan Diri", "Bisnis", "Anak"],
    [
      ["9789793062792", "Laskar Pelangi", "Andrea Hirata", "Bentang Pustaka", 2005, "Fiksi", "A1", 3],
      ["9789799731234", "Bumi Manusia", "Pramoedya Ananta Toer", "Lentera Dipantara", 1980, "Fiksi", "A1", 2],
      ["9786020324784", "Pulang", "Tere Liye", "Republika", 2015, "Fiksi", "A2", 2],
      ["9786024246945", "Filosofi Teras", "Henry Manampiring", "Kompas", 2018, "Pengembangan Diri", "B1", 3],
      ["9780132350884", "Clean Code", "Robert C. Martin", "Prentice Hall", 2008, "Sains & Teknologi", "C1", 2],
      ["9780201616224", "The Pragmatic Programmer", "Andrew Hunt & David Thomas", "Addison-Wesley", 1999, "Sains & Teknologi", "C1", 1],
      ["9780553380163", "A Brief History of Time", "Stephen Hawking", "Bantam", 1988, "Sains & Teknologi", "C2", 2],
      ["9786024246952", "Sapiens", "Yuval Noah Harari", "KPG", 2011, "Sejarah", "D1", 2],
      ["9789794338797", "Sejarah Indonesia Modern", "M.C. Ricklefs", "Serambi", 2008, "Sejarah", "D1", 1],
      ["9786020633176", "Atomic Habits", "James Clear", "Gramedia", 2018, "Pengembangan Diri", "B1", 3],
      ["9780307887894", "The Lean Startup", "Eric Ries", "Crown Business", 2011, "Bisnis", "E1", 1],
      ["9789792248616", "Si Kancil dan Buaya", "Tim Cerita Rakyat", "Gramedia", 2010, "Anak", "F1", 4],
    ],
  );
  const tbm = await seedMelati(query, melati);
  await member(query, demo, admin, "admin", "PTG-0001");
  await member(query, demo, anggota, "member", "AGT-0001");
  await member(query, tbm, anggota, "member", "AGT-0001");
}

/** Perpustakaan contoh kedua, untuk menunjukkan data antar perpustakaan terpisah. */
async function seedMelati(query, adminUserId) {
  const tbm = await addLibrary(
    query,
    {
      slug: "taman-baca-melati",
      name: "Taman Baca Melati",
      city: "Bekasi",
      address: "Gg. Melati 5, Cikarang",
      description: "Taman bacaan warga untuk anak dan remaja.",
      loanDays: 14,
      maxLoans: 2,
      fine: 500,
    },
    ["Anak", "Remaja"],
    [
      ["9789792248616", "Si Kancil dan Buaya", "Tim Cerita Rakyat", "Gramedia", 2010, "Anak", "R1", 2],
      ["9786020331607", "Dilan 1990", "Pidi Baiq", "Pastel Books", 2014, "Remaja", "R2", 1],
      ["9789790244252", "Ensiklopedia Hewan", "Tim Penulis", "Erlangga", 2016, "Anak", "R1", 1],
    ],
  );
  await member(query, tbm, adminUserId, "admin", "PTG-0001");
  return tbm;
}
