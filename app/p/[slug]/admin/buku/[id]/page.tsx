import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { deleteBookAction } from "@/app/actions";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { BookForm } from "@/components/BookForm";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ubah buku" };

type P = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ error?: string }> };

export default async function UbahBuku({ params, searchParams }: P) {
  const { slug, id: rawId } = await params;
  const { library } = await requireLibAdmin(slug);
  const id = Number(rawId);
  const { error } = await searchParams;
  const db = await getDb();
  const [book] = await db.select().from(schema.books).where(and(eq(schema.books.id, id), eq(schema.books.libraryId, library.id)));
  if (!book) notFound();
  const cats = await db.select().from(schema.categories).where(eq(schema.categories.libraryId, library.id)).orderBy(asc(schema.categories.name));
  return (
    <div className="max-w-2xl">
      <Link href={`/p/${slug}/admin/buku`} className="mb-4 inline-block text-sm text-muted hover:text-ink">← Daftar buku</Link>
      <h1 className="mb-6 text-2xl font-bold text-shelf sm:text-3xl">Ubah buku</h1>
      {error === "riwayat" && (
        <div className="mb-4"><Notice kind="error">Buku ini punya riwayat peminjaman sehingga tidak bisa dihapus. Ubah jumlah eksemplar menjadi 0 jika sudah tidak tersedia.</Notice></div>
      )}
      <BookForm slug={slug} book={book} categories={cats} />
      <form action={deleteBookAction} className="mt-6">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="id" value={book.id} />
        <button className="btn-danger">Hapus buku</button>
      </form>
    </div>
  );
}
