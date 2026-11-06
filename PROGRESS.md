# Progress & Status Aplikasi: ASN-Sync (Usul Data Monorepo)

> File ini diupdate SETIAP fitur/sub-fitur besar selesai — bukan tiap commit kecil.
> Tujuannya: siapapun (manusia atau AI) yang baru mulai sesi baru bisa cepat paham
> "aplikasi ini sekarang sudah bisa apa, dan kenapa dibangun begitu" tanpa harus
> baca seluruh git history atau semua PRD satu-satu.

Terakhir diupdate: 6 November 2026

---

## 1. Ringkasan Aplikasi
Aplikasi manajemen dan sinkronisasi usulan data kepegawaian aparatur sipil negara (**ASN-Sync**) yang dikembangkan dengan arsitektur monorepo (Bun workspaces). Aplikasi ini memiliki backend API berbasis ElysiaJS dan frontend web berbasis SvelteKit 5. Database dikelola menggunakan Drizzle ORM dan MySQL. Saat ini, aplikasi memiliki fitur manajemen user, unit organisasi (UNOR), pegawai, pengajuan usulan perubahan data pegawai, verifikasi usulan oleh Admin Pusat, dashboard analitik & ekspor Excel, tema tampilan Dark/Light Mode, serta integrasi penarikan data dari API SIMPEG BKD Trenggalek.

## 2. Fitur yang Sudah Ada

| Fitur | Status | Modul/Path | Catatan |
|---|---|---|---|
| **Autentikasi & Otorisasi** | Selesai | `users` / `/login` | Menggunakan JWT. Role yang tersedia: `Admin`, `AdminOPD`. |
| **Manajemen User** | Selesai | `users` / `/users` | CRUD User, dengan relasi ke Unit Organisasi (Kode UNOR). |
| **Manajemen Unit Organisasi (UNOR)** | Selesai | `unor` / `/unor` | CRUD UNOR. Data master untuk unit kerja pegawai & user OPD. |
| **Manajemen Pegawai** | Selesai | `pegawai` / `/pegawai` | CRUD Pegawai. Terhubung dengan tabel UNOR. Dilengkapi pagination backend & frontend (10/25/50/100 per halaman) agar responsif dan nyaman untuk ribuan data. |
| **Profil Pengguna** | Selesai | `users` / `/profile` | Menampilkan info user yang sedang login. |
| **Usulan Ubah Data Pegawai** | Selesai | `usulan` / `/usulan`, `/usulan/baru` | Pengajuan perubahan data via wizard 5 langkah, upload berkas PDF (maks 1 MB), pembatalan usulan, edit & ajukan kembali usulan dibatalkan/draft, serta hapus usulan secara permanen (DB cascade & berkas fisik). |
| **Verifikasi Usulan Pegawai** | Selesai | `usulan` / `/verifikasi` | Dashboard Admin Pusat untuk verifikasi usulan masuk, preview dokumen PDF di tab baru, approval (memicu sinkronisasi update otomatis ke tabel pegawai), penolakan dengan catatan wajib, serta pencatatan audit log verifikator (`verified_by` username & `verified_at`). |
| **Notifikasi In-App** | Selesai | `notifikasi` / Header Bell | Notifikasi perubahan status usulan (diajukan, disetujui, ditolak) untuk Admin & AdminOPD, icon lonceng di header, badge jumlah unread, popover dropdown interaktif, dan penanda dibaca. |
| **Dashboard & Laporan Excel** | Selesai | `dashboard` / `/` | Dashboard ringkasan analitik usulan perubahan data aparatur sipil (5 Summary Cards: total, diajukan, disetujui, ditolak, draft/batal; distribusi per UNOR; distribusi per kategori; rekap aktivitas bulanan), filter interaktif tahun/bulan/status/UNOR, dan export laporan lengkap berformat Excel (.xlsx) dengan otorisasi RBAC (Admin Pusat vs AdminOPD). |
| **Dark Mode & Light Mode** | Selesai | `web` / Header Toggle | Dukungan tema ganda (Light Mode sebagai default dan Dark Mode), toggle switch Sun/Moon di header (mobile & desktop) dan halaman login, pencegahan flash (anti-FOUC) di `app.html`, persistensi `localStorage`, serta adaptasi penuh styling Tailwind CSS v4 di seluruh halaman & komponen UI. |
| **Integrasi API SIMPEG** | Selesai | `simpeg` / `/unor`, `/pegawai` | Sinkronisasi data terpisah dari API SIMPEG BKD Trenggalek (`/unit_kerja` dan `/pegawai`) via Basic Auth. Dilengkapi auto-pagination batch loop untuk menarik seluruh 9.800+ pegawai secara tuntas, validasi strict foreign key UNOR, dan modal laporan sinkronisasi. |

## 3. Keputusan Arsitektur Penting

