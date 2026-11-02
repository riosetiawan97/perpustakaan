import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // URL versi satu-perpustakaan diarahkan ke perpustakaan demo.
  async redirects() {
    const demo = "/p/perpustakaan-demo";
    return [
      { source: "/admin", destination: `${demo}/admin`, permanent: false },
      { source: "/admin/:path*", destination: `${demo}/admin/:path*`, permanent: false },
      { source: "/buku/:id", destination: `${demo}/buku/:id`, permanent: false },
      { source: "/pinjaman", destination: `${demo}/pinjaman`, permanent: false },
    ];
  },
};

export default nextConfig;
