import Link from "next/link";
import { and, asc, eq, gt, ilike, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { spineColor } from "@/components/ui";

export const dynamic = "force-dynamic";

const { books, categories } = schema;

export default async function Katalog({ searchParams }: { searchParams: Promise<{ q?: string; k?: string; ada?: string }> }) {
  const { q = "", k = "", ada } = await searchParams;
  const db = await getDb();
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  const where: SQL[] = [];
  if (q) where.push(or(ilike(books.title, `%${q}%`), ilike(books.author, `%${q}%`), ilike(books.isbn, `%${q}%`))!);
  if (k) where.push(eq(books.categoryId, Number(k)));
  if (ada) where.push(gt(books.availableCopies, 0));
  const rows = await db
    .select({ b: books, cat: categories.name })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(books.title));

  const qs = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const m = { q, k, ada, ...p };
    Object.entries(m).forEach(([key, v]) => v && u.set(key, v));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="mb-1 text-3xl font-bold text-shelf sm:text-4xl">Cari di rak kami</h1>
        <p className="mb-4 text-muted">Telusuri judul, penulis, atau ISBN, lalu lihat apakah bukunya ada di rak.</p>
        <form className="flex gap-2" role="search">
          {k && <input type="hidden" name="k" value={k} />}
          <input name="q" defaultValue={q} placeholder="Contoh: Laskar Pelangi" className="field flex-1 py-3 text-base" aria-label="Kata kunci" />
          <button className="btn-primary px-5">Cari</button>
        </form>
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Kategori">
        <Chip href={qs({ k: undefined })} active={!k}>Semua</Chip>
        {cats.map((c) => (
          <Chip key={c.id} href={qs({ k: String(c.id) })} active={k === String(c.id)} color={spineColor(c.id)}>
            {c.name}
          </Chip>
        ))}
        <Chip href={qs({ ada: ada ? undefined : "1" })} active={!!ada}>Hanya yang tersedia</Chip>
      </div>

      {rows.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="mb-3 text-muted">Tidak ada buku yang cocok dengan pencarian ini.</p>
          <Link href="/" className="btn-ghost">Lihat semua buku</Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ b, cat }) => (
            <li key={b.id}>
              <Link
                href={`/buku/${b.id}`}
                className="spine panel flex h-full flex-col justify-between gap-3 p-4 hover:border-shelf/40"
                style={{ "--spine": spineColor(b.categoryId) } as React.CSSProperties}
              >
                <div>
                  <h2 className="text-lg font-bold leading-snug">{b.title}</h2>
                  <p className="text-sm text-muted">{b.author}{b.year ? `, ${b.year}` : ""}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{cat ?? "Tanpa kategori"}{b.shelf ? ` · Rak ${b.shelf}` : ""}</span>
                  {b.availableCopies > 0 ? (
                    <span className="font-semibold text-shelf">{b.availableCopies} dari {b.totalCopies} tersedia</span>
                  ) : (
                    <span className="font-semibold text-late">Sedang dipinjam semua</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

}

function Chip({ href, active, color, children }: { href: string; active: boolean; color?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
        active ? "border-shelf bg-shelf text-white" : "border-line bg-sheet text-ink hover:border-shelf/40"
      }`}
    >
      {color && <span className="h-3 w-1.5 rounded-sm" style={{ background: active ? "#fff" : color }} />}
      {children}
    </Link>
  );
}
