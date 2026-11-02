import Link from "next/link";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { spineColor } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola buku" };
const { books, categories } = schema;

export default async function AdminBuku({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { slug } = await params;
  const { library } = await requireLibAdmin(slug);
  const { q = "" } = await searchParams;
  const db = await getDb();
  const rows = await db
    .select({ b: books, cat: categories.name })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(and(eq(books.libraryId, library.id), q ? or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`), ilike(books.isbn, `%${q}%`)) : undefined))
    .orderBy(asc(books.title));
  const base = `/p/${slug}/admin/buku`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-shelf sm:text-3xl">Buku</h1>
        <Link href={`${base}/baru`} className="btn-primary">Tambah buku</Link>
      </div>
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Cari judul, penulis, ISBN" className="field max-w-sm" aria-label="Cari buku" />
        <button className="btn-ghost">Cari</button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Judul</th><th className="hidden sm:table-cell">Kategori</th><th className="hidden md:table-cell">Rak</th><th className="text-right">Tersedia</th></tr>
          </thead>
          <tbody>
            {rows.map(({ b, cat }) => (
              <tr key={b.id}>
                <td>
                  <Link href={`${base}/${b.id}`} className="flex items-start gap-3 hover:underline">
                    <span className="mt-1 h-8 w-1.5 shrink-0 rounded-sm" style={{ background: spineColor(b.categoryId) }} />
                    <span><span className="font-medium">{b.title}</span><br /><span className="text-muted">{b.author}</span></span>
                  </Link>
                </td>
                <td className="hidden sm:table-cell">{cat ?? "—"}</td>
                <td className="hidden md:table-cell">{b.shelf ?? "—"}</td>
                <td className={`text-right font-semibold ${b.availableCopies ? "" : "text-late"}`}>{b.availableCopies}/{b.totalCopies}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-muted">{q ? "Tidak ada buku yang cocok." : "Belum ada buku. Tambahkan buku pertama dari tombol di atas."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
