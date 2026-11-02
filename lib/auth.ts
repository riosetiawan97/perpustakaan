import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cache } from "react";
import { getDb, schema } from "./db";
import type { Library, Membership } from "./db/schema";

const COOKIE = "sesi";

export type Session = { id: number; name: string };

function secret(): Uint8Array {
  const base = process.env.AUTH_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "dev-secret-perpustakaan";
  return new Uint8Array(createHash("sha256").update(base).digest());
}

export async function createSession(s: Session) {
  const token = await new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: Number(payload.id), name: String(payload.name) };
  } catch {
    return null;
  }
});

export async function requireUser(next?: string): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return s;
}

export type LibraryContext = {
  library: Library;
  session: Session | null;
  membership: Membership | null;
  isAdmin: boolean;
};

/** Perpustakaan dari slug URL + keanggotaan pengguna yang sedang login di sana. */
export const getLibrary = cache(async (slug: string): Promise<LibraryContext> => {
  const db = await getDb();
  const [library] = await db.select().from(schema.libraries).where(eq(schema.libraries.slug, slug)).limit(1);
  if (!library) notFound();
  const session = await getSession();
  let membership: Membership | null = null;
  if (session) {
    [membership = null] = await db
      .select()
      .from(schema.memberships)
      .where(and(eq(schema.memberships.libraryId, library.id), eq(schema.memberships.userId, session.id)))
      .limit(1);
  }
  const isAdmin = !!membership && membership.active && membership.role === "admin";
  return { library, session, membership, isAdmin };
});

export async function requireMember(slug: string) {
  const ctx = await getLibrary(slug);
  if (!ctx.session) redirect(`/login?next=/p/${slug}/pinjaman`);
  return ctx as LibraryContext & { session: Session };
}

export async function requireLibAdmin(slug: string) {
  const ctx = await getLibrary(slug);
  if (!ctx.session) redirect(`/login?next=/p/${slug}/admin`);
  if (!ctx.isAdmin) redirect(`/p/${slug}`);
  return ctx as LibraryContext & { session: Session; membership: Membership };
}
