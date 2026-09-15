# Progress & Status Aplikasi: Usul Data Monorepo

> File ini diupdate SETIAP fitur/sub-fitur besar selesai — bukan tiap commit kecil.
> Tujuannya: siapapun (manusia atau AI) yang baru mulai sesi baru bisa cepat paham
> "aplikasi ini sekarang sudah bisa apa, dan kenapa dibangun begitu" tanpa harus
> baca seluruh git history atau semua PRD satu-satu.

Terakhir diupdate: 15 September 2026

---

## 1. Ringkasan Aplikasi
Aplikasi manajemen data (Usul Data) yang dikembangkan dengan arsitektur monorepo (Bun workspaces). Aplikasi ini memiliki backend API berbasis ElysiaJS dan frontend web berbasis SvelteKit 5. Database dikelola menggunakan Drizzle ORM dan MySQL. Saat ini, aplikasi memiliki fitur manajemen user, unit organisasi (UNOR), pegawai, pengajuan usulan perubahan data pegawai, serta verifikasi usulan oleh Admin Pusat.

## 2. Fitur yang Sudah Ada

| Fitur | Status | Modul/Path | Catatan |
|---|---|---|---|
| **Autentikasi & Otorisasi** | Selesai | `users` / `/login` | Menggunakan JWT. Role yang tersedia: `Admin`, `AdminOPD`. |
| **Manajemen User** | Selesai | `users` / `/users` | CRUD User, dengan relasi ke Unit Organisasi (Kode UNOR). |
| **Manajemen Unit Organisasi (UNOR)** | Selesai | `unor` / `/unor` | CRUD UNOR. Data master untuk unit kerja pegawai & user OPD. |
| **Manajemen Pegawai** | Selesai | `pegawai` / `/pegawai` | CRUD Pegawai. Terhubung dengan tabel UNOR. |
| **Profil Pengguna** | Selesai | `users` / `/profile` | Menampilkan info user yang sedang login. |
| **Usulan Ubah Data Pegawai** | Selesai | `usulan` / `/usulan`, `/usulan/baru` | Pengajuan perubahan data via wizard 5 langkah, upload berkas PDF (maks 1 MB), pembatalan usulan, edit & ajukan kembali usulan dibatalkan/draft, serta hapus usulan secara permanen (DB cascade & berkas fisik). |
| **Verifikasi Usulan Pegawai** | Selesai | `usulan` / `/verifikasi` | Dashboard Admin Pusat untuk verifikasi usulan masuk, preview dokumen PDF di tab baru, approval (memicu sinkronisasi update otomatis ke tabel pegawai), penolakan dengan catatan wajib, serta pencatatan audit log verifikator (`verified_by` username & `verified_at`). |

## 3. Keputusan Arsitektur Penting

- **Monorepo**: Menggunakan workspace `bun` (`apps/api`, `apps/web`, `packages/shared`) untuk mempermudah sharing kode dan typing.
- **Backend API**: Menggunakan **ElysiaJS**.
- **Frontend Web**: Menggunakan **SvelteKit 5** dengan TailwindCSS 4.
- **Komunikasi API**: Frontend menggunakan modul API client terisolasi untuk interaksi backend yang type-safe.
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
  - Edit & Pengajuan Ulang: Usulan berstatus `draft`, `dibatalkan`, dan `ditolak` dapat diedit rinciannya dan diajukan kembali ke status `diajukan` (audit reset).
  - Hapus Permanen: Usulan berstatus `draft`, `dibatalkan`, atau `ditolak` dapat dihapus permanen, menghapus data di DB beserta fisik berkas dokumen di server (`uploads/`).
  - Format Waktu: Menampilkan zona waktu Indonesia Barat (WIB / GMT+7).
- **Fitur Verifikasi Usulan (Admin Pusat)**:
  - Audit Trail: Kolom `verified_by` (menyimpan username admin yang memverifikasi), `verified_at` (waktu eksekusi verifikasi), dan `catatan` langsung pada tabel `usulan_perubahan`.
  - Sinkronisasi Master Pegawai: Approval usulan secara otomatis memperbarui kolom data bersangkutan pada tabel master `pegawai` (nama, nip, jabatan, kodeUnor). Untuk jenis usulan `hapus`, tidak ada tindakan penghapusan otomatis sesuai kesepakatan spesifikasi.
  - Penolakan Usulan: Mewajibkan admin memberikan catatan / alasan penolakan sebelum status diubah menjadi `ditolak`.
  - Preview Dokumen: Dilakukan via tautan berkas yang membuka langsung dokumen PDF pada tab peramban baru (`target="_blank"`).
  - Feedback OPD: Detail usulan pada halaman OPD menampilkan informasi verifikator, waktu verifikasi, dan catatan/alasan penolakan dari admin pusat.

## 4. Known Issues / Technical Debt

- Belum ada implementasi test otomatis berbasis SvelteKit component (test backend Elysia telah mencakup 52 skenario pengujian komprehensif).

## 5. Yang Sedang Dikerjakan (In Progress)

- (Fitur verifikasi usulan oleh Admin Pusat telah selesai diimplementasikan)

## 6. Yang Sengaja Belum Dikerjakan

- Deployment pipeline / CI/CD (Dockerfile & docker-compose sudah ada namun untuk production masih perlu konfigurasi lanjut).
