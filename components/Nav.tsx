import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { NavLink } from "./NavLink";

export async function Nav() {
  const s = await getSession();
  const links = !s
    ? [{ href: "/", label: "Katalog" }, { href: "/login", label: "Masuk" }]
    : s.role === "admin"
      ? [
          { href: "/admin", label: "Ringkasan" },
          { href: "/admin/peminjaman", label: "Sirkulasi" },
          { href: "/admin/buku", label: "Buku" },
          { href: "/admin/anggota", label: "Anggota" },
          { href: "/", label: "Katalog" },
        ]
      : [{ href: "/", label: "Katalog" }, { href: "/pinjaman", label: "Pinjaman saya" }, { href: "/profil", label: "Profil" }];

  return (
    <>
      <header className="border-b border-line bg-sheet">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href={s?.role === "admin" ? "/admin" : "/"} className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="font-serif text-lg font-bold text-shelf">Perpustakaan</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigasi utama">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} variant="top">{l.label}</NavLink>
            ))}
          </nav>
          {s && (
            <form action={logoutAction} className="flex items-center gap-3">
              <span className="hidden text-sm text-muted md:inline">{s.name}</span>
              <button className="text-sm font-medium text-muted hover:text-ink">Keluar</button>
            </form>
          )}
        </div>
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-sheet pb-[env(safe-area-inset-bottom)] sm:hidden"
        aria-label="Navigasi utama"
      >
        {links.slice(0, 5).map((l) => (
          <NavLink key={l.href} href={l.href} variant="bottom">{l.label}</NavLink>
        ))}
      </nav>
    </>
  );
}
