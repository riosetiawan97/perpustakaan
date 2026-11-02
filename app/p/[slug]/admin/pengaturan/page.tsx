import { updateLibraryAction } from "@/app/actions";
import { LibraryForm } from "@/components/LibraryForm";
import { requireLibAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan" };

export default async function Pengaturan({ params }: { params: Promise<{ slug: string }> }) {
  const { library } = await requireLibAdmin((await params).slug);
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-shelf sm:text-3xl">Pengaturan</h1>
      <p className="mb-6 text-muted">Alamat halaman: /p/{library.slug}</p>
      <LibraryForm action={updateLibraryAction} library={library} submit="Simpan pengaturan" />
    </div>
  );
}
