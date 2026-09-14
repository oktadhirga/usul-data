# Progress & Status Aplikasi: Usul Data Monorepo

> File ini diupdate SETIAP fitur/sub-fitur besar selesai — bukan tiap commit kecil.
> Tujuannya: siapapun (manusia atau AI) yang baru mulai sesi baru bisa cepat paham
> "aplikasi ini sekarang sudah bisa apa, dan kenapa dibangun begitu" tanpa harus
> baca seluruh git history atau semua PRD satu-satu.

Terakhir diupdate: 14 September 2026

---

## 1. Ringkasan Aplikasi
Aplikasi manajemen data (Usul Data) yang dikembangkan dengan arsitektur monorepo (Bun workspaces). Aplikasi ini memiliki backend API berbasis ElysiaJS dan frontend web berbasis SvelteKit 5. Database dikelola menggunakan Drizzle ORM dan MySQL. Saat ini, aplikasi memiliki fitur manajemen user, unit organisasi (UNOR), dan pegawai.

## 2. Fitur yang Sudah Ada

| Fitur | Status | Modul/Path | Catatan |
|---|---|---|---|
| **Autentikasi & Otorisasi** | Selesai | `users` / `/login` | Menggunakan JWT. Role yang tersedia: `Admin`, `AdminOPD`. |
| **Manajemen User** | Selesai | `users` / `/users` | CRUD User, dengan relasi ke Unit Organisasi (Kode UNOR). |
| **Manajemen Unit Organisasi (UNOR)** | Selesai | `unor` / `/unor` | CRUD UNOR. Data master untuk unit kerja pegawai & user OPD. |
| **Manajemen Pegawai** | Selesai | `pegawai` / `/pegawai` | CRUD Pegawai. Terhubung dengan tabel UNOR. |
| **Profil Pengguna** | Selesai | `users` / `/profile` | Menampilkan info user yang sedang login. |

## 3. Keputusan Arsitektur Penting

- **Monorepo**: Menggunakan workspace `bun` (`apps/api`, `apps/web`, `packages/shared`) untuk mempermudah sharing kode dan typing.
- **Backend API**: Menggunakan **ElysiaJS**.
- **Frontend Web**: Menggunakan **SvelteKit 5** dengan TailwindCSS 4.
- **Komunikasi API**: Frontend menggunakan **Eden Treaty** (`@elysiajs/eden`) untuk komunikasi yang type-safe dengan backend Elysia.
- **Database**: Menggunakan MySQL dengan **Drizzle ORM**. Skema database dan relasi diletakkan di `packages/shared/src/schema` agar bisa dipakai baik oleh API maupun Web (jika diperlukan untuk typing).
- **Relasi Database**:
  - `Pegawai` berelasi `one-to-many` dengan `Unor` (1 Unor punya banyak Pegawai).
  - `User` memiliki atribut `kodeUnor` untuk membatasi akses role `AdminOPD` ke data Unor tertentu.

## 4. Known Issues / Technical Debt

- Belum ada implementasi test yang komprehensif di SvelteKit (saat ini script test hanya echo string).

## 5. Yang Sedang Dikerjakan (In Progress)

- (Belum ada fitur baru yang sedang aktif dikerjakan, saat ini fokus pada stabilitas fitur dasar)

## 6. Yang Sengaja Belum Dikerjakan

- Deployment pipeline / CI/CD (Dockerfile & docker-compose sudah ada namun untuk production masih perlu konfigurasi lanjut).
