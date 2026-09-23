#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}Shutting down Athena services...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM EXIT

# Pre-flight: ensure ports 3000 and 5173 are free
echo -e "${YELLOW}Preparing ports 3000 and 5173...${NC}"
lsof -ti:3000,5173 | xargs kill -9 2>/dev/null || true

echo -e "${YELLOW}Starting Athena Exam App (Backend + Frontend + Electron)...${NC}\n"

# 1. Start Backend
echo -e "${CYAN}[Backend] Starting server on http://localhost:3000...${NC}"
(cd "$DIR/backend" && node server.js) &
BACKEND_PID=$!

# 2. Start Frontend with strict port 5173
echo -e "${GREEN}[Frontend] Starting Vite on http://localhost:5173...${NC}"
(cd "$DIR/frontend" && pnpm dev --port 5173 --strictPort) &
FRONTEND_PID=$!

# 3. Wait for servers to respond
echo -e "${YELLOW}Waiting for Backend and Frontend to respond...${NC}"
until curl -s http://localhost:3000/ >/dev/null 2>&1 && curl -s http://localhost:5173/ >/dev/null 2>&1; do
  sleep 0.5
done

echo -e "${GREEN}✓ Both Backend and Frontend are ready!${NC}"
echo -e "${BLUE}[Electron] Launching Electron window...${NC}\n"

# 4. Start Electron (runs in foreground; closing it triggers exit and cleanup)
(cd "$DIR/frontend" && pnpm electron)
