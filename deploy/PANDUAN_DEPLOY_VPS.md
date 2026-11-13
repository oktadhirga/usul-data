# 🚀 Panduan Lengkap Deployment Produksi ke VPS On-Premise BKPSDM

Dokumen ini adalah panduan langkah demi langkah untuk mengonfigurasi dan mendeploy aplikasi **Usul Data Kepegawaian (ASN Sync)** ke server VPS on-premise milik BKPSDM Trenggalek yang menggunakan distro berbasis **RHEL / CentOS / AlmaLinux / Rocky Linux** dengan **Virtualmin & Apache (`httpd`)**.

---

## 📌 Ringkasan Spesifikasi Server & Domain

- **Host Domain Eksisting:** `bkpsdm.trenggalekkab.go.id` (dikelola oleh Apache `httpd` & Virtualmin)
- **Subdomain Aplikasi Baru:** `asn-sync.bkpsdm.trenggalekkab.go.id`
- **Spesifikasi Server:** RAM 8 GB, Storage 256 GB, OS Linux (RHEL / CentOS / AlmaLinux / Rocky Linux)
- **Web Server:** Apache `httpd` (Konfigurasi di `/etc/httpd/conf.d/`)
- **Port Internal Docker:**
  - Frontend Web (SvelteKit): `127.0.0.1:3001`
  - Backend API (ElysiaJS): `127.0.0.1:3000`
- **Database:** MySQL/MariaDB Lokal/Eksternal instansi

---

## 🧭 Langkah 1: Persiapan DNS Record

Sebelum sertifikat SSL Let's Encrypt dapat diterbitkan, pastikan DNS record sudah diarahkan ke IP VPS:
1. Buka panel DNS manajemen domain `trenggalekkab.go.id`.
2. Tambahkan **A Record**:
   - **Host / Name:** `asn-sync.bkpsdm` (atau `asn-sync` jika di zona `bkpsdm.trenggalekkab.go.id`)
   - **Target / Value:** `<IP_PUBLIK_VPS_ANDA>`
   - **TTL:** 300 (atau default)
3. Uji dari terminal laptop/server:
   ```bash
   ping asn-sync.bkpsdm.trenggalekkab.go.id
   ```
   Pastikan sudah mengarah ke IP VPS Anda.

---

## 🧭 Langkah 2: Terbitkan Sertifikat SSL Let's Encrypt

### Cara Menerbitkan SSL via Terminal SSH (Certbot):
1. Pastikan Certbot terpasang:
   ```bash
   sudo dnf install -y certbot python3-certbot-apache || sudo yum install -y certbot python3-certbot-apache
   ```

2. Jalankan penerbitan sertifikat:
   ```bash
   sudo certbot certonly --apache -d asn-sync.bkpsdm.trenggalekkab.go.id
   ```
   > 💡 **TIPS PENTING:** 
   > Menggunakan flag `certonly` memastikan Certbot hanya menerbitkan sertifikat tanpa mengubah konfigurasi VirtualHost bawaan di `httpd.conf` yang bisa mengganggu web utama BKPSDM.
   > 
   > Jika Anda sudah terlanjur menjalankan `sudo certbot --apache -d ...` dan muncul pertanyaan:
   > `Which virtual host would you like to choose?`
   > **Ketik `c` (Cancel)**. Sertifikatnya sebenarnya sudah tersimpan di `/etc/letsencrypt/live/asn-sync.bkpsdm.trenggalekkab.go.id/`.

3. Verifikasi file sertifikat sudah terbentuk:
   ```bash
   sudo ls -l /etc/letsencrypt/live/asn-sync.bkpsdm.trenggalekkab.go.id/
   ```
   Pastikan file `fullchain.pem` dan `privkey.pem` ada.

---

## 🧭 Langkah 3: Konfigurasi VirtualHost Apache (`httpd`)

Pada CentOS / RHEL / AlmaLinux, modul proxy (`mod_proxy`, `mod_proxy_http`, `mod_headers`, `mod_rewrite`) **sudah aktif secara otomatis bawaan sistem**. Perintah `a2enmod` (milik Ubuntu) tidak diperlukan di sini.

1. Periksa ketersediaan modul di `httpd`:
   ```bash
   httpd -M | grep -E 'proxy|headers|ssl|rewrite'
   ```
   *(Pastikan muncul `proxy_module`, `proxy_http_module`, `headers_module`, `ssl_module`, dan `rewrite_module`).*

2. Buat file VirtualHost baru untuk `asn-sync` di `/etc/httpd/conf.d/`:
   ```bash
   sudo nano /etc/httpd/conf.d/asn-sync.conf
   ```

