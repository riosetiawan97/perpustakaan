// Dijalankan saat build di Vercel: membuat tabel & data awal di Postgres (Neon).
import { Pool } from "@neondatabase/serverless";
import { bootstrap } from "../db/bootstrap.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL tidak ada — dilewati (aplikasi memakai database in-memory).");
  process.exit(0);
}

const pool = new Pool({ connectionString: url });
try {
  const res = await bootstrap(async (sql, params) => (await pool.query(sql, params)).rows);
  console.log(`[migrate] selesai${res.seeded ? " + data awal dibuat" : ""}.`);
} catch (err) {
  console.error("[migrate] gagal:", err);
  process.exit(1);
} finally {
  await pool.end();
}
