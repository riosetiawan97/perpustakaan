"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children, variant }: { href: string; children: React.ReactNode; variant: "top" | "bottom" }) {
  const path = usePathname();
  const active = href === "/" || href === "/admin" ? path === href : path.startsWith(href);
  if (variant === "bottom") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex-1 py-3 text-center text-xs font-medium ${active ? "text-shelf" : "text-muted"}`}
      >
        <span className={`mx-auto mb-1 block h-1 w-6 rounded-full ${active ? "bg-brass" : "bg-transparent"}`} />
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-shelf-soft text-shelf" : "text-muted hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
