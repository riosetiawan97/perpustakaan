import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type DB = NeonDatabase<typeof schema>;

const g = globalThis as unknown as { __db?: Promise<DB> };

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    return drizzle(new Pool({ connectionString: url }), { schema });
  }
  // Tanpa DATABASE_URL: Postgres in-memory (PGlite) untuk development/demo.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { bootstrap } = await import("../../db/bootstrap.mjs");
  const client = new PGlite();
  await bootstrap(async (sql, params) => (await client.query(sql, params as unknown[])).rows as any[]);
  console.warn("[db] DATABASE_URL tidak diset — memakai database in-memory (data hilang saat restart).");
  return drizzlePglite(client, { schema }) as unknown as DB;
}

export function getDb(): Promise<DB> {
  g.__db ??= create();
  return g.__db;
}

export { schema };
