import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { BookForm } from "@/components/BookForm";
import { PageTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tambah buku" };

export default async function BukuBaru() {
  await requireAdmin();
  const db = await getDb();
  const cats = await db.select().from(schema.categories).orderBy(asc(schema.categories.name));
  return (
    <div className="max-w-2xl">
      <Link href="/admin/buku" className="mb-4 inline-block text-sm text-muted hover:text-ink">← Daftar buku</Link>
      <PageTitle title="Tambah buku" />
      <BookForm categories={cats} />
    </div>
  );
}
