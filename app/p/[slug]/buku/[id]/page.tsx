import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getLibrary } from "@/lib/auth";
import { spineColor } from "@/components/ui";
import { formatDate, formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";
const { books, categories, loans } = schema;

export default async function DetailBuku({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id: rawId } = await params;
  const id = Number(rawId);
  if (!id) notFound();
  const { library, isAdmin } = await getLibrary(slug);
  const db = await getDb();
  const [row] = await db
    .select({ b: books, cat: categories.name })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(and(eq(books.id, id), eq(books.libraryId, library.id)))
    .limit(1);
  if (!row) notFound();
  const { b, cat } = row;

  const nextBack =
    b.availableCopies === 0
      ? (await db.select({ dueAt: loans.dueAt }).from(loans).where(and(eq(loans.bookId, id), isNull(loans.returnedAt))).orderBy(asc(loans.dueAt)).limit(1))[0]
      : undefined;

  return (
    <div className="max-w-2xl">
      <Link href={`/p/${slug}`} className="mb-4 inline-block text-sm text-muted hover:text-ink">← Kembali ke katalog</Link>
      <article className="spine panel p-6" style={{ "--spine": spineColor(b.categoryId) } as React.CSSProperties}>
        <p className="mb-1 text-sm text-muted">{cat ?? "Tanpa kategori"}</p>
        <h1 className="mb-1 text-3xl font-bold leading-tight">{b.title}</h1>
        <p className="mb-6 text-lg text-muted">{b.author}</p>

        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Item k="Penerbit" v={b.publisher} />
          <Item k="Tahun terbit" v={b.year?.toString()} />
          <Item k="ISBN" v={b.isbn} />
          <Item k="Lokasi rak" v={b.shelf} />
          <Item k="Eksemplar" v={`${b.totalCopies}`} />
        </dl>

        {b.description && <p className="mb-6 max-w-prose leading-relaxed">{b.description}</p>}

        <div className={`rounded-md p-4 ${b.availableCopies > 0 ? "bg-shelf-soft" : "bg-late-soft"}`}>
          {b.availableCopies > 0 ? (
            <p className="font-semibold text-shelf">{b.availableCopies} eksemplar ada di rak dan bisa dipinjam.</p>
          ) : (
            <p className="font-semibold text-late">
              Semua eksemplar sedang dipinjam{nextBack ? `. Paling cepat kembali ${formatDate(nextBack.dueAt)}.` : "."}
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            Tunjukkan nomor anggota di meja sirkulasi {library.name}. Lama pinjam {library.loanDays} hari, denda {formatRupiah(library.finePerDay)} per hari terlambat.
          </p>
        </div>
        {isAdmin && <Link href={`/p/${slug}/admin/buku/${b.id}`} className="btn-ghost mt-4">Ubah data buku</Link>}
      </article>
    </div>
  );
}

function Item({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v || "—"}</dd>
    </div>
  );
}
