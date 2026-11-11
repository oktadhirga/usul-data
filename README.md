# ASN-Sync: Sistem Pengusulan & Verifikasi Data Pegawai ASN

<div align="center">
  <img src="apps/web/static/logo-trenggalek.svg" alt="Logo Pemkab Trenggalek" width="90" />
  <h3>Pemerintah Kabupaten Trenggalek</h3>
  <p>Aplikasi web monorepo untuk tata kelola pengusulan pembaruan data aparatur sipil negara (ASN) terintegrasi dengan SIMPEG BKD Kabupaten Trenggalek.</p>
</div>

---

## ⚡ Quickstart

### 1. Prasyarat
- [Bun](https://bun.sh/) (v1.2+)
- MySQL (v8.0+)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin berkas konfigurasi template:
```bash
cp .env.example .env
```
Sesuaikan parameter database MySQL dan driver penyimpanan di `.env`:
```ini
DATABASE_URL=mysql://root:password@localhost:3306/usul_db

# Pilihan driver penyimpanan: 'local' (disk lokal server) atau 'gdrive' (Google Drive)
STORAGE_DRIVER=local

# Integrasi SIMPEG BKD Trenggalek
MOCK_SIMPEG=false
SIMPEG_AUTH_USER=user_tes
SIMPEG_AUTH_PASS=password_tes
```

### 4. Setup Database & Seeding
Inisialisasi tabel dan data awal (Unit Organisasi, Pegawai awal, dan Akun Demo):
```bash
# Push skema tabel ke database
bun db:push

# Isi data seed awal
bun db:seed
```

### 5. Menjalankan Aplikasi

Jalankan seluruh modul secara bersamaan (API & Web Frontend):
```bash
bun dev
```
Aplikasi dapat diakses melalui:
- **Web Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

Untuk menjalankan modul secara terpisah:
```bash
bun dev:api   # Menjalankan backend ElysiaJS
bun dev:web   # Menjalankan frontend SvelteKit 5
```

---

## 👥 Akun Demo & Hak Akses (RBAC)

| Role | Username | Password | Deskripsi Tugas |
| :--- | :--- | :--- | :--- |
| **Admin Pusat** | `admin` | `admin123` | Akses penuh: verifikasi usulan, master UNOR, manajemen akun, sinkronisasi SIMPEG, dan ekspor analitik Excel lintas OPD. |
| **Verifikator** | `verifikator` | `verifikator123` | Meja kerja verifikasi: menyetujui (*approve*) atau menolak (*reject*) usulan perubahan data pegawai dari seluruh OPD. |
| **Admin OPD** | `opd_dinkes` | `opd123` | Pengusul: mengajukan usulan baru, melampirkan bukti PDF, dan mengedit usulan unit kerja Dinas Kesehatan (`UNOR-DINKES`). |

---

## 🧪 Menjalankan Pengujian (Tests)

Jalankan seluruh rangkaian automated unit & integration test:
```bash
bun test
```
Menjalankan pengujian spesifik per fitur:
```bash
bun test apps/api/src/usulan.test.ts      # Pengujian alur usulan, verifikasi & dokumen
bun test apps/api/src/auth.test.ts        # Pengujian otentikasi & RBAC (3 role)
bun test apps/api/src/simpeg.test.ts      # Pengujian integrasi API SIMPEG
```

---

## 🏗️ Struktur Monorepo

```
usul-data/
├── apps/
│   ├── api/             # Backend API (ElysiaJS, JWT, File Storage, ExcelJS)
│   └── web/             # Frontend Web (SvelteKit 5, Tailwind CSS v4, Lucide Svelte)
├── packages/
│   └── shared/          # Skema database Drizzle ORM, DTO, dan type TypeScript bersama
└── uploads/             # Direktori penyimpanan berkas PDF lokal (mode STORAGE_DRIVER=local)
```

