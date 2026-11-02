import Link from "next/link";
import { registerAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";

export const metadata = { title: "Daftar anggota" };

export default function Daftar() {
  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="mb-1 text-3xl font-bold text-shelf">Daftar anggota</h1>
      <p className="mb-6 text-muted">Nomor anggota Anda langsung dibuat setelah mendaftar.</p>
      <div className="panel p-5">
        <ActionForm
          action={registerAction}
          submit="Daftar"
          fields={[
            { name: "name", label: "Nama lengkap", autoComplete: "name", required: true },
            { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
            { name: "phone", label: "No. HP (opsional)", type: "tel", autoComplete: "tel" },
            { name: "password", label: "Password (min. 6 karakter)", type: "password", autoComplete: "new-password", required: true },
          ]}
        />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Sudah punya akun? <Link href="/login" className="font-semibold text-shelf underline">Masuk</Link>
      </p>
    </div>
  );
}
