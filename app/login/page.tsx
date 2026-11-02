import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Masuk" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  if (await getSession()) redirect(next.startsWith("/") ? next : "/saya");
  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="mb-1 text-3xl font-bold text-shelf">Masuk</h1>
      <p className="mb-6 text-muted">Satu akun untuk semua perpustakaan yang Anda ikuti.</p>
      <div className="panel p-5">
        <ActionForm
          action={loginAction}
          submit="Masuk"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password", required: true },
          ]}
        >
          <input type="hidden" name="next" value={next} />
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Belum punya akun? <Link href={`/daftar${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-shelf underline">Daftar</Link>
      </p>
      <details className="mt-6 rounded-md border border-dashed border-line p-3 text-sm text-muted">
        <summary className="cursor-pointer">Akun demo</summary>
        <p className="mt-2">Petugas Perpustakaan Demo: admin@perpustakaan.id / admin123</p>
        <p>Petugas Taman Baca Melati: melati@perpustakaan.id / melati123</p>
        <p>Anggota kedua perpustakaan: anggota@perpustakaan.id / anggota123</p>
      </details>
    </div>
  );
}
