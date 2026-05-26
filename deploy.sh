#!/bin/bash
set -e

echo "=== DARWIN Deploy ==="

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "[ERROR] Docker not found. Install: https://docs.docker.com/engine/install/"
  exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
  echo "[ERROR] Docker Compose v2 not found."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/3] Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

echo "[2/3] Building images..."
docker compose build --no-cache

echo "[3/3] Starting services..."
docker compose up -d

echo ""
echo "=== DARWIN is running ==="
echo "  Frontend : http://localhost"
echo "  Backend  : http://localhost/api/v1"
echo ""
echo "Logs: docker compose logs -f"
echo "Stop: docker compose down"
