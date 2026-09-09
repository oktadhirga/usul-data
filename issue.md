# Project Setup Plan

Tugas ini adalah melakukan setup awal project dengan arsitektur monorepo. Silakan ikuti langkah-langkah di bawah ini.

## 1. Monorepo Setup
- Inisialisasi project root menggunakan Bun.
- Konfigurasi Bun workspaces pada `package.json`.
- Buat struktur direktori berikut:
  - `apps/api`
  - `apps/web`
  - `packages/shared`

## 2. Backend Setup (apps/api)
- Inisialisasi project menggunakan Elysia.
- Buat struktur folder dasar:
  - `src/routes/` (untuk mendefinisikan endpoint)
  - `src/services/` (untuk business logic)
  - `src/middleware/` (untuk interceptor/plugin)

## 3. Frontend Setup (apps/web)
- Inisialisasi project menggunakan SvelteKit.
- Install dan setup Tailwind CSS.

## 4. Database Setup
- Gunakan MySQL sebagai database.
- Install Drizzle ORM dan konektor yang diperlukan.
- Setup skema database dan koneksi (dapat diletakkan di `packages/shared` atau `apps/api`).
- Sediakan skrip npm/bun untuk melakukan generate dan run migrasi database.

## 5. CI/CD Setup
- Buat konfigurasi GitHub Actions di `.github/workflows/ci.yml`.
- Tambahkan proses berikut di dalam pipeline:
  - Lint code
  - Type-check (TypeScript)
  - Test

## 6. Environment & Deployment Setup
- Buat file `.env.example` yang mendefinisikan semua environment variable yang dibutuhkan (seperti URL database, port, dsb).
- Siapkan konfigurasi dasar untuk deployment (seperti Dockerfile atau skrip build di `package.json` root).
