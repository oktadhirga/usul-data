#!/usr/bin/env bash
# ==============================================================================
# Script Update Cepat Aplikasi di VPS (Digunakan saat terhubung VPN)
# Jalankan di terminal VPS:
# chmod +x deploy/update.sh && ./deploy/update.sh
# ==============================================================================

set -e

# Warna output terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}🚀 Memulai Pembaruan Aplikasi Usul Data Kepegawaian...${NC}"
echo -e "${BLUE}======================================================${NC}"

# Pastikan berada di direktori root aplikasi
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"
echo -e "${YELLOW}📂 Direktori kerja:${NC} $PROJECT_DIR"

# 1. Ambil kode terbaru dari Git
echo -e "\n${YELLOW}📥 [1/4] Mengambil perubahan terbaru dari Git...${NC}"
git fetch origin main
git reset --hard origin/main

# 2. Build ulang kontainer Docker produksi
echo -e "\n${YELLOW}📦 [2/4] Membangun ulang kontainer Docker (Web & API)...${NC}"
docker compose -f docker-compose.prod.yml build

# 3. Jalankan kembali kontainer baru
echo -e "\n${YELLOW}🔄 [3/5] Me-restart kontainer aplikasi...${NC}"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 4. Jalankan migrasi database otomatis (jika ada skema/tabel baru)
echo -e "\n${YELLOW}🗄️ [4/5] Memeriksa dan menjalankan migrasi database...${NC}"
chmod +x "$PROJECT_DIR/deploy/migrate.sh"
"$PROJECT_DIR/deploy/migrate.sh"

# 5. Bersihkan image Docker usang/dangling
echo -e "\n${YELLOW}🧹 [5/5] Membersihkan cache image lama...${NC}"
docker image prune -f

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}✅ Pembaruan selesai dan aplikasi berhasil berjalan!${NC}"
echo -e "${GREEN}======================================================${NC}"

# Tampilkan status kontainer yang sedang berjalan
echo -e "\n📊 Status Kontainer Aktif:"
docker compose -f docker-compose.prod.yml ps

