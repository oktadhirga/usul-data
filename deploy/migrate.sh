#!/usr/bin/env bash
# ==============================================================================
# Script Migrasi Database Produksi
# Jalankan di VPS ketika ada penambahan tabel / kolom baru:
# chmod +x deploy/migrate.sh && ./deploy/migrate.sh
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🔄 Menjalankan migrasi database Drizzle di lingkungan kontainer produksi..."

# Mount folder drizzle dari host VPS langsung ke kontainer agar selalu membaca _journal.json terbaru
docker compose -f docker-compose.prod.yml run --rm \
  -v "$PROJECT_DIR/packages/shared/drizzle:/app/packages/shared/drizzle" \
  api bun run --filter @usul-data/shared db:migrate

echo "✅ Migrasi database selesai!"

