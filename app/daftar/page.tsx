import Link from "next/link";
import { registerAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";

export const metadata = { title: "Daftar akun" };

export default async function Daftar({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const forLibrary = next === "/perpustakaan/baru";
  return (
    <div className="mx-auto max-w-sm pt-6">
      <h1 className="mb-1 text-3xl font-bold text-shelf">Daftar akun</h1>
      <p className="mb-6 text-muted">
        {forLibrary
          ? "Buat akun dulu, lalu lanjut mendaftarkan perpustakaan Anda."
          : "Dengan satu akun Anda bisa bergabung ke banyak perpustakaan atau membuka perpustakaan sendiri."}
      </p>
      <div className="panel p-5">
        <ActionForm
          action={registerAction}
          submit={forLibrary ? "Daftar dan lanjutkan" : "Daftar"}
          fields={[
            { name: "name", label: "Nama lengkap", autoComplete: "name", required: true },
            { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
            { name: "phone", label: "No. HP (opsional)", type: "tel", autoComplete: "tel" },
            { name: "password", label: "Password (min. 6 karakter)", type: "password", autoComplete: "new-password", required: true },
          ]}
        >
          <input type="hidden" name="next" value={next} />
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Sudah punya akun? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-shelf underline">Masuk</Link>
      </p>
    </div>
  );
}
