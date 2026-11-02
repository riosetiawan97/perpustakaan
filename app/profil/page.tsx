import { eq } from "drizzle-orm";
import { changePasswordAction, updateProfileAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";
import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil" };

export default async function Profil() {
  const s = await requireUser();
  const db = await getDb();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, s.id));
  return (
    <div className="max-w-3xl">
      <PageTitle title="Profil" />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-1 text-lg font-bold">Data diri</h2>
          <p className="mb-4 text-sm text-muted">{u.email}{u.memberCode ? ` · ${u.memberCode}` : ""}</p>
          <ActionForm
            action={updateProfileAction}
            submit="Simpan profil"
            fields={[
              { name: "name", label: "Nama", defaultValue: u.name, required: true },
              { name: "phone", label: "No. HP", type: "tel", defaultValue: u.phone ?? "" },
              { name: "address", label: "Alamat", defaultValue: u.address ?? "" },
            ]}
          />
        </section>
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-bold">Ganti password</h2>
          <ActionForm
            action={changePasswordAction}
            submit="Ganti password"
            fields={[
              { name: "current", label: "Password saat ini", type: "password", autoComplete: "current-password", required: true },
              { name: "next", label: "Password baru", type: "password", autoComplete: "new-password", required: true },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
