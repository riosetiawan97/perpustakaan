import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull, asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { spineColor } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { FINE_PER_DAY, LOAN_DAYS } from "@/lib/rules";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";
const { books, categories, loans } = schema;

export default async function DetailBuku({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!id) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ b: books, cat: categories.name })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(eq(books.id, id))
    .limit(1);
  if (!row) notFound();
  const { b, cat } = row;
  const s = await getSession();

  const nextBack =
    b.availableCopies === 0
      ? (await db.select({ dueAt: loans.dueAt }).from(loans).where(and(eq(loans.bookId, id), isNull(loans.returnedAt))).orderBy(asc(loans.dueAt)).limit(1))[0]
      : undefined;

  return (
    <div className="max-w-2xl">
      <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-ink">← Kembali ke katalog</Link>
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
            Bawa kartu anggota ke meja sirkulasi. Lama pinjam {LOAN_DAYS} hari, denda {formatRupiah(FINE_PER_DAY)} per hari terlambat.
          </p>
        </div>
        {s?.role === "admin" && (
          <Link href={`/admin/buku/${b.id}`} className="btn-ghost mt-4">Ubah data buku</Link>
        )}
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
