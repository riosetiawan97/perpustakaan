# Perpustakaan

Sistem informasi perpustakaan untuk web dan mobile (PWA): katalog buku, keanggotaan, sirkulasi peminjaman, dan denda keterlambatan.

## Fitur

**Pengunjung / anggota**
- Katalog buku dengan pencarian (judul, penulis, ISBN), filter kategori, dan filter "hanya yang tersedia"
- Detail buku: lokasi rak, jumlah eksemplar tersedia, perkiraan tanggal kembali jika sedang dipinjam semua
- Daftar anggota mandiri (nomor anggota `AGT-xxxx` otomatis)
- Halaman "Pinjaman saya": buku yang sedang dipinjam, tanggal kembali, denda berjalan, riwayat
- Profil dan ganti password

**Petugas (admin)**
- Ringkasan: jumlah pinjaman aktif, keterlambatan, anggota, koleksi, aktivitas terakhir
- Sirkulasi: catat peminjaman (dengan no. anggota/email), terima pengembalian, tandai denda lunas
- Kelola buku: tambah, ubah, hapus (buku yang punya riwayat pinjam tidak bisa dihapus)
- Kelola anggota: lihat pinjaman & denda, aktifkan/nonaktifkan

**Aturan peminjaman** (`lib/rules.ts`)
- Lama pinjam 7 hari, maksimal 3 buku aktif per anggota
- Denda Rp1.000 per hari keterlambatan; anggota dengan denda belum lunas tidak bisa meminjam

**Mobile**: aplikasi bisa di-install ke home screen (PWA), dengan navigasi bawah di layar kecil dan halaman offline.

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
| Petugas | admin@perpustakaan.id | `admin123` (atau nilai `ADMIN_PASSWORD`) |
| Anggota | anggota@perpustakaan.id | `anggota123` |

Segera ganti password admin lewat menu Profil setelah deploy.

## Menjalankan secara lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

Tanpa `DATABASE_URL`, aplikasi memakai Postgres in-memory (PGlite) berisi data contoh; data hilang saat server dimatikan. Untuk memakai database sungguhan, salin `.env.example` ke `.env.local` dan isi `DATABASE_URL`.

```bash
npm test           # unit test aturan peminjaman
npm run typecheck
```

## Deploy (Vercel)

1. Import repo ini di Vercel.
2. Tambahkan Neon Postgres dari tab **Storage** (mengisi `DATABASE_URL`).
3. Opsional: set `AUTH_SECRET` (string acak) dan `ADMIN_PASSWORD`.

Saat build, `scripts/migrate.mjs` membuat tabel dan data awal jika belum ada. Setiap push ke branch utama otomatis terdeploy.

## Struktur

```
app/            halaman & server actions (app/actions.ts)
  admin/        halaman petugas
components/     komponen UI
db/             skema SQL & data awal (dipakai migrasi dan mode lokal)
lib/            koneksi database, auth, aturan peminjaman
public/         ikon PWA, service worker, halaman offline
legacy/         kode lama (CodeIgniter 3), disimpan sebagai arsip
```
