import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perpustakaan",
    short_name: "Perpustakaan",
    description: "Katalog buku, keanggotaan, dan peminjaman perpustakaan.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f2",
    theme_color: "#1f3d34",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
