import bcrypt from "bcryptjs";
import { DDL } from "./ddl.mjs";

/**
 * Membuat tabel dan mengisi data awal jika database masih kosong.
 * @param {(sql: string, params?: unknown[]) => Promise<any[]>} query
 */
export async function bootstrap(query) {
  for (const stmt of DDL) await query(stmt);

  const [{ count }] = await query("SELECT COUNT(*)::int AS count FROM users");
  if (count > 0) return { seeded: false };

  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const adminHash = await bcrypt.hash(adminPass, 10);
  const memberHash = await bcrypt.hash("anggota123", 10);

  await query(
    `INSERT INTO users (name, email, password_hash, role, member_code)
     VALUES ($1,$2,$3,'admin',NULL), ($4,$5,$6,'member','AGT-0001')`,
    ["Administrator", "admin@perpustakaan.id", adminHash, "Anggota Demo", "anggota@perpustakaan.id", memberHash],
  );

  const cats = ["Fiksi", "Sains & Teknologi", "Sejarah", "Pengembangan Diri", "Bisnis", "Anak"];
  for (const c of cats) await query("INSERT INTO categories (name) VALUES ($1)", [c]);
  const catRows = await query("SELECT id, name FROM categories");
  const cat = Object.fromEntries(catRows.map((r) => [r.name, r.id]));

  const books = [
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
  ];
  for (const [isbn, title, author, publisher, year, c, shelf, copies] of books) {
    await query(
      `INSERT INTO books (isbn, title, author, publisher, year, category_id, shelf, total_copies, available_copies)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
      [isbn, title, author, publisher, year, cat[c], shelf, copies],
    );
  }
  return { seeded: true };
}
