import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "sesi";

export type Session = { id: number; name: string; role: "admin" | "member" };

function secret(): Uint8Array {
  // AUTH_SECRET disarankan diset di Vercel. Fallback: turunan dari DATABASE_URL.
  const base = process.env.AUTH_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "dev-secret-perpustakaan";
  return new Uint8Array(createHash("sha256").update(base).digest());
}

export async function createSession(s: Session) {
  const token = await new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
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

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: Number(payload.id), name: String(payload.name), role: payload.role === "admin" ? "admin" : "member" };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin(): Promise<Session> {
  const s = await requireUser();
  if (s.role !== "admin") redirect("/");
  return s;
}
