# Progress & Status Aplikasi: ASN-Sync (Usul Data Monorepo)

> File ini diupdate SETIAP fitur/sub-fitur besar selesai — bukan tiap commit kecil.
> Tujuannya: siapapun (manusia atau AI) yang baru mulai sesi baru bisa cepat paham
> "aplikasi ini sekarang sudah bisa apa, dan kenapa dibangun begitu" tanpa harus
> baca seluruh git history atau semua PRD satu-satu.

Terakhir diupdate: 10 November 2026

---

## 1. Ringkasan Aplikasi
Aplikasi manajemen dan sinkronisasi usulan data kepegawaian aparatur sipil negara (**ASN-Sync**) yang dikembangkan dengan arsitektur monorepo (Bun workspaces). Aplikasi ini memiliki backend API berbasis ElysiaJS dan frontend web berbasis SvelteKit 5. Database dikelola menggunakan Drizzle ORM dan MySQL. Saat ini, aplikasi memiliki fitur manajemen user, unit organisasi (UNOR), pegawai, pengajuan usulan perubahan data pegawai, verifikasi usulan oleh Admin Pusat, dashboard analitik & ekspor Excel, tema tampilan Dark/Light Mode, integrasi penarikan data dari API SIMPEG BKD Trenggalek, serta sistem penyimpanan berkas pendukung usulan yang fleksibel (Google Drive 2 TB cloud storage dan local server disk storage) dengan format penamaan otomatis `[NIP]_[jenisfile].pdf`.

## 2. Fitur yang Sudah Ada

| Fitur | Status | Modul/Path | Catatan |
|---|---|---|---|
| **Autentikasi & Otorisasi** | Selesai | `users` / `/login` | Menggunakan JWT. Role yang tersedia: `Admin`, `AdminOPD`. |
| **Manajemen User** | Selesai | `users` / `/users` | CRUD User, dengan relasi ke Unit Organisasi (Kode UNOR). |
| **Manajemen Unit Organisasi (UNOR)** | Selesai | `unor` / `/unor` | CRUD UNOR. Data master untuk unit kerja pegawai & user OPD. Dilengkapi pencarian instan (nama/kode), kartu unit kerja ringkas, serta komponen terpadu `UnorCombobox` (Searchable Dropdown) yang diterapkan di seluruh filter dan formulir unit kerja di aplikasi. |
| **Manajemen Pegawai** | Selesai | `pegawai` / `/pegawai` | CRUD Pegawai. Terhubung dengan tabel UNOR. Dilengkapi pagination backend & frontend (10/25/50/100 per halaman) agar responsif untuk ribuan data, serta filter pencarian instan Unit Organisasi (Searchable Combobox) untuk Admin Pusat. |
| **Profil Pengguna** | Selesai | `users` / `/profile`, Layout Header | Menampilkan info user yang sedang login, peran, dan form ubah password. Dilengkapi dropdown menu profil interaktif dan tombol aksi cepat "Keluar" (Logout) langsung di header atas (desktop & mobile) serta layout fixed viewport yang bebas dari keharusan scroll ke bawah saat membuka tabel data panjang. |
| **Usulan Ubah Data Pegawai** | Selesai | `usulan` / `/usulan`, `/usulan/baru` | Pengajuan perubahan data via wizard 5 langkah, upload berkas PDF (maks 1 MB), pembatalan usulan, edit & ajukan kembali usulan dibatalkan/draft, serta hapus usulan secara permanen (DB cascade & berkas fisik). |
| **Verifikasi Usulan Pegawai** | Selesai | `usulan` / `/verifikasi` | Dashboard Admin Pusat untuk verifikasi usulan masuk, preview dokumen PDF di tab baru, approval (memicu sinkronisasi update otomatis ke tabel pegawai), penolakan dengan catatan wajib, serta pencatatan audit log verifikator (`verified_by` username & `verified_at`). |
| **Notifikasi In-App** | Selesai | `notifikasi` / Header Bell | Notifikasi perubahan status usulan (diajukan, disetujui, ditolak) untuk Admin & AdminOPD, icon lonceng di header, badge jumlah unread, popover dropdown interaktif, dan penanda dibaca. |
| **Dashboard & Laporan Excel** | Selesai | `dashboard` / `/` | Dashboard ringkasan analitik usulan perubahan data aparatur sipil (5 Summary Cards: total, diajukan, disetujui, ditolak, draft/batal; distribusi per UNOR; distribusi per kategori; rekap aktivitas bulanan), filter interaktif tahun/bulan/status/UNOR, dan export laporan lengkap berformat Excel (.xlsx) dengan otorisasi RBAC (Admin Pusat vs AdminOPD). |
| **Dark Mode & Light Mode** | Selesai | `web` / Header Toggle | Dukungan tema ganda (Light Mode sebagai default dan Dark Mode), toggle switch Sun/Moon di header (mobile & desktop) dan halaman login, pencegahan flash (anti-FOUC) di `app.html`, persistensi `localStorage`, serta adaptasi penuh styling Tailwind CSS v4 di seluruh halaman & komponen UI. |
| **Integrasi API SIMPEG** | Selesai | `simpeg` / `/unor`, `/pegawai` | Sinkronisasi data terpisah dari API SIMPEG BKD Trenggalek (`/unit_kerja` dan `/pegawai`) via Basic Auth. Dilengkapi auto-pagination batch loop untuk menarik seluruh 9.800+ pegawai secara tuntas dalam hitungan detik (bulk upsert `ON DUPLICATE KEY UPDATE`), filter khusus Unit Induk (44 OPD berakhiran `00000000`) untuk penarikan UNOR, pembersihan sub-unit yatim, validasi strict foreign key UNOR, dan modal laporan sinkronisasi. |
| **Penyimpanan Berkas (Storage Driver Switch: Local & Google Drive)** | Selesai | `usulan` / `drive-providers` | Penyimpanan berkas pendukung usulan (PDF) fleksibel dengan switch driver via `.env` (`STORAGE_DRIVER=local` atau `gdrive`). Format penamaan berkas otomatis terstandarisasi `[NIP]_[jenisfile].pdf` (contoh: `19891003200903000_IjazahSMK.pdf`, `19891003200903000_KTP.pdf`) dengan datalist opsi cepat dan live preview nama di formulir usulan. Pada mode `local`, file disimpan di disk server lokal (`/uploads/...`) dengan endpoint stream. Pada mode `gdrive`, berkas langsung diunggah ke Google Drive instansi menggunakan OAuth 2.0 (Refresh Token) dengan struktur folder per NIP, soft-delete ke sampah Google Drive, dan direct Google Drive Viewer. Provider Pattern mencakup `LocalStorageProvider`, `MockDriveProvider`, dan `GoogleDriveProvider`. |

