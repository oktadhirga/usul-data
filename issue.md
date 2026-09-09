# Fitur Autentikasi dan Manajemen User

Tugas ini bertujuan untuk mengimplementasikan fitur login user dan manajemen akun dengan sistem role-based access control (RBAC). Berikut adalah rincian kebutuhan fitur:

## 1. Skema Database (Tabel Users)
- Perbarui skema tabel `users` dengan kolom berikut:
  - `id` primary key autoincrement
  - `username` (string, unique)
  - `password_hash` (string)
  - `role` (enum/string: 'Admin', 'AdminOPD')
  - `kode_unor` (string, nullable - berisi kode unit kerja/OPD terkait)

## 2. Autentikasi
- Buat endpoint `POST /api/auth/login`: Menerima kredensial, verifikasi password, dan mengembalikan token JWT / Session.
- Buat endpoint `POST /api/auth/logout`: Membersihkan sesi/token.

## 3. Middleware Keamanan & Scoping
- **Auth Middleware & Role Guard**: Middleware untuk memastikan user sudah login dan memiliki role yang diizinkan untuk mengakses endpoint tertentu.
- **Middleware `resolveUnorScope`**: Middleware yang secara otomatis menyematkan `kode_unor` dari user yang login ke dalam context request untuk keperluan filter data (scoping) khusus role 'AdminOPD'.

## 4. Manajemen Akun (Khusus Role 'Admin')
- Sediakan endpoint CRUD akun untuk Admin Pusat.
- Fitur utama: Membuat akun untuk 'AdminOPD' dan melakukan penugasan (assign) nilai `kode_unor` kepada akun tersebut.

## 5. Fitur Profil
- Endpoint ganti password untuk pengguna yang sedang login.
