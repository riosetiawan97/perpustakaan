import Link from "next/link";
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";
import { daysLate } from "@/lib/rules";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ringkasan" };
const { books, users, loans, memberships } = schema;

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ baru?: string }> };

export default async function AdminHome({ params, searchParams }: P) {
  const { slug } = await params;
  const { baru } = await searchParams;
  const { library } = await requireLibAdmin(slug);
  const db = await getDb();
  const now = new Date();
  const lib = library.id;
  const base = `/p/${slug}`;

  const [[stock], [members], [onLoan], [late], [fines], overdue, recent] = await Promise.all([
    db.select({ titles: count(), copies: sql<number>`coalesce(sum(${books.totalCopies}),0)::int` }).from(books).where(eq(books.libraryId, lib)),
    db.select({ n: count() }).from(memberships).where(and(eq(memberships.libraryId, lib), eq(memberships.role, "member"))),
    db.select({ n: count() }).from(loans).where(and(eq(loans.libraryId, lib), isNull(loans.returnedAt))),
    db.select({ n: count() }).from(loans).where(and(eq(loans.libraryId, lib), isNull(loans.returnedAt), lt(loans.dueAt, now))),
    db.select({ n: sql<number>`coalesce(sum(${loans.fine}),0)::int` }).from(loans).where(and(eq(loans.libraryId, lib), eq(loans.finePaid, false))),
    db
      .select({ id: loans.id, dueAt: loans.dueAt, title: books.title, member: users.name, code: memberships.memberCode })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .leftJoin(memberships, and(eq(memberships.userId, loans.userId), eq(memberships.libraryId, lib)))
      .where(and(eq(loans.libraryId, lib), isNull(loans.returnedAt), lt(loans.dueAt, now)))
      .orderBy(loans.dueAt)
      .limit(8),
    db
      .select({ id: loans.id, borrowedAt: loans.borrowedAt, returnedAt: loans.returnedAt, title: books.title, member: users.name })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .where(eq(loans.libraryId, lib))
      .orderBy(desc(sql`coalesce(${loans.returnedAt}, ${loans.borrowedAt})`))
      .limit(8),
  ]);

  return (
    <div>
      {baru && (
        <div className="mb-6">
          <Notice kind="ok">
            {library.name} sudah dibuat. Langkah berikutnya: <Link href={`${base}/admin/buku/baru`} className="font-semibold underline">tambahkan buku pertama</Link>, lalu bagikan alamat /p/{slug} ke calon anggota.
          </Notice>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-shelf sm:text-3xl">Ringkasan hari ini</h1>
        <Link href={`${base}/admin/peminjaman`} className="btn-primary">Catat peminjaman</Link>
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        <Stat k="Sedang dipinjam" v={onLoan.n} />
        <Stat k="Lewat jatuh tempo" v={late.n} tone={late.n ? "late" : undefined} />
        <Stat k="Anggota" v={members.n} />
        <Stat k="Koleksi" v={`${stock.titles} judul`} sub={`${stock.copies} eksemplar`} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold">Perlu ditagih</h2>
            {fines.n > 0 && <span className="text-sm text-late">Denda tertunggak {formatRupiah(fines.n)}</span>}
          </div>
          {overdue.length === 0 ? (
            <p className="panel p-5 text-muted">Tidak ada pinjaman yang terlambat.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {overdue.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{o.title}</p>
                    <p className="text-sm text-muted">{o.member} · {o.code}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-late">{daysLate(o.dueAt, now)} hari</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Aktivitas terakhir</h2>
          {recent.length === 0 ? (
            <p className="panel p-5 text-muted">Belum ada transaksi. Mulai dari menu Sirkulasi.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {recent.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">
                    {r.returnedAt ? `Dikembalikan ${r.member}, ${formatDate(r.returnedAt)}` : `Dipinjam ${r.member}, ${formatDate(r.borrowedAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ k, v, sub, tone }: { k: string; v: number | string; sub?: string; tone?: "late" }) {
  return (
    <div className="bg-sheet p-4">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className={`font-serif text-2xl font-bold ${tone === "late" ? "text-late" : "text-ink"}`}>{v}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </div>
  );
}
