#!/usr/bin/env bash
# ==============================================================================
# Script Feeder Akun Pengguna Produksi
# Jalankan di VPS:
# chmod +x deploy/feed_users.sh && ./deploy/feed_users.sh
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Menjalankan feeder pengguna ke database..."

if command -v docker >/dev/null 2>&1 && [ -f "docker-compose.prod.yml" ]; then
  echo "📦 Menjalankan via Docker Compose di kontainer api..."
  docker compose -f docker-compose.prod.yml run --rm \
    -v "$PROJECT_DIR/deploy/feed_users.sql:/app/deploy/feed_users.sql" \
    -v "$PROJECT_DIR/packages/shared/src/feed-users.ts:/app/packages/shared/src/feed-users.ts" \
    api bun run --filter @usul-data/shared db:feed-users
elif command -v bun >/dev/null 2>&1; then
  echo "⚡ Menjalankan via Bun lokal..."
  bun run --filter @usul-data/shared db:feed-users
else
  echo "⚠️ Docker maupun Bun tidak terdeteksi di shell ini."
  echo "💡 Anda bisa mengeksekusi langsung query SQL ke MySQL:"
  echo "   mysql -u <USER> -p <DB_NAME> < deploy/feed_users.sql"
  exit 1
fi

echo "✅ Feeder pengguna selesai dieksekusi!"

