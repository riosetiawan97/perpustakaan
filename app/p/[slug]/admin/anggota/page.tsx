import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { addMemberByEmailAction, setRoleAction, toggleMemberAction } from "@/app/actions";
import { ActionForm } from "@/components/AuthForm";
import { Notice } from "@/components/ui";
import { requireLibAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatDate, formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anggota" };
const { users, loans, memberships } = schema;

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; error?: string }> };

export default async function Anggota({ params, searchParams }: P) {
  const { slug } = await params;
  const { library, session } = await requireLibAdmin(slug);
  const { q = "", error } = await searchParams;
  const db = await getDb();
  const lib = library.id;
  const rows = await db
    .select({
      m: memberships,
      name: users.name,
      email: users.email,
      active: sql<number>`(select count(*) from ${loans} x where x.library_id = ${lib} and x.user_id = ${users.id} and x.returned_at is null)::int`,
      unpaid: sql<number>`(select coalesce(sum(x.fine),0) from ${loans} x where x.library_id = ${lib} and x.user_id = ${users.id} and x.fine_paid = false)::int`,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.libraryId, lib), q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`), ilike(memberships.memberCode, `%${q}%`)) : undefined))
    .orderBy(sql`${memberships.role} = 'member'`, asc(users.name));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-shelf sm:text-3xl">Anggota & petugas</h1>
      {error === "admin-terakhir" && (
        <div className="mb-4"><Notice kind="error">Anda satu-satunya petugas. Jadikan orang lain petugas dulu sebelum melepas peran Anda.</Notice></div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <form className="flex gap-2 self-start" role="search">
          <input name="q" defaultValue={q} placeholder="Cari nama, email, no. anggota" className="field max-w-sm" aria-label="Cari anggota" />
          <button className="btn-ghost">Cari</button>
        </form>
        <details className="panel p-4">
          <summary className="cursor-pointer font-medium">Tambah lewat email</summary>
          <ActionForm action={addMemberByEmailAction} submit="Tambahkan" className="mt-3" fields={[{ name: "email", label: "Email akun", type: "email", required: true }]}>
            <input type="hidden" name="slug" value={slug} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="role" value="admin" className="h-4 w-4 accent-[#1f3d34]" /> Jadikan petugas
            </label>
          </ActionForm>
        </details>
      </div>

      <div className="panel overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Nama</th><th className="hidden md:table-cell">Bergabung</th><th>Pinjaman</th><th>Denda</th><th className="text-right">Tindakan</th></tr>
          </thead>
          <tbody>
            {rows.map(({ m, name, email, active, unpaid }) => {
              const self = m.userId === session.id;
              const admin = m.role === "admin";
              return (
                <tr key={m.id} className={m.active ? "" : "text-muted"}>
                  <td>
                    <span className="font-medium">{name}</span>
                    {admin && <span className="ml-2 rounded-full bg-brass-soft px-2 py-0.5 text-xs font-semibold text-[#6b4d10]">Petugas</span>}
                    {!m.active && <span className="ml-2 text-xs">nonaktif</span>}
                    <br /><span className="text-muted">{m.memberCode} · {email}</span>
                  </td>
                  <td className="hidden md:table-cell">{formatDate(m.createdAt)}</td>
                  <td>{active}</td>
                  <td className={unpaid ? "font-semibold text-late" : ""}>{unpaid ? formatRupiah(unpaid) : "—"}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={setRoleAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="userId" value={m.userId} />
                        <input type="hidden" name="role" value={admin ? "member" : "admin"} />
                        <button className="btn-ghost px-3 py-1">{admin ? "Jadikan anggota" : "Jadikan petugas"}</button>
                      </form>
                      {!self && (
                        <form action={toggleMemberAction}>
                          <input type="hidden" name="slug" value={slug} />
                          <input type="hidden" name="userId" value={m.userId} />
                          <button className={m.active ? "btn-ghost px-3 py-1" : "btn-primary px-3 py-1"}>{m.active ? "Nonaktifkan" : "Aktifkan"}</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">Belum ada anggota. Bagikan alamat /p/{slug} agar orang bisa bergabung.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
