# Perpustakaan

Platform perpustakaan untuk web dan mobile (PWA). Siapa saja bisa mendaftarkan perpustakaannya sendiri (taman baca, perpustakaan sekolah, koleksi komunitas). Tiap perpustakaan punya katalog, petugas, anggota, dan aturan peminjamannya sendiri.

## Fitur

**Platform**
- Direktori perpustakaan dengan pencarian nama/kota
- Satu akun untuk banyak perpustakaan; halaman "Perpustakaan saya" berisi semua keanggotaan
- Daftarkan perpustakaan baru: pembuat otomatis menjadi petugas pertama, alamat halaman `/p/nama-perpustakaan`

**Pengunjung / anggota** (per perpustakaan)
- Katalog buku: pencarian judul/penulis/ISBN, filter kategori, filter "hanya yang tersedia"
- Detail buku: lokasi rak, eksemplar tersedia, perkiraan tanggal kembali
- Gabung jadi anggota dengan satu klik (nomor anggota `AGT-xxxx` otomatis per perpustakaan)
- Pinjaman saya: buku yang dipinjam, tanggal kembali, denda berjalan, riwayat

**Petugas** (per perpustakaan)
- Ringkasan: pinjaman aktif, keterlambatan, anggota, koleksi, aktivitas terakhir
- Sirkulasi: catat peminjaman (no. anggota/email), terima pengembalian, tandai denda lunas
- Kelola buku dan kategori
- Kelola anggota: tambah lewat email, jadikan petugas, aktifkan/nonaktifkan
- Pengaturan: profil perpustakaan, lama pinjam, maks. buku per anggota, denda per hari, keanggotaan terbuka/tertutup

**Keamanan data**: setiap query dibatasi `library_id`; petugas satu perpustakaan tidak bisa melihat atau mengubah data perpustakaan lain (diuji end-to-end).

**Mobile**: bisa di-install ke home screen (PWA) dan punya halaman offline.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Web + API | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| Tampilan | Tailwind CSS 4 |
| Database | PostgreSQL (Neon) via Drizzle ORM |
| Auth | Sesi JWT di cookie httpOnly (jose), password bcrypt |
| Deploy | Vercel |

## Akun demo

Dibuat otomatis saat database pertama kali diisi:

| Peran | Email | Password |
| --- | --- | --- |
| Petugas Perpustakaan Demo | admin@perpustakaan.id | `admin123` (atau nilai `ADMIN_PASSWORD`) |
| Petugas Taman Baca Melati | melati@perpustakaan.id | `melati123` |
| Anggota di kedua perpustakaan | anggota@perpustakaan.id | `anggota123` |

Segera ganti password admin lewat menu Profil setelah deploy.

## Menjalankan secara lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

Tanpa `DATABASE_URL`, aplikasi memakai Postgres in-memory (PGlite) berisi data contoh; data hilang saat server dimatikan. Untuk memakai database sungguhan, salin `.env.example` ke `.env.local` dan isi `DATABASE_URL`.

```bash
npm test           # unit test aturan peminjaman, slug, kode anggota
npm run typecheck
```

## Deploy (Vercel)

1. Import repo ini di Vercel.
2. Tambahkan Neon Postgres dari tab **Storage** (mengisi `DATABASE_URL`).
3. Opsional: set `AUTH_SECRET` (string acak) dan `ADMIN_PASSWORD`.

Saat build, `scripts/migrate.mjs` membuat/memperbarui tabel dalam satu transaksi. Database versi satu-perpustakaan otomatis dipindah menjadi "Perpustakaan Demo" tanpa kehilangan data; database kosong diisi data contoh. Setiap push ke branch utama otomatis terdeploy.

## Struktur

```
app/            halaman global (direktori, akun) & server actions (app/actions.ts)
  p/[slug]/     katalog, pinjaman, dan admin per perpustakaan
components/     komponen UI
db/             skema SQL & data awal (dipakai migrasi dan mode lokal)
lib/            koneksi database, auth, aturan peminjaman
public/         ikon PWA, service worker, halaman offline
legacy/         kode lama (CodeIgniter 3), disimpan sebagai arsip
```
