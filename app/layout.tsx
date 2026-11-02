import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: { default: "Perpustakaan", template: "%s · Perpustakaan" },
  description: "Platform perpustakaan: daftarkan perpustakaan Anda, kelola katalog, anggota, dan peminjaman.",
  appleWebApp: { capable: true, title: "Perpustakaan", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#1f3d34", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Public+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body className="min-h-dvh">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>
        <SWRegister />
      </body>
    </html>
  );
}
