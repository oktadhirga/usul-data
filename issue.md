# Planning Fitur Notifikasi In-App

## Deskripsi Singkat
Fitur untuk memberikan notifikasi di dalam aplikasi (in-app) kepada user ketika terjadi perubahan status pada Usulan Data Pegawai.

## 1. Skema Database (Drizzle ORM)
Buat tabel baru `notifikasi` di `packages/shared/src/schema`:
- `id`: tipe identifier (menyesuaikan konvensi yang ada, misal integer/serial atau varchar/uuid)
- `user_id`: relasi ke tabel `users` (target penerima notifikasi)
- `judul`: varchar (misal: "Usulan Disetujui")
- `pesan`: text (misal: "Usulan ubah data untuk NIP 123... telah disetujui")
- `is_read`: boolean (default `false`)
- `link`: varchar (opsional, URL path untuk mengarahkan user saat notifikasi diklik, misal `/usulan/123`)
- `created_at`: timestamp

## 2. Backend API (ElysiaJS)
Buat modul API baru untuk notifikasi:
- `GET /api/notifications`: Mengambil daftar notifikasi milik user yang sedang login, diurutkan dari yang terbaru.
- `PATCH /api/notifications/:id/read`: Mengubah status `is_read` menjadi `true`.
- **Trigger/Hook Notifikasi**: 
  - **Saat Verifikasi (Untuk Admin OPD)**: Modifikasi endpoint verifikasi usulan (`disetujui` / `ditolak`). Saat Admin Pusat melakukan verifikasi, sistem menambahkan record notifikasi untuk Admin OPD yang membuat usulan tersebut.
  - **Saat Pengajuan (Untuk Admin Pusat)**: Modifikasi endpoint pengajuan usulan (`draft` -> `diajukan`). Saat Admin OPD mengajukan usulan, sistem menambahkan notifikasi untuk role Admin Pusat.

## 3. Frontend Web (SvelteKit)
- **Komponen Navbar/Header**:
  - Tambahkan icon Bell (Lonceng).
  - Tampilkan indikator/badge (angka atau titik merah) jika terdapat notifikasi yang belum dibaca (`is_read == false`).
- **Dropdown Notifikasi**:
  - Saat icon Bell diklik, tampilkan daftar notifikasi terbaru dalam bentuk dropdown/popover.
- **Interaksi**:
  - Jika item notifikasi diklik, panggil endpoint pembacaan notifikasi lalu arahkan user ke halaman `link` yang tertera (misal detail usulan).
  - Ambil data notifikasi menggunakan request HTTP/fetch standar setiap kali layout atau halaman dimuat. Tidak perlu mengimplementasikan *real-time* (WebSocket/SSE) untuk versi ini.

---
**Catatan untuk Eksekusi (Junior/AI):**
- Ikuti standar penulisan kode monorepo yang sudah ada (struktur Drizzle schema, Elysia controllers, dan API client SvelteKit).
- Jangan ubah skema tabel yang sudah ada secara asal, cukup tambahkan yang diperlukan.
