# Planning Fitur Dashboard dan Laporan

## Deskripsi Singkat
Implementasi fitur dashboard sebagai halaman utama (*landing page*) untuk melihat ringkasan statistik usulan perubahan data, beserta kemampuan export laporan ke format Excel (.xlsx). Eksekusi ini mencakup backend (API) dan frontend (Web), dengan tetap memperhatikan hak akses role (Admin vs AdminOPD).

## 1. Backend (apps/api)
- **Endpoint Statistik (`GET /dashboard/stats`)**
  - Buat query menggunakan Drizzle ORM untuk mengambil agregasi data dari tabel `usulan_perubahan`.
  - Agregasi yang diperlukan:
    - Jumlah usulan berdasarkan **status** (diajukan, disetujui, ditolak, dll).
    - Jumlah usulan berdasarkan **periode** (bulan/tahun).
    - Jumlah usulan berdasarkan **UNOR** (unit organisasi).
  - **Otorisasi / RBAC**: Jika user yang mengakses adalah `AdminOPD`, *wajib* filter data berdasarkan `kodeUnor` user tersebut (hanya melihat data UNOR-nya). `Admin` Pusat dapat melihat semua data.
- **Endpoint Export (`GET /dashboard/export`)**
  - Buat endpoint untuk mendownload daftar laporan usulan.
  - Endpoint ini menerima query parameter (seperti periode, status, unor) dan mengembalikan file dalam format **Excel (.xlsx)**. (Catatan: bisa pertimbangkan penambahan *library* pendukung seperti `exceljs` atau `xlsx` untuk men-generate file Excel di sisi server).

## 2. Frontend (apps/web)
- **Halaman Dashboard UI (`/` - Halaman Utama setelah Login)**
  - Jadikan halaman Dashboard ini sebagai default routing (rute pendaratan) sesudah user berhasil login.
  - Buat UI Dashboard yang responsif menggunakan SvelteKit 5 dan TailwindCSS 4.
  - Tampilkan *Summary Cards* (Kartu Ringkasan) untuk metrik utama: Total Usulan, Disetujui, Ditolak, dan Menunggu Verifikasi.
  - Buat komponen tabel atau list standar untuk melihat sebaran per UNOR (bagi Admin) atau tren bulanan (Sementara ini **tidak** menggunakan *library* grafik tambahan/chart).
  - Fetch data menggunakan modul API client yang sudah ada.
- **Tombol Export**
  - Tambahkan tombol "Export Data (Excel)" di UI Dashboard.
  - Saat diklik, panggil endpoint export dan picu browser untuk mengunduh file `.xlsx` hasil export.

## 3. Packages Shared (packages/shared)
- Tidak ada perubahan skema database (schema/tabel baru) yang diperlukan. Cukup manfaatkan tabel `usulan_perubahan`, `pegawai`, dan `unor` yang sudah ada, serta membuat query yang efisien.
