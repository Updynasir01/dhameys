#!/bin/bash
# Dhameys Airlines — Setup (MongoDB edition)
set -e
ENV=${1:-dev}
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[Dhameys]${NC} $1"; }
warn() { echo -e "${YELLOW}[Warn]${NC} $1"; }
err()  { echo -e "${RED}[Error]${NC} $1"; exit 1; }

log "🛫  Dhameys Airlines Setup (MongoDB) — ENV: $ENV"

node -v &>/dev/null || err "Node.js not found. Install Node.js 18+ first."

[ ! -f ".env" ] && cp .env.example .env && warn "Created .env — please fill in your values"

log "Installing dependencies..."
npm install --prefix backend --legacy-peer-deps
npm install --prefix frontend --legacy-peer-deps

mkdir -p logs uploads/tickets

if [ "$ENV" = "dev" ] && command -v docker &>/dev/null; then
  log "Starting MongoDB with Docker..."
  docker-compose up -d mongodb mongo-express
  sleep 4
  log "MongoDB running on :27017  |  Mongo Express UI: http://localhost:8081"
fi

log "Seeding database..."
(cd backend && node src/utils/seed.js) || warn "Seed failed — check MONGODB_URI in .env"

if [ "$ENV" = "prod" ]; then
  log "Building Next.js for production..."
  (cd frontend && EXPORT_MODE=static npm run build 2>/dev/null || npm run build)
  log "Frontend built ✓"
fi

echo ""
echo -e "${GREEN}✅  Setup complete!${NC}"
echo "  API:        node backend/src/server.js"
echo "  Frontend:   cd frontend && npm run dev"
echo "  Seed DB:    cd backend && node src/utils/seed.js"
echo "  Admin user: cd backend && node src/utils/create-admin.js"
echo "  Mongo UI:   http://localhost:8081"
echo ""
