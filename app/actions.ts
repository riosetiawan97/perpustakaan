"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getLibrary, requireLibAdmin, requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { calcFine, dueDateFrom, nextCode, SLUG_RE, slugify } from "@/lib/rules";

const { users, libraries, memberships, categories, books, loans } = schema;

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Data tidak valid.";
/** Hanya izinkan redirect ke path internal. */
const safeNext = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : "");

/* ---------- Akun ---------- */

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  if (!email || !password) return { error: "Isi email dan password." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return { error: "Email atau password salah." };
  await createSession({ id: u.id, name: u.name });
  redirect(safeNext(str(f, "next")) || "/saya");
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
    .values({ name: d.name, email: d.email, phone: d.phone, passwordHash: await bcrypt.hash(d.password, 10) })
    .returning();
  await createSession({ id: u.id, name: u.name });
  redirect(safeNext(str(f, "next")) || "/saya");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function changePasswordAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireUser();
  const next = str(f, "next");
  if (next.length < 6) return { error: "Password baru minimal 6 karakter." };
  const db = await getDb();
  const [u] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  if (!u || !(await bcrypt.compare(str(f, "current"), u.passwordHash))) return { error: "Password saat ini salah." };
  await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, s.id));
  return { ok: "Password diperbarui." };
}

export async function updateProfileAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireUser();
  const name = str(f, "name");
  if (name.length < 2) return { error: "Nama minimal 2 karakter." };
  const db = await getDb();
  await db.update(users).set({ name, phone: str(f, "phone") || null, address: str(f, "address") || null }).where(eq(users.id, s.id));
  await createSession({ ...s, name });
  revalidatePath("/", "layout");
  return { ok: "Profil disimpan." };
}

/* ---------- Perpustakaan ---------- */

const RESERVED = new Set(["baru", "admin", "api", "login", "daftar"]);

