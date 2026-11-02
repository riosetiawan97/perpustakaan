"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { calcFine, dueDateFrom, MAX_ACTIVE_LOANS } from "@/lib/rules";

const { users, books, loans } = schema;

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Data tidak valid.";

/* ---------- Autentikasi ---------- */

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  if (!email || !password) return { error: "Isi email dan password." };

  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return { error: "Email atau password salah." };
  if (!u.active) return { error: "Akun ini dinonaktifkan. Hubungi petugas perpustakaan." };

  await createSession({ id: u.id, name: u.name, role: u.role });
  redirect(u.role === "admin" ? "/admin" : "/");
}

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.email("Format email tidak valid."),
  phone: z.string().max(30).optional(),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export async function registerAction(_: FormState, f: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: str(f, "name"),
    email: str(f, "email").toLowerCase(),
    phone: str(f, "phone") || undefined,
    password: str(f, "password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;

  const db = await getDb();
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
  if (exists) return { error: "Email sudah terdaftar. Silakan masuk." };

  const [u] = await db
    .insert(users)
    .values({ name: d.name, email: d.email, phone: d.phone, passwordHash: await bcrypt.hash(d.password, 10), role: "member" })
    .returning();
  await db.update(users).set({ memberCode: `AGT-${String(u.id).padStart(4, "0")}` }).where(eq(users.id, u.id));

  await createSession({ id: u.id, name: u.name, role: "member" });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changePasswordAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireUser();
  const current = str(f, "current");
  const next = str(f, "next");
  if (next.length < 6) return { error: "Password baru minimal 6 karakter." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) return { error: "Password saat ini salah." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, s.id));
  return { ok: "Password diperbarui." };
}

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireUser();
  const name = str(f, "name");
  if (name.length < 2) return { error: "Nama minimal 2 karakter." };
  const db = await getDb();
  await db
    .update(users)
    .set({ name, phone: str(f, "phone") || null, address: str(f, "address") || null })
    .where(eq(users.id, s.id));
  await createSession({ ...s, name });
  revalidatePath("/", "layout");
  return { ok: "Profil disimpan." };
}

/* ---------- Buku ---------- */

const bookSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi."),
  author: z.string().min(1, "Penulis wajib diisi."),
  isbn: z.string().max(20).optional(),
  publisher: z.string().optional(),
  year: z.coerce.number().int().min(0).max(3000).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  shelf: z.string().max(20).optional(),
  description: z.string().optional(),
  totalCopies: z.coerce.number().int().min(0, "Jumlah eksemplar tidak boleh negatif.").max(10000),
});

export async function saveBookAction(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const opt = (k: string) => str(f, k) || undefined;
  const parsed = bookSchema.safeParse({
    title: str(f, "title"),
    author: str(f, "author"),
    isbn: opt("isbn"),
    publisher: opt("publisher"),
    year: opt("year"),
    categoryId: opt("categoryId"),
    shelf: opt("shelf"),
    description: opt("description"),
    totalCopies: str(f, "totalCopies") || "1",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  const values = {
    title: d.title,
    author: d.author,
    isbn: d.isbn ?? null,
    publisher: d.publisher ?? null,
    year: d.year ?? null,
    categoryId: d.categoryId ?? null,
    shelf: d.shelf ?? null,
    description: d.description ?? null,
  };

  const db = await getDb();
  const id = Number(f.get("id") || 0);
  if (id) {
    const [{ onLoan }] = await db
      .select({ onLoan: count() })
      .from(loans)
      .where(and(eq(loans.bookId, id), isNull(loans.returnedAt)));
    if (d.totalCopies < onLoan) return { error: `Ada ${onLoan} eksemplar sedang dipinjam; jumlah tidak boleh kurang dari itu.` };
    await db
      .update(books)
      .set({ ...values, totalCopies: d.totalCopies, availableCopies: d.totalCopies - onLoan })
      .where(eq(books.id, id));
  } else {
    await db.insert(books).values({ ...values, totalCopies: d.totalCopies, availableCopies: d.totalCopies });
  }
  revalidatePath("/admin/buku");
  revalidatePath("/");
  redirect("/admin/buku");
}

export async function deleteBookAction(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(loans).where(eq(loans.bookId, id));
  if (n > 0) redirect(`/admin/buku/${id}?error=riwayat`);
  await db.delete(books).where(eq(books.id, id));
  revalidatePath("/admin/buku");
  redirect("/admin/buku");
}

/* ---------- Sirkulasi ---------- */

export async function createLoanAction(_: FormState, f: FormData): Promise<FormState> {
  await requireAdmin();
  const code = str(f, "member").toUpperCase();
  const bookId = Number(f.get("bookId"));
  if (!code || !bookId) return { error: "Pilih anggota dan buku." };

  const db = await getDb();
  const [member] = await db
    .select()
    .from(users)
    .where(sql`upper(${users.memberCode}) = ${code} OR lower(${users.email}) = ${code.toLowerCase()}`)
    .limit(1);
  if (!member || member.role !== "member") return { error: `Anggota "${code}" tidak ditemukan.` };
  if (!member.active) return { error: `${member.name} sedang dinonaktifkan.` };

  const [{ active }] = await db
    .select({ active: count() })
    .from(loans)
    .where(and(eq(loans.userId, member.id), isNull(loans.returnedAt)));
  if (active >= MAX_ACTIVE_LOANS) return { error: `${member.name} sudah meminjam ${active} buku (maksimal ${MAX_ACTIVE_LOANS}).` };

  const [{ unpaid }] = await db
    .select({ unpaid: sql<number>`coalesce(sum(${loans.fine}),0)::int` })
    .from(loans)
    .where(and(eq(loans.userId, member.id), eq(loans.finePaid, false)));
  if (unpaid > 0) return { error: `${member.name} masih punya denda belum dibayar.` };

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [b] = await tx
      .update(books)
      .set({ availableCopies: sql`${books.availableCopies} - 1` })
      .where(and(eq(books.id, bookId), sql`${books.availableCopies} > 0`))
      .returning({ title: books.title });
    if (!b) return null;
    await tx.insert(loans).values({ bookId, userId: member.id, borrowedAt: now, dueAt: dueDateFrom(now) });
    return b;
  });
  if (!result) return { error: "Stok buku ini sedang habis." };

  revalidatePath("/admin", "layout");
  return { ok: `"${result.title}" dipinjamkan ke ${member.name}.` };
}

export async function returnLoanAction(f: FormData) {
  await requireAdmin();
  const id = Number(f.get("id"));
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [loan] = await tx.select().from(loans).where(and(eq(loans.id, id), isNull(loans.returnedAt))).limit(1);
    if (!loan) return;
    const now = new Date();
    const fine = calcFine(loan.dueAt, now);
    await tx.update(loans).set({ returnedAt: now, fine, finePaid: fine === 0 }).where(eq(loans.id, id));
    await tx.update(books).set({ availableCopies: sql`${books.availableCopies} + 1` }).where(eq(books.id, loan.bookId));
  });
  revalidatePath("/admin", "layout");
}

export async function payFineAction(f: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db.update(loans).set({ finePaid: true }).where(eq(loans.id, Number(f.get("id"))));
  revalidatePath("/admin", "layout");
}

/* ---------- Anggota ---------- */

export async function toggleMemberAction(f: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(users)
    .set({ active: sql`NOT ${users.active}` })
    .where(and(eq(users.id, Number(f.get("id"))), eq(users.role, "member")));
  revalidatePath("/admin/anggota");
}
