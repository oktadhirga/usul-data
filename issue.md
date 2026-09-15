# Planning Fitur Verifikasi Usulan

File ini berisi planning (tingkat menengah) untuk fitur verifikasi usulan perubahan data pegawai yang akan dieksekusi oleh junior programmer atau model AI. Pastikan membaca `PROGRESS.md` sebelum memulai implementasi.

## 1. Modifikasi Skema Database
Untuk kebutuhan audit dan pencatatan verifikasi, tambahkan field berikut langsung pada tabel `usulan_perubahan`:
- `verified_by` (varchar/uuid, berelasi dengan username admin/user)  
- `verified_at` (timestamp)
- `catatan` (text, opsional, utamanya digunakan saat usulan ditolak)

## 2. Backend (API ElysiaJS)
Buat endpoint baru untuk mendukung proses verifikasi (Admin Pusat):
- **Endpoint List Semua Usulan**
  - Mengambil daftar usulan untuk dashboard Admin Pusat.
  - Tambahkan fitur filter berdasarkan: **Kode UNOR**, **Status Usulan**, dan **Kategori Usulan**.
- **Endpoint Detail Usulan & Dokumen**
  - Mengembalikan rincian data usulan dari tabel `usulan_perubahan`, detail field dari `usulan_detail_field`, dan data berkas pendukung dari `usulan_dokumen`.
- **Endpoint Approve Usulan**
  - Mengubah status usulan menjadi `disetujui`.
  - Mengisi field `verified_by` dan `verified_at`.
  - **Krusial**: Memicu trigger/update pada tabel data utama `pegawai` sesuai data baru yang ada di `usulan_detail_field` (Catatan: Untuk usulan jenis `hapus`, **tidak ada** tindakan update/delete data fisik secara otomatis yang diperlukan, biarkan apa adanya).
- **Endpoint Reject Usulan**
  - Mengubah status usulan menjadi `ditolak`.
  - Wajib mengirimkan *catatan alasan penolakan* dari Admin.
  - Mengisi field `verified_by`, `verified_at`, dan `catatan`.

## 3. Frontend (SvelteKit)
Buat antarmuka (UI) untuk Admin Pusat memproses usulan:
- **Dashboard Verifikasi (Admin Pusat)**
  - Halaman untuk menampilkan tabel list semua usulan.
  - Sediakan UI filter (berdasarkan UNOR, Status, dan Kategori) beserta pagination.
- **Halaman Detail Usulan & Aksi**
  - Tampilkan ringkasan usulan dan komparasi (jika ada data lama vs data baru).
  - Sediakan akses ke dokumen pendukung. Dokumen harus dapat dipreview dengan mekanisme **buka di tab baru (open in new tab)**.
  - Sediakan dua tombol aksi utama: **Approve** dan **Reject**.
  - Saat klik **Reject**, harus muncul modal/dialog input untuk memasukkan alasan penolakan sebelum disubmit ke endpoint.
