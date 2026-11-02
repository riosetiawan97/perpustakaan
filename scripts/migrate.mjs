// Dijalankan saat build di Vercel: membuat/memperbarui tabel & data awal di Postgres (Neon).
// Seluruh proses berjalan dalam satu transaksi, jadi tidak pernah tertinggal setengah jalan.
import { Pool } from "@neondatabase/serverless";
import { bootstrap } from "../db/bootstrap.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL tidak ada — dilewati (aplikasi memakai database in-memory).");
  process.exit(0);
}

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const res = await bootstrap(async (sql, params) => (await client.query(sql, params)).rows);
  await client.query("COMMIT");
  console.log(`[migrate] selesai${res.seeded ? " + data awal dibuat" : ""}${res.migrated ? " + data lama dipindah ke perpustakaan-demo" : ""}.`);
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("[migrate] gagal, semua perubahan dibatalkan:", err);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