- **Monorepo**: Menggunakan workspace `bun` (`apps/api`, `apps/web`, `packages/shared`) untuk mempermudah sharing kode dan typing.
- **Backend API**: Menggunakan **ElysiaJS**.
- **Fitur Integrasi API SIMPEG**:
  - **Pemisahan Penarikan Data (Decoupled Sync)**: Jalur UNOR dan Pegawai dipisahkan secara independen. UNOR ditarik HANYA secara manual via tombol di halaman `/unor`. Pegawai dapat ditarik manual via tombol di `/pegawai` atau otomatis berkala.
  - **Strict UNOR Dependency**: Pegawai dari SIMPEG yang kode UNOR-nya belum terdaftar di database lokal akan di-SKIP (tidak disimpan) dan dicatat dalam daftar peringatan/error untuk menjaga integritas foreign key dan mencegah auto-create UNOR liar.
  - **Provider Pattern & Basic Auth**: Provider eksternal mendukung Basic Auth (`user_tes:password_tes`) untuk endpoint `https://bkdtrenggalek.net/api_tes/`, pemetaan otomatis format response `{ result: [...] }`, serta dukungan `MOCK_SIMPEG=true` untuk pengujian lokal/CI yang cepat dan terisolasi.
  - **Endpoints API**: `POST /api/simpeg/unor/sync`, `GET /api/simpeg/unor/status`, `POST /api/simpeg/pegawai/sync`, `GET /api/simpeg/pegawai/status` (dibatasi khusus role `Admin`).
  - **Frontend UI Modal**: Tombol `Tarik Data UNOR (SIMPEG)` di halaman UNOR dan `Tarik Data Pegawai (SIMPEG)` di halaman Pegawai dilengkapi indikator loading, auto-refresh data, dan modal dialog rekapitulasi hasil (total data ditarik, total di-upsert, dan daftar data dilewati).
- **Fitur Dashboard & Laporan Excel**:
  - Endpoint analitik `GET /api/dashboard/stats` mengagregasi data usulan per status, per unit kerja (UNOR), per kategori field data, dan tren bulanan dalam tahun kalender via Drizzle ORM query.
  - Otorisasi data otomatis (RBAC): `AdminOPD` hanya memperoleh agregasi dan data laporan untuk UNOR miliknya (`scopeUnor`), sedangkan `Admin` Pusat mendapatkan statistik global lintas UNOR dengan kebebasan memilih filter spesifik.
  - Endpoint ekspor `GET /api/dashboard/export` menghasilkan file Microsoft Excel (.xlsx) menggunakan pustaka `exceljs`.
  - Halaman Dashboard SvelteKit 5 ditempatkan sebagai landing page utama (`/`) setelah autentikasi.
- **Frontend Web**: Menggunakan **SvelteKit 5** dengan TailwindCSS 4.
- **Fitur Dark Mode & Light Mode**:
  - Tailwind CSS v4 selector-based dark variant: Dikonfigurasikan melalui `@custom-variant dark (&:where(.dark, .dark *));`.
  - Default Tema: Light Mode secara default, dengan Dark Mode bertema deep navy-slate.
  - Pencegahan FOUC via inline script di `<head>` membaca `localStorage`.
- **Database**: Menggunakan MySQL dengan **Drizzle ORM**. Skema database dan relasi diletakkan di `packages/shared/src/schema`.
- **Fitur Usulan Ubah Data Pegawai**:
  - Struktur tabel: `usulan_perubahan`, `usulan_detail_field`, dan `usulan_dokumen`.
  - Lifecycle: `draft` -> `diajukan` -> (`disetujui` / `ditolak` / `dibatalkan`).
  - Scoping RBAC: `AdminOPD` hanya mengelola pegawai di UNOR-nya; `Admin` lintas UNOR.
- **Fitur Verifikasi Usulan (Admin Pusat)**:
  - Audit Trail: Kolom `verified_by`, `verified_at`, dan `catatan_verifikasi`.
  - Sinkronisasi Master Pegawai: Approval otomatis memperbarui data master pegawai bersangkutan di lokal.
- **Fitur Notifikasi In-App**:
  - Tabel `notifikasi` di MySQL berelasi dengan `users`.
  - UI `NotificationBell` di header dengan popover dan badge counter unread.

## 4. Known Issues / Technical Debt

- Belum ada implementasi test otomatis berbasis SvelteKit component (test backend Elysia telah mencakup 82 skenario pengujian komprehensif termasuk integrasi SIMPEG, notifikasi, dashboard stats, dan export excel).

## 5. Yang Sedang Dikerjakan (In Progress)

- Tidak ada (Seluruh cakupan fitur integrasi API SIMPEG BKD Trenggalek telah selesai diimplementasikan di backend dan frontend)

## 6. Yang Sengaja Belum Dikerjakan

- Deployment pipeline / CI/CD (Dockerfile & docker-compose sudah ada namun untuk production masih perlu konfigurasi lanjut).
