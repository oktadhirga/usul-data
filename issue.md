# Fitur Data Pegawai

Tugas ini adalah untuk mengimplementasikan fitur manajemen data pegawai, meliputi penambahan skema database, API endpoint, dan antarmuka pengguna (UI).

## 1. Skema Database

Tambahkan skema tabel berikut:

### Tabel `unor` (Unit Organisasi)
- `id` (primary key, autoincrement)
- `kode_unor` (string, unique)
- `nama_unor` (string)

### Tabel `pegawai`
- `id` (primary key, autoincrement)
- `NIP` (string, unique)
- `nama` (string)
- `jabatan` (string)
- `kode_unor` (string, foreign key mengarah ke `unor.kode_unor`)

## 2. API Endpoints

Buat endpoint berikut:
- **List Pegawai**: Mengambil daftar pegawai. Pastikan ada implementasi filter berdasarkan `kode_unor` sesuai role user yang mengakses (Admin vs AdminOPD).
- **Detail Pegawai**: Mengambil detail lengkap dari seorang pegawai.

## 3. User Interface (UI)

Buat antarmuka (menggunakan SvelteKit dan komponen UI yang sudah ada):
- **Halaman Daftar Pegawai**: Tampilan tabel yang memuat daftar pegawai pada suatu unor.
- **Halaman Detail Pegawai**: Tampilan untuk melihat seluruh kategori data dari satu pegawai secara spesifik.

Jangan mengubah kode/fitur lain yang tidak bersangkutan dengan pengerjaan fitur ini.