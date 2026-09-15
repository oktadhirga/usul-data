# Progress & Status Aplikasi: Usul Data Monorepo

> File ini diupdate SETIAP fitur/sub-fitur besar selesai — bukan tiap commit kecil.
> Tujuannya: siapapun (manusia atau AI) yang baru mulai sesi baru bisa cepat paham
> "aplikasi ini sekarang sudah bisa apa, dan kenapa dibangun begitu" tanpa harus
> baca seluruh git history atau semua PRD satu-satu.

Terakhir diupdate: 14 September 2026

---

## 1. Ringkasan Aplikasi
Aplikasi manajemen data (Usul Data) yang dikembangkan dengan arsitektur monorepo (Bun workspaces). Aplikasi ini memiliki backend API berbasis ElysiaJS dan frontend web berbasis SvelteKit 5. Database dikelola menggunakan Drizzle ORM dan MySQL. Saat ini, aplikasi memiliki fitur manajemen user, unit organisasi (UNOR), pegawai, serta pengajuan dan pengelolaan usulan perubahan data pegawai.

## 2. Fitur yang Sudah Ada

| Fitur | Status | Modul/Path | Catatan |
|---|---|---|---|
| **Autentikasi & Otorisasi** | Selesai | `users` / `/login` | Menggunakan JWT. Role yang tersedia: `Admin`, `AdminOPD`. |
| **Manajemen User** | Selesai | `users` / `/users` | CRUD User, dengan relasi ke Unit Organisasi (Kode UNOR). |
| **Manajemen Unit Organisasi (UNOR)** | Selesai | `unor` / `/unor` | CRUD UNOR. Data master untuk unit kerja pegawai & user OPD. |
| **Manajemen Pegawai** | Selesai | `pegawai` / `/pegawai` | CRUD Pegawai. Terhubung dengan tabel UNOR. |
| **Profil Pengguna** | Selesai | `users` / `/profile` | Menampilkan info user yang sedang login. |
| **Usulan Ubah Data Pegawai** | Selesai | `usulan` / `/usulan`, `/usulan/baru` | Pengajuan perubahan data via wizard 5 langkah, upload berkas PDF (maks 1 MB), pembatalan usulan, edit & ajukan kembali usulan dibatalkan/draft, serta hapus usulan secara permanen (DB cascade & berkas fisik). |

## 3. Keputusan Arsitektur Penting

- **Monorepo**: Menggunakan workspace `bun` (`apps/api`, `apps/web`, `packages/shared`) untuk mempermudah sharing kode dan typing.
- **Backend API**: Menggunakan **ElysiaJS**.
- **Frontend Web**: Menggunakan **SvelteKit 5** dengan TailwindCSS 4.
- **Komunikasi API**: Frontend menggunakan **Eden Treaty** (`@elysiajs/eden`) dan modul API client terisolasi untuk interaksi backend yang type-safe.
- **Database**: Menggunakan MySQL dengan **Drizzle ORM**. Skema database dan relasi diletakkan di `packages/shared/src/schema` agar bisa dipakai baik oleh API maupun Web.
- **Relasi Database**:
  - `Pegawai` berelasi `one-to-many` dengan `Unor` (1 Unor punya banyak Pegawai).
  - `User` memiliki atribut `kodeUnor` untuk membatasi akses role `AdminOPD` ke data Unor tertentu.
- **Fitur Usulan Ubah Data Pegawai**:
  - Struktur tabel: `usulan_perubahan` (header), `usulan_detail_field` (rincian field), dan `usulan_dokumen` (berkas lampiran PDF).
  - Jenis usulan: `tambah`, `ubah`, dan `hapus`.
  - Kategori usulan: 7 opsi baku (`Data Pribadi`, `Data Keluarga`, `Golongan`, `Jabatan`, `Pendidikan`, `Pindah Instansi`, `Diklat/Kursus`).
  - Validasi berkas: Format PDF dan ukuran maksimum 1 MB. Wajib melampirkan berkas untuk jenis usulan `tambah` dan `ubah`, sedangkan untuk `hapus` bersifat opsional.
  - Lifecycle status: `draft` -> `diajukan` -> (`disetujui` / `ditolak` / `dibatalkan`).
  - Scoping & RBAC: `AdminOPD` dibatasi hanya dapat membuat, melihat, mengedit, dan menghapus usulan untuk pegawai di UNOR miliknya. `Admin` memiliki akses penuh lintas UNOR.
  - Edit & Pengajuan Ulang: Usulan berstatus `draft` dan `dibatalkan` dapat diedit rinciannya dan diajukan kembali ke status `diajukan`.
  - Hapus Permanen: Usulan berstatus `draft` atau `dibatalkan` dapat dihapus permanen, menghapus data di DB beserta fisik berkas dokumen di server (`uploads/`).
  - Format Waktu: Menampilkan zona waktu Indonesia Barat (WIB / GMT+7).

## 4. Known Issues / Technical Debt

- Belum ada implementasi test yang komprehensif di SvelteKit (saat ini script test hanya echo string; test backend Elysia telah mencakup 46 skenario).

## 5. Yang Sedang Dikerjakan (In Progress)

- (Fitur usulan ubah data fase pengajuan, pembatalan, edit ulang, dan hapus permanen telah selesai)

## 6. Yang Sengaja Belum Dikerjakan

- Endpoint persetujuan / verifikasi usulan (approval/rejection) oleh verifikator/Admin.
- Deployment pipeline / CI/CD (Dockerfile & docker-compose sudah ada namun untuk production masih perlu konfigurasi lanjut).
