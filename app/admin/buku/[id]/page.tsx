import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { deleteBookAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { BookForm } from "@/components/BookForm";
import { Notice, PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ubah buku" };

export default async function UbahBuku({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const { error } = await searchParams;
  const db = await getDb();
  const [book] = await db.select().from(schema.books).where(eq(schema.books.id, id));
  if (!book) notFound();
  const cats = await db.select().from(schema.categories).orderBy(asc(schema.categories.name));
  return (
    <div className="max-w-2xl">
      <Link href="/admin/buku" className="mb-4 inline-block text-sm text-muted hover:text-ink">← Daftar buku</Link>
      <PageTitle title="Ubah buku" />
      {error === "riwayat" && (
        <div className="mb-4"><Notice kind="error">Buku ini punya riwayat peminjaman sehingga tidak bisa dihapus. Ubah jumlah eksemplar menjadi 0 jika sudah tidak tersedia.</Notice></div>
      )}
      <BookForm book={book} categories={cats} />
      <form action={deleteBookAction} className="mt-6">
        <input type="hidden" name="id" value={book.id} />
        <button className="btn-danger">Hapus buku</button>
      </form>
    </div>
  );
}
