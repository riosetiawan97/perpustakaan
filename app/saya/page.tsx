import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Perpustakaan saya" };
const { libraries, memberships, loans } = schema;

export default async function Saya() {
  const s = await requireUser("/saya");
  const db = await getDb();
  const rows = await db
    .select({
      l: libraries,
      m: memberships,
      active: sql<number>`(select count(*) from ${loans} x where x.library_id = ${libraries.id} and x.user_id = ${s.id} and x.returned_at is null)::int`,
    })
    .from(memberships)
    .innerJoin(libraries, eq(libraries.id, memberships.libraryId))
    .where(eq(memberships.userId, s.id))
    .orderBy(asc(libraries.name));

  return (
    <div>
      <PageTitle title="Perpustakaan saya">
        <Link href="/perpustakaan/baru" className="btn-primary">Daftarkan perpustakaan</Link>
      </PageTitle>
      {rows.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="mb-4 text-muted">Anda belum bergabung dengan perpustakaan mana pun.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn-ghost">Cari perpustakaan</Link>
            <Link href="/perpustakaan/baru" className="btn-primary">Buka perpustakaan sendiri</Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ l, m, active }) => {
            const admin = m.role === "admin";
            return (
              <li key={l.id} className="panel flex flex-col gap-3 p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold leading-snug">{l.name}</h2>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${admin ? "bg-brass-soft text-[#6b4d10]" : "bg-shelf-soft text-shelf"}`}>
                      {admin ? "Petugas" : "Anggota"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{m.memberCode}{l.city ? ` · ${l.city}` : ""}{!m.active ? " · dinonaktifkan" : ""}</p>
                </div>
                <p className="text-sm">{active ? `${active} buku sedang Anda pinjam` : "Tidak ada buku yang sedang dipinjam"}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {admin && <Link href={`/p/${l.slug}/admin`} className="btn-primary">Kelola</Link>}
                  <Link href={`/p/${l.slug}`} className="btn-ghost">Katalog</Link>
                  <Link href={`/p/${l.slug}/pinjaman`} className="btn-ghost">Pinjaman</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
