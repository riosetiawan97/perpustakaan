import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export async function Nav() {
  const s = await getSession();
  return (
    <header className="border-b border-line bg-sheet">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          <span className="font-serif text-lg font-bold text-shelf">Perpustakaan</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Akun">
          {s ? (
            <>
              <Link href="/saya" className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-muted hover:text-ink"><span className="sm:hidden">Akun saya</span><span className="hidden sm:inline">Perpustakaan saya</span></Link>
              <Link href="/profil" className="hidden rounded-md px-2.5 py-1.5 text-muted hover:text-ink sm:inline">{s.name}</Link>
              <form action={logoutAction}>
                <button className="rounded-md px-2.5 py-1.5 text-muted hover:text-ink">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-2.5 py-1.5 text-muted hover:text-ink">Masuk</Link>
              <Link href="/daftar" className="btn-primary px-3 py-1.5">Daftar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
