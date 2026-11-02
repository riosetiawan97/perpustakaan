import Link from "next/link";
import { and, count, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";
import { daysLate } from "@/lib/rules";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ringkasan" };
const { books, users, loans } = schema;

export default async function AdminHome() {
  await requireAdmin();
  const db = await getDb();
  const now = new Date();

  const [[stock], [members], [onLoan], [late], [fines], overdue, recent] = await Promise.all([
    db.select({ titles: count(), copies: sql<number>`coalesce(sum(${books.totalCopies}),0)::int` }).from(books),
    db.select({ n: count() }).from(users).where(eq(users.role, "member")),
    db.select({ n: count() }).from(loans).where(isNull(loans.returnedAt)),
    db.select({ n: count() }).from(loans).where(and(isNull(loans.returnedAt), lt(loans.dueAt, now))),
    db.select({ n: sql<number>`coalesce(sum(${loans.fine}),0)::int` }).from(loans).where(eq(loans.finePaid, false)),
    db
      .select({ id: loans.id, dueAt: loans.dueAt, title: books.title, member: users.name, code: users.memberCode })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .where(and(isNull(loans.returnedAt), lt(loans.dueAt, now)))
      .orderBy(loans.dueAt)
      .limit(8),
    db
      .select({ id: loans.id, borrowedAt: loans.borrowedAt, returnedAt: loans.returnedAt, title: books.title, member: users.name })
      .from(loans)
      .innerJoin(books, eq(loans.bookId, books.id))
      .innerJoin(users, eq(loans.userId, users.id))
      .orderBy(desc(sql`coalesce(${loans.returnedAt}, ${loans.borrowedAt})`))
      .limit(8),
  ]);

  return (
    <div>
      <PageTitle title="Ringkasan hari ini">
        <Link href="/admin/peminjaman" className="btn-primary">Catat peminjaman</Link>
      </PageTitle>

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