const librarySchema = z.object({
  name: z.string().min(3, "Nama perpustakaan minimal 3 karakter.").max(80),
  city: z.string().max(60).optional(),
  address: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

export async function createLibraryAction(_: FormState, f: FormData): Promise<FormState> {
  const s = await requireUser("/perpustakaan/baru");
  const parsed = librarySchema.safeParse({
    name: str(f, "name"),
    city: str(f, "city") || undefined,
    address: str(f, "address") || undefined,
    description: str(f, "description") || undefined,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const slug = slugify(str(f, "slug") || parsed.data.name);
  if (!SLUG_RE.test(slug) || RESERVED.has(slug)) {
    return { error: "Alamat halaman harus 3–40 karakter: huruf kecil, angka, dan tanda hubung." };
  }
  const db = await getDb();
  const [taken] = await db.select({ id: libraries.id }).from(libraries).where(eq(libraries.slug, slug)).limit(1);
  if (taken) return { error: `Alamat /p/${slug} sudah dipakai. Coba alamat lain.` };

  await db.transaction(async (tx) => {
    const [lib] = await tx.insert(libraries).values({ ...parsed.data, slug }).returning({ id: libraries.id });
    await tx.insert(memberships).values({ libraryId: lib.id, userId: s.id, role: "admin", memberCode: "PTG-0001" });
    await tx.insert(categories).values(["Fiksi", "Nonfiksi", "Anak"].map((name) => ({ libraryId: lib.id, name })));
  });
  redirect(`/p/${slug}/admin?baru=1`);
}

const settingsSchema = librarySchema.extend({
  loanDays: z.coerce.number().int().min(1, "Lama pinjam minimal 1 hari.").max(365),
  maxLoans: z.coerce.number().int().min(1, "Batas pinjam minimal 1 buku.").max(100),
  finePerDay: z.coerce.number().int().min(0, "Denda tidak boleh negatif.").max(1_000_000),
  openJoin: z.boolean(),
});

export async function updateLibraryAction(_: FormState, f: FormData): Promise<FormState> {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const parsed = settingsSchema.safeParse({
    name: str(f, "name"),
    city: str(f, "city") || undefined,
    address: str(f, "address") || undefined,
    description: str(f, "description") || undefined,
    loanDays: str(f, "loanDays"),
    maxLoans: str(f, "maxLoans"),
    finePerDay: str(f, "finePerDay"),
    openJoin: f.get("openJoin") === "on",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  const db = await getDb();
  await db
    .update(libraries)
    .set({ ...d, city: d.city ?? null, address: d.address ?? null, description: d.description ?? null })
    .where(eq(libraries.id, library.id));
  revalidatePath(`/p/${library.slug}`, "layout");
  return { ok: "Pengaturan disimpan." };
}

async function addMembership(libraryId: number, userId: number, role: "admin" | "member") {
  const db = await getDb();
  const codes = await db.select({ c: memberships.memberCode }).from(memberships).where(eq(memberships.libraryId, libraryId));
  const code = nextCode(role === "admin" ? "PTG" : "AGT", codes.map((r) => r.c));
  await db.insert(memberships).values({ libraryId, userId, role, memberCode: code }).onConflictDoNothing();
}

export async function joinLibraryAction(f: FormData) {
  const slug = str(f, "slug");
  const { library, session, membership } = await getLibrary(slug);
  if (!session) redirect(`/login?next=/p/${slug}`);
  if (!membership && library.openJoin) await addMembership(library.id, session.id, "member");
  revalidatePath(`/p/${slug}`, "layout");
  redirect(`/p/${slug}/pinjaman`);
}

/* ---------- Buku ---------- */

const bookSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi."),
  author: z.string().min(1, "Penulis wajib diisi."),
  isbn: z.string().max(20).optional(),
  publisher: z.string().optional(),
  year: z.coerce.number().int().min(0).max(3000).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  newCategory: z.string().max(40).optional(),
  shelf: z.string().max(20).optional(),
  description: z.string().optional(),
  totalCopies: z.coerce.number().int().min(0, "Jumlah eksemplar tidak boleh negatif.").max(10000),
});

export async function saveBookAction(_: FormState, f: FormData): Promise<FormState> {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const opt = (k: string) => str(f, k) || undefined;
  const parsed = bookSchema.safeParse({
    title: str(f, "title"),
    author: str(f, "author"),
    isbn: opt("isbn"),
    publisher: opt("publisher"),
    year: opt("year"),
    categoryId: opt("categoryId"),
    newCategory: opt("newCategory"),
    shelf: opt("shelf"),
    description: opt("description"),
    totalCopies: str(f, "totalCopies") || "1",
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  const db = await getDb();

  let categoryId: number | null = null;
  if (d.newCategory) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.libraryId, library.id), sql`lower(${categories.name}) = lower(${d.newCategory})`))
      .limit(1);
    categoryId =
      existing?.id ??
      (await db.insert(categories).values({ libraryId: library.id, name: d.newCategory }).returning({ id: categories.id }))[0].id;
  } else if (d.categoryId) {
    const [own] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, d.categoryId), eq(categories.libraryId, library.id)))
      .limit(1);
    categoryId = own?.id ?? null;
  }

  const values = {
    title: d.title,
    author: d.author,
    isbn: d.isbn ?? null,
    publisher: d.publisher ?? null,
    year: d.year ?? null,
    categoryId,
    shelf: d.shelf ?? null,
    description: d.description ?? null,
  };
  const id = Number(f.get("id") || 0);
  if (id) {
    const [{ onLoan }] = await db
      .select({ onLoan: count() })
      .from(loans)
      .where(and(eq(loans.bookId, id), eq(loans.libraryId, library.id), isNull(loans.returnedAt)));
    if (d.totalCopies < onLoan) return { error: `Ada ${onLoan} eksemplar sedang dipinjam; jumlah tidak boleh kurang dari itu.` };
    const updated = await db
      .update(books)
      .set({ ...values, totalCopies: d.totalCopies, availableCopies: d.totalCopies - onLoan })
      .where(and(eq(books.id, id), eq(books.libraryId, library.id)))
      .returning({ id: books.id });
    if (!updated.length) return { error: "Buku tidak ditemukan di perpustakaan ini." };
  } else {
    await db.insert(books).values({ ...values, libraryId: library.id, totalCopies: d.totalCopies, availableCopies: d.totalCopies });
  }
  revalidatePath(`/p/${library.slug}`, "layout");
  redirect(`/p/${library.slug}/admin/buku`);
}

export async function deleteBookAction(f: FormData) {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const id = Number(f.get("id"));
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(loans).where(eq(loans.bookId, id));
  if (n > 0) redirect(`/p/${library.slug}/admin/buku/${id}?error=riwayat`);
  await db.delete(books).where(and(eq(books.id, id), eq(books.libraryId, library.id)));
  revalidatePath(`/p/${library.slug}`, "layout");
  redirect(`/p/${library.slug}/admin/buku`);
}

/* ---------- Sirkulasi ---------- */