## 3. Keputusan Arsitektur Penting

- **Monorepo**: Menggunakan workspace `bun` (`apps/api`, `apps/web`, `packages/shared`) untuk mempermudah sharing kode dan typing.
- **Backend API**: Menggunakan **ElysiaJS**.
- **Fitur Penyimpanan Berkas & Storage Driver Switch (`STORAGE_DRIVER`)**:
  - **Satu Codebase, Beralih Instan via `.env`**: Cukup atur `STORAGE_DRIVER=local` atau `STORAGE_DRIVER=gdrive` di `.env` tanpa perlu berganti branch Git.
  - **Driver `local`**: Berkas disimpan di direktori disk server (`/uploads/`), disajikan via route `/api/uploads/:filename`, dan dihapus dari disk saat usulan dihapus.
  - **Driver `gdrive`**: Berkas diunggah ke Google Drive akun 2 TB instansi via OAuth 2.0 (`GDRIVE_REFRESH_TOKEN`), diatur izin publik baca, dan dipindahkan ke tempat sampah (*soft-delete*) saat usulan dihapus.
  - **Struktur Folder Terorganisir per NIP**: Pada Google Drive, dokumen usulan dikelompokkan otomatis di bawah folder NIP pegawai bersangkutan (`Root > [NIP] > [usulanId]_[timestamp]_[filename]`).
  - **Kompatibilitas Mundur (Backward Compatibility)**: Helper `resolveDocUrl` di frontend secara cerdas mendeteksi apakah berkas berada di Google Drive (URL absolut `https://...`) atau disk lokal (path relatif `/uploads/...`), sehingga berkas lokal lama dan berkas Google Drive baru dapat dibuka bersamaan secara transparan.
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
- **Frontend Web & Component Testing**:
  - Menggunakan **SvelteKit 5** (Runes mode) dengan TailwindCSS 4.
  - **Automated Component Testing**:
    - Test runner: **Vitest** dengan environment DOM **`happy-dom`** yang terintegrasi penuh dengan runtime Bun monorepo.
    - Pustaka: **`@testing-library/svelte`** v5, **`@testing-library/user-event`**, dan **`@testing-library/jest-dom/vitest`**.
    - Global Setup (`apps/web/src/test-setup.ts`): Otomatisasi cleanup DOM per-test, registrasi matcher jest-dom, serta mocking modul bawaan SvelteKit (`$app/stores`, `$app/navigation`, `$app/environment`).
    - Suite Pengujian Ter-colocate:
      - Primitif UI: `Button` (`button.test.ts`), `Input` (`input.test.ts`), `Badge` (`badge.test.ts`), `Alert` (`alert.test.ts`).
      - Komponen Interaktif: `ThemeToggle` (`ThemeToggle.test.ts`), `NotificationBell` (`NotificationBell.test.ts`).
    - Skrip: `test` (`vitest run`), `test:watch` (`vitest`), `test:coverage` (`vitest run --coverage` via `@vitest/coverage-v8`). Terintegrasi langsung dengan perintah root `bun run test`.
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

- **Kesiapan Deployment Produksi VPS (On-Premise Virtualmin & Apache)**:
  - Migrasi SvelteKit (`apps/web`) ke `@sveltejs/adapter-node` mandiri untuk produksi.
  - Penyiapan `docker-compose.prod.yml` terisolasi (API: `127.0.0.1:3000`, Web: `127.0.0.1:3001`, Volume `./uploads`).
  - Template konfigurasi Apache Reverse Proxy (`deploy/apache-asn-sync.conf`) untuk subdomain `asn-sync.bkpsdm.trenggalekkab.go.id`.
  - Template `.env.production.example` & script migrasi database mandiri (`deploy/migrate.sh`).
  - Workflow GitHub Actions CI/CD (`.github/workflows/deploy.yml`) untuk auto-deploy via SSH.
  - Panduan operasional langkah demi langkah (`deploy/PANDUAN_DEPLOY_VPS.md`).

## 4. Known Issues / Technical Debt

- Tidak ada technical debt kritis. Backend API Elysia telah memiliki 104 pengujian komprehensif, Frontend Web SvelteKit 5 telah dilengkapi dengan 27 pengujian otomatis komponen berbasis Vitest & Testing Library. Code review lima-sumbu telah dieksekusi dengan perbaikan dead code, parameter binding, dan RBAC hardening. Seluruh build produksi (`apps/api` dan `apps/web`) telah diverifikasi sukses 100%.

## 5. Yang Sedang Dikerjakan (In Progress)

- Tidak ada (Persiapan deployment ke VPS on-premise selesai).

## 6. Yang Sengaja Belum Dikerjakan

- Eksekusi langsung di server VPS (menunggu input kredensial SSH / eksekusi manual oleh administrator server sesuai panduan).
