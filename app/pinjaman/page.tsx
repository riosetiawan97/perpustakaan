import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";
import { calcFine, daysLate, loanStatus } from "@/lib/rules";
import { PageTitle, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pinjaman saya" };
const { loans, books, users } = schema;

export default async function PinjamanSaya() {
  const s = await requireUser();
  const db = await getDb();
  const [me] = await db.select({ code: users.memberCode }).from(users).where(eq(users.id, s.id));
  const rows = await db
    .select({ l: loans, title: books.title, author: books.author })
    .from(loans)
    .innerJoin(books, eq(loans.bookId, books.id))
    .where(eq(loans.userId, s.id))
    .orderBy(desc(loans.borrowedAt));

  const now = new Date();
  const active = rows.filter((r) => !r.l.returnedAt);
  const history = rows.filter((r) => r.l.returnedAt);
  const unpaid = rows.reduce((t, r) => t + (r.l.returnedAt && !r.l.finePaid ? r.l.fine : 0), 0);

  return (
    <div>
      <PageTitle title="Pinjaman saya">
        {me?.code && <span className="rounded-md border border-line bg-sheet px-3 py-1.5 text-sm">No. anggota <b>{me.code}</b></span>}
      </PageTitle>

      {unpaid > 0 && (
        <p className="mb-4 rounded-md bg-late-soft px-4 py-3 text-sm text-late">
          Denda belum dibayar: <b>{formatRupiah(unpaid)}</b>. Lunasi di meja sirkulasi agar bisa meminjam lagi.
        </p>
      )}

      <h2 className="mb-3 text-xl font-bold">Sedang dipinjam</h2>
      {active.length === 0 ? (
        <div className="panel mb-8 p-6 text-center text-muted">
          Belum ada buku yang Anda pinjam. <Link href="/" className="font-semibold text-shelf underline">Cari buku di katalog</Link>
        </div>
      ) : (
        <ul className="mb-8 grid gap-3 sm:grid-cols-2">
          {active.map(({ l, title, author }) => {
            const late = daysLate(l.dueAt, now);
            return (
              <li key={l.id} className="panel flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-serif text-lg font-bold leading-snug">{title}</p>
                  <p className="text-sm text-muted">{author}</p>
                  {late > 0 && <p className="mt-2 text-sm text-late">Terlambat {late} hari · denda berjalan {formatRupiah(calcFine(l.dueAt, now))}</p>}
                </div>
                <div className={`text-center ${late > 0 ? "text-late" : "text-shelf"}`}>
                  <p className="mb-1 text-xs text-muted">Kembali</p>
                  <span className="stamp text-sm">{formatDate(l.dueAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-3 text-xl font-bold">Riwayat</h2>
      {history.length === 0 ? (
        <p className="text-muted">Riwayat peminjaman akan muncul di sini.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead><tr><th>Buku</th><th>Dipinjam</th><th>Dikembalikan</th><th>Denda</th></tr></thead>
            <tbody>
              {history.map(({ l, title }) => (
                <tr key={l.id}>
                  <td className="font-medium">{title}</td>
                  <td>{formatDate(l.borrowedAt)}</td>
                  <td><StatusBadge status={loanStatus(l, now)} /> {formatDate(l.returnedAt)}</td>
                  <td>{l.fine ? `${formatRupiah(l.fine)}${l.finePaid ? " (lunas)" : ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
