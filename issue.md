# Planning Fitur: Usulan Ubah Data Pegawai

Dokumen ini berisi panduan tingkat tinggi (high-level) untuk implementasi fitur "Usulan Ubah Data Pegawai" pada arsitektur Usul Data Monorepo (ElysiaJS + SvelteKit 5 + Drizzle ORM).

## 1. Skema Database (Drizzle ORM)
Tambahkan tabel berikut pada `packages/shared/src/schema`:
- `usulan_perubahan`: 
  - Menyimpan header usulan. 
  - Relasi ke: `pegawai` (id pegawai) dan `unor` (kode_unor pengusul).
  - Field status: enum (draft, diajukan, dibatalkan, disetujui, ditolak).
- `usulan_detail_field`: 
  - Menyimpan field spesifik yang diusulkan perubahannya.
  - Relasi ke: `usulan_perubahan`.
  - Field: `jenis_usulan` (enum: tambah, ubah, hapus), `kategori_ubah` (enum: Data Pribadi, Data Keluarga, Golongan, Jabatan, Pendidikan, Pindah Instansi, Diklat/Kursus), `field_name` (free text), `nilai_lama` (free text), `nilai_baru` (free text).
- `usulan_dokumen`: 
  - Menyimpan metadata dokumen pendukung.
  - Relasi ke: `usulan_perubahan`.
  - Field: nama_dokumen, path_file, tipe_dokumen.

## 2. Backend API (ElysiaJS)
Tambahkan route baru di `apps/api/src/routes/usulan.route.ts` dan logic di `services`:
- `POST /api/usulan`: Create usulan baru dengan status awal `draft`.
- `POST /api/usulan/:id/dokumen`: Endpoint untuk upload dokumen pendukung.
  - *Sistem File*: File disimpan di storage lokal server dalam folder `/uploads`.
  - *Validasi*: Hanya menerima file berekstensi **PDF** dengan batas ukuran maksimum **1 MB**.
- `POST /api/usulan/:id/submit`: Mengubah status usulan dari `draft` menjadi `diajukan`.
  - *Validasi*: Jika `jenis_usulan` adalah `tambah` atau `ubah`, sistem wajib memastikan ada minimal 1 dokumen yang dilampirkan. Untuk `hapus`, dokumen tidak wajib.
- `GET /api/usulan`: Menampilkan list usulan (termasuk filter otomatis berdasarkan `kodeUnor` user login dan filter kueri `status`).
- `POST /api/usulan/:id/cancel`: Membatalkan usulan. *Kondisi*: hanya bisa dilakukan jika status saat ini adalah `diajukan`.

## 3. Frontend Web (SvelteKit 5)
Buat halaman dan komponen berikut di `apps/web/src/routes/usulan`:
- **UI Form Usulan Perubahan** (Bisa berupa halaman `/usulan/create` atau dialog modal):
  - Step 1: Pilih pegawai (berdasarkan daftar pegawai di UNOR yang bersangkutan).
  - Step 2: Pilih jenis usulan (tambah, ubah, hapus) & kategori (berdasarkan daftar opsi).
  - Step 3: Input rincian perubahan (field nama, lama & baru berbasis free text).
  - Step 4: Upload dokumen pendukung (PDF, maks 1MB). Dokumen wajib diunggah untuk jenis usulan `tambah` dan `ubah`, namun opsional untuk jenis usulan `hapus`.
- **UI Halaman Riwayat Usulan** (`/usulan`):
  - Menampilkan tabel riwayat usulan per UNOR.
  - Dropdown filter untuk menyaring daftar berdasarkan status.
  - Tombol aksi: Lanjutkan Draft (jika draft), Batalkan (jika diajukan), dan Lihat Detail.

## 4. Konfirmasi Keputusan (Terkunci)
Berdasarkan kesepakatan spesifikasi, implementator perlu mengikuti aturan ini:
1. **Penyimpanan Dokumen**: Sementara menggunakan server lokal pada folder `/uploads`.
2. **Validasi File**: Maksimal file adalah **1 MB** dan ekstensi harus **PDF**.
3. **Status Lanjutan**: Untuk fase ini, alur usulan berhenti di status `diajukan`. Aksi persetujuan (`disetujui`/`ditolak`) oleh Admin Utama akan dikembangkan pada tiket/tahap berikutnya.
4. **Format Kategori & Field**: Nilai `kategori_ubah` wajib berupa *enum options* (Data Pribadi, Data Keluarga, Golongan, Jabatan, Pendidikan, Pindah Instansi, Diklat/Kursus). `jenis_usulan` bernilai: `tambah`, `ubah`, dan `hapus`. Sisa rincian field masih *free text*.
5. **Kewajiban Dokumen**: Usulan dengan jenis `tambah` dan `ubah` mewajibkan upload dokumen pendukung, sedangkan `hapus` tidak.

---
*Catatan Eksekutor (Junior Dev / AI): Gunakan prinsip yang sudah tercantum di PROGRESS.md. Gunakan Drizzle ORM untuk tabel. Di sisi SvelteKit, wajib gunakan Elysia Eden Treaty untuk pemanggilan API dan komponen UI Svelte yang sudah tersedia.*