export async function createLoanAction(_: FormState, f: FormData): Promise<FormState> {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const code = str(f, "member");
  const bookId = Number(f.get("bookId"));
  if (!code || !bookId) return { error: "Pilih anggota dan buku." };

  const db = await getDb();
  const [m] = await db
    .select({ userId: memberships.userId, active: memberships.active, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.libraryId, library.id),
        sql`(upper(${memberships.memberCode}) = upper(${code}) OR lower(${users.email}) = lower(${code}))`,
      ),
    )
    .limit(1);
  if (!m) return { error: `Anggota "${code}" tidak terdaftar di ${library.name}.` };
  if (!m.active) return { error: `${m.name} sedang dinonaktifkan.` };

  const [{ active }] = await db
    .select({ active: count() })
    .from(loans)
    .where(and(eq(loans.libraryId, library.id), eq(loans.userId, m.userId), isNull(loans.returnedAt)));
  if (active >= library.maxLoans) return { error: `${m.name} sudah meminjam ${active} buku (maksimal ${library.maxLoans}).` };

  const [{ unpaid }] = await db
    .select({ unpaid: sql<number>`coalesce(sum(${loans.fine}),0)::int` })
    .from(loans)
    .where(and(eq(loans.libraryId, library.id), eq(loans.userId, m.userId), eq(loans.finePaid, false)));
  if (unpaid > 0) return { error: `${m.name} masih punya denda belum dibayar.` };

  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const [b] = await tx
      .update(books)
      .set({ availableCopies: sql`${books.availableCopies} - 1` })
      .where(and(eq(books.id, bookId), eq(books.libraryId, library.id), sql`${books.availableCopies} > 0`))
      .returning({ title: books.title });
    if (!b) return null;
    await tx.insert(loans).values({ libraryId: library.id, bookId, userId: m.userId, borrowedAt: now, dueAt: dueDateFrom(now, library.loanDays) });
    return b;
  });
  if (!result) return { error: "Stok buku ini sedang habis." };
  revalidatePath(`/p/${library.slug}`, "layout");
  return { ok: `"${result.title}" dipinjamkan ke ${m.name}.` };
}

export async function returnLoanAction(f: FormData) {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const id = Number(f.get("id"));
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [loan] = await tx
      .select()
      .from(loans)
      .where(and(eq(loans.id, id), eq(loans.libraryId, library.id), isNull(loans.returnedAt)))
      .limit(1);
    if (!loan) return;
    const now = new Date();
    const fine = calcFine(loan.dueAt, now, library.finePerDay);
    await tx.update(loans).set({ returnedAt: now, fine, finePaid: fine === 0 }).where(eq(loans.id, id));
    await tx.update(books).set({ availableCopies: sql`${books.availableCopies} + 1` }).where(eq(books.id, loan.bookId));
  });
  revalidatePath(`/p/${library.slug}`, "layout");
}

export async function payFineAction(f: FormData) {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const db = await getDb();
  await db.update(loans).set({ finePaid: true }).where(and(eq(loans.id, Number(f.get("id"))), eq(loans.libraryId, library.id)));
  revalidatePath(`/p/${library.slug}`, "layout");
}

/* ---------- Anggota ---------- */

async function adminCount(libraryId: number) {
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(memberships)
    .where(and(eq(memberships.libraryId, libraryId), eq(memberships.role, "admin"), eq(memberships.active, true)));
  return n;
}

export async function toggleMemberAction(f: FormData) {
  const { library, session } = await requireLibAdmin(str(f, "slug"));
  const userId = Number(f.get("userId"));
  if (userId !== session.id) {
    const db = await getDb();
    await db
      .update(memberships)
      .set({ active: sql`NOT ${memberships.active}` })
      .where(and(eq(memberships.libraryId, library.id), eq(memberships.userId, userId)));
  }
  revalidatePath(`/p/${library.slug}/admin/anggota`);
}

export async function setRoleAction(f: FormData) {
  const { library, session } = await requireLibAdmin(str(f, "slug"));
  const userId = Number(f.get("userId"));
  const role = f.get("role") === "admin" ? "admin" : "member";
  if (role === "member" && userId === session.id && (await adminCount(library.id)) <= 1) {
    redirect(`/p/${library.slug}/admin/anggota?error=admin-terakhir`);
  }
  const db = await getDb();
  await db.update(memberships).set({ role }).where(and(eq(memberships.libraryId, library.id), eq(memberships.userId, userId)));
  revalidatePath(`/p/${library.slug}`, "layout");
  if (userId === session.id && role === "member") redirect(`/p/${library.slug}`);
}

export async function addMemberByEmailAction(_: FormState, f: FormData): Promise<FormState> {
  const { library } = await requireLibAdmin(str(f, "slug"));
  const email = str(f, "email").toLowerCase();
  const db = await getDb();
  const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);
  if (!u) return { error: `Belum ada akun dengan email ${email}. Minta orangnya mendaftar dulu.` };
  const [m] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.libraryId, library.id), eq(memberships.userId, u.id)))
    .limit(1);
  if (m) return { error: `${u.name} sudah terdaftar di perpustakaan ini.` };
  await addMembership(library.id, u.id, f.get("role") === "admin" ? "admin" : "member");
  revalidatePath(`/p/${library.slug}/admin/anggota`);
  return { ok: `${u.name} ditambahkan.` };
}
