import Link from "next/link";
import { asc, ilike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const { libraries, books, memberships } = schema;

export default async function Direktori({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const db = await getDb();
  const s = await getSession();
  const rows = await db
    .select({
      l: libraries,
      titles: sql<number>`(select count(*) from ${books} b where b.library_id = "libraries"."id")::int`,
      members: sql<number>`(select count(*) from ${memberships} m where m.library_id = "libraries"."id" and m.role = 'member')::int`,
    })
    .from(libraries)
    .where(q ? or(ilike(libraries.name, `%${q}%`), ilike(libraries.city, `%${q}%`)) : undefined)
    .orderBy(asc(libraries.name))
    .limit(60);

  return (
    <div>
      <section className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="mb-2 max-w-xl text-3xl font-bold leading-tight text-shelf sm:text-4xl">
            Temukan perpustakaan di sekitar Anda, atau buka perpustakaan sendiri.
          </h1>
          <p className="max-w-xl text-muted">
            Setiap perpustakaan punya katalog, petugas, dan anggotanya sendiri. Taman baca, perpustakaan sekolah, atau koleksi komunitas bisa mulai dalam satu menit.
          </p>
        </div>
        <Link href={s ? "/perpustakaan/baru" : "/daftar?next=/perpustakaan/baru"} className="btn-primary justify-self-start px-5 py-3 text-base">
          Daftarkan perpustakaan
        </Link>
      </section>

      <form className="mb-5 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Cari nama perpustakaan atau kota" className="field flex-1 py-3 text-base" aria-label="Cari perpustakaan" />
        <button className="btn-ghost px-5">Cari</button>
      </form>

      {rows.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="mb-3 text-muted">{q ? `Tidak ada perpustakaan yang cocok dengan "${q}".` : "Belum ada perpustakaan terdaftar."}</p>
          <Link href="/perpustakaan/baru" className="btn-ghost">Daftarkan yang pertama</Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ l, titles, members }) => (
            <li key={l.id}>
              <Link href={`/p/${l.slug}`} className="panel flex h-full flex-col gap-2 p-5 hover:border-shelf/40">
                <h2 className="text-lg font-bold leading-snug">{l.name}</h2>
                {l.city && <p className="-mt-1 text-sm text-muted">{l.city}</p>}
                {l.description && <p className="line-clamp-2 text-sm">{l.description}</p>}
                <p className="mt-auto pt-2 text-sm font-medium text-shelf">
                  {titles} judul buku · {members} anggota
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

