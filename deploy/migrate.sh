#!/usr/bin/env bash
# ==============================================================================
# Script Migrasi Database Produksi
# Jalankan di VPS ketika ada penambahan tabel / kolom baru:
# chmod +x deploy/migrate.sh && ./deploy/migrate.sh
# ==============================================================================

set -e

echo "🔄 Menjalankan migrasi database Drizzle di lingkungan kontainer produksi..."

# Menjalankan perintah migrasi menggunakan kontainer api sementara dengan environment dari .env
docker compose -f docker-compose.prod.yml run --rm api bun run --filter @usul-data/shared db:migrate

echo "✅ Migrasi database selesai!"

