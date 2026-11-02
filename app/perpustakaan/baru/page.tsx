import { createLibraryAction } from "@/app/actions";
import { LibraryForm } from "@/components/LibraryForm";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Daftarkan perpustakaan" };

export default async function BaruPage() {
  await requireUser("/perpustakaan/baru");
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-3xl font-bold text-shelf">Daftarkan perpustakaan</h1>
      <p className="mb-6 text-muted">
        Anda otomatis menjadi petugas pertama. Setelah itu tambahkan buku, undang petugas lain, dan atur lama pinjam serta denda.
      </p>
      <LibraryForm action={createLibraryAction} submit="Buat perpustakaan" />
    </div>
  );
}
