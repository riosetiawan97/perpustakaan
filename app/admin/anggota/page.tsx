import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { toggleMemberAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anggota" };
const { users, loans } = schema;

export default async function Anggota({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = "" } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({
      u: users,
      active: sql<number>`count(${loans.id}) filter (where ${loans.returnedAt} is null)::int`,
      unpaid: sql<number>`coalesce(sum(${loans.fine}) filter (where ${loans.finePaid} = false),0)::int`,
    })
    .from(users)
    .leftJoin(loans, eq(loans.userId, users.id))
    .where(and(eq(users.role, "member"), q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`), ilike(users.memberCode, `%${q}%`)) : undefined))
    .groupBy(users.id)
    .orderBy(asc(users.name));

  return (
    <div>
      <PageTitle title="Anggota" />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Cari nama, email, no. anggota" className="field max-w-sm" aria-label="Cari anggota" />
        <button className="btn-ghost">Cari</button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Anggota</th><th className="hidden md:table-cell">Bergabung</th><th>Pinjaman</th><th>Denda</th><th className="text-right">Status</th></tr>
          </thead>
          <tbody>
            {rows.map(({ u, active, unpaid }) => (
              <tr key={u.id} className={u.active ? "" : "text-muted"}>
                <td><span className="font-medium">{u.name}</span><br /><span className="text-muted">{u.memberCode} · {u.email}</span></td>
                <td className="hidden md:table-cell">{formatDate(u.createdAt)}</td>
                <td>{active}</td>
                <td className={unpaid ? "font-semibold text-late" : ""}>{unpaid ? formatRupiah(unpaid) : "—"}</td>
                <td className="text-right">
                  <form action={toggleMemberAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className={u.active ? "btn-ghost px-3 py-1" : "btn-primary px-3 py-1"}>{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">Belum ada anggota. Anggota mendaftar sendiri lewat halaman Daftar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