3. Paste seluruh konfigurasi berikut:
   ```apache
   <VirtualHost *:80>
       ServerName asn-sync.bkpsdm.trenggalekkab.go.id
       ServerAdmin admin@trenggalekkab.go.id

       # Redirect seluruh HTTP ke HTTPS
       RewriteEngine On
       RewriteCond %{HTTPS} off
       RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

       ErrorLog /var/log/httpd/asn-sync_error.log
       CustomLog /var/log/httpd/asn-sync_access.log combined
   </VirtualHost>

   <VirtualHost *:443>
       ServerName asn-sync.bkpsdm.trenggalekkab.go.id
       ServerAdmin admin@trenggalekkab.go.id

       SSLEngine on
       SSLCertificateFile /etc/letsencrypt/live/asn-sync.bkpsdm.trenggalekkab.go.id/fullchain.pem
       SSLCertificateKeyFile /etc/letsencrypt/live/asn-sync.bkpsdm.trenggalekkab.go.id/privkey.pem

       # Reverse Proxy ke Kontainer Docker Internal
       ProxyPreserveHost On
       ProxyRequests Off

       RequestHeader set X-Forwarded-Proto "https"
       RequestHeader set X-Forwarded-Port "443"

       # 1. Routing Backend API (Port 3000)
       ProxyPass /api http://127.0.0.1:3000/api
       ProxyPassReverse /api http://127.0.0.1:3000/api

       # 2. Routing Unduhan / Berkas Usulan (Port 3000)
       ProxyPass /uploads http://127.0.0.1:3000/uploads
       ProxyPassReverse /uploads http://127.0.0.1:3000/uploads

       # 3. Routing Frontend Web SvelteKit (Port 3001)
       ProxyPass / http://127.0.0.1:3001/
       ProxyPassReverse / http://127.0.0.1:3001/

       # Batas upload file 10MB
       LimitRequestBody 10485760

       ErrorLog /var/log/httpd/asn-sync_ssl_error.log
       CustomLog /var/log/httpd/asn-sync_ssl_access.log combined
   </VirtualHost>
   ```
   *Simpan dengan menekan `Ctrl + O` $\rightarrow$ `Enter`, lalu `Ctrl + X` untuk keluar.*

4. Uji sintaks dan terapkan konfigurasi:
   ```bash
   sudo apachectl configtest
   ```
   Jika muncul **`Syntax OK`**, terapkan perubahan:
   ```bash
   sudo systemctl reload httpd
   ```

---

## 🧭 Langkah 4: Persiapan Aplikasi di VPS

1. Buat direktori aplikasi di VPS (misalnya di `/opt/asn-sync`):
   ```bash
   sudo mkdir -p /opt/asn-sync
   sudo chown -R $USER:$USER /opt/asn-sync
   cd /opt/asn-sync
   ```

2. Clone repository Git Anda:
   ```bash
   git clone <URL_REPOSITORY_ANDA> .
   ```

3. Siapkan file `.env`:
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   **Isi variabel penting:**
   - `DATABASE_URL`: jika database MySQL ada di host VPS, gunakan `host.docker.internal`:
     ```env
     DATABASE_URL=mysql://dbuser:passwordku@host.docker.internal:3306/nama_database
     ```
   - `JWT_SECRET`: isi dengan 32+ karakter acak.
   - `APP_ORIGIN`: `https://asn-sync.bkpsdm.trenggalekkab.go.id`
   - `PUBLIC_API_URL`: `https://asn-sync.bkpsdm.trenggalekkab.go.id`
   - `SIMPEG_*`: sesuaikan kredensial endpoint SIMPEG Trenggalek.

4. Buat folder penyimpanan uploads fisik:
   ```bash
   mkdir -p uploads
   chmod 775 uploads
   ```

---

## 🧭 Langkah 5: Jalankan Kontainer Docker Produksi

1. Jalankan Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

2. Periksa status kontainer:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   Pastikan kontainer `usul_data_api` dan `usul_data_web` berada dalam status `Up`.

3. Jalankan migrasi database perdana:
   ```bash
   chmod +x deploy/migrate.sh
   ./deploy/migrate.sh
   ```

4. Buka browser dan akses:
   👉 **`https://asn-sync.bkpsdm.trenggalekkab.go.id`**

---

## 🧭 Langkah 6: Pembaruan Aplikasi di Masa Depan (Via VPN)

Karena VPS Anda berada di dalam jaringan tertutup yang mewajibkan **koneksi VPN**:
- Server GitHub publik tidak dapat mengakses port SSH VPS secara langsung.
- Gunakan skrip cepat **`deploy/update.sh`** untuk pembaruan fitur di masa depan.

### Cara Melakukan Update Aplikasi:
1. Hubungkan **VPN** instansi di komputer/laptop Anda.
2. Login ke VPS via SSH:
   ```bash
   ssh user@ip_vps_anda
   ```
3. Masuk ke folder aplikasi dan jalankan 1 perintah pembaruan:
   ```bash
   cd /opt/asn-sync
   chmod +x deploy/update.sh
   ./deploy/update.sh
   ```
4. Skrip tersebut secara otomatis akan:
   - Mengambil commit terbaru dari branch `main` (`git fetch & reset`).
   - Membangun ulang kontainer Docker (`build`).
   - Me-restart kontainer (`up -d`).
   - Membersihkan image usang (`docker image prune`).
   - Menampilkan status kontainer yang sedang aktif.

---

## 🛠️ Perintah Berguna untuk Pemeliharaan di Server

- **Update Aplikasi Cepat:**
  ```bash
  ./deploy/update.sh
  ```
- **Melihat Log Kontainer Real-time:**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f --tail=50
  ```
- **Restart Kontainer:**
  ```bash
  docker compose -f docker-compose.prod.yml restart
  ```
- **Menjalankan Migrasi Database Manual (jika ada tabel/kolom baru):**
  ```bash
  ./deploy/migrate.sh
  ```
- **Menjalankan Feeder Akun Pengguna OPD:**
  ```bash
  chmod +x deploy/feed_users.sh && ./deploy/feed_users.sh
  ```
- **Cek Error Log Apache:**
  ```bash
  sudo tail -f /var/log/httpd/asn-sync_ssl_error.log
  ```
- **Melihat Penggunaan Memori & CPU Docker:**
  ```bash
  docker stats
  ```
