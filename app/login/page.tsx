import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Masuk" };

export default async function Login() {
  const s = await getSession();
  if (s) redirect(s.role === "admin" ? "/admin" : "/");
  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="mb-1 text-3xl font-bold text-shelf">Masuk</h1>
      <p className="mb-6 text-muted">Untuk anggota dan petugas perpustakaan.</p>
      <div className="panel p-5">
        <ActionForm
          action={loginAction}
          submit="Masuk"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password", required: true },
          ]}
        />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Belum jadi anggota? <Link href="/daftar" className="font-semibold text-shelf underline">Daftar sekarang</Link>
      </p>
      <details className="mt-6 rounded-md border border-dashed border-line p-3 text-sm text-muted">
        <summary className="cursor-pointer">Akun demo</summary>
        <p className="mt-2">Petugas: admin@perpustakaan.id / admin123</p>
        <p>Anggota: anggota@perpustakaan.id / anggota123</p>
      </details>
    </div>
  );
}
