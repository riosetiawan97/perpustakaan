import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { BookForm } from "@/components/BookForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tambah buku" };

export default async function BukuBaru({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { library } = await requireLibAdmin(slug);
  const db = await getDb();
  const cats = await db.select().from(schema.categories).where(eq(schema.categories.libraryId, library.id)).orderBy(asc(schema.categories.name));
  return (
    <div className="max-w-2xl">
      <Link href={`/p/${slug}/admin/buku`} className="mb-4 inline-block text-sm text-muted hover:text-ink">← Daftar buku</Link>
      <h1 className="mb-6 text-2xl font-bold text-shelf sm:text-3xl">Tambah buku</h1>
      <BookForm slug={slug} categories={cats} />
    </div>
  );
}
