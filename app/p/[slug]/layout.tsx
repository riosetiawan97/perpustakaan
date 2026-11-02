import type { Metadata } from "next";
import { getLibrary } from "@/lib/auth";
import { LibTabs } from "@/components/LibTabs";
import { joinLibraryAction } from "@/app/actions";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { library } = await getLibrary((await params).slug);
  return { title: { default: library.name, template: `%s · ${library.name}` } };
}

export default async function LibraryLayout({ params, children }: P & { children: React.ReactNode }) {
  const { slug } = await params;
  const { library, session, membership, isAdmin } = await getLibrary(slug);
  const base = `/p/${slug}`;
  const tabs = [{ href: base, label: "Katalog", exact: true }];
  if (membership) tabs.push({ href: `${base}/pinjaman`, label: "Pinjaman saya", exact: false });
  if (isAdmin) {
    tabs.push(
      { href: `${base}/admin`, label: "Ringkasan", exact: true },
      { href: `${base}/admin/peminjaman`, label: "Sirkulasi", exact: false },
      { href: `${base}/admin/buku`, label: "Buku", exact: false },
      { href: `${base}/admin/anggota`, label: "Anggota", exact: false },
      { href: `${base}/admin/pengaturan`, label: "Pengaturan", exact: false },
    );
  }

  return (
    <div>
      <div className="-mt-6 mb-6 border-b border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 pt-5">
          <div className="min-w-0">
            <p className="font-serif text-xl font-bold leading-tight text-shelf sm:text-2xl">{library.name}</p>
            <p className="text-sm text-muted">
              {[library.city, membership ? `${isAdmin ? "Petugas" : "Anggota"} · ${membership.memberCode}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          {!membership && library.openJoin && (
            <form action={joinLibraryAction}>
              <input type="hidden" name="slug" value={slug} />
              <button className="btn-primary">{session ? "Gabung jadi anggota" : "Masuk untuk bergabung"}</button>
            </form>
          )}
          {membership && !membership.active && <span className="text-sm font-medium text-late">Keanggotaan Anda sedang dinonaktifkan</span>}
        </div>
        <LibTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
