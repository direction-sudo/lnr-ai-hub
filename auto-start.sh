#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Auto-start script for backend + Cloudflare tunnel
# Detects tunnel failures and restarts everything automatically
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3000
TUNNEL_LOG="/tmp/tunnel.log"
BACKEND_LOG="/tmp/backend.log"
HEALTH_CHECK_INTERVAL=30  # seconds

echo "═══════════════════════════════════════════════════════════════"
echo "  LNR AI Hub — Auto-start & Monitor"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ─── Colors ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Functions ───
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Kill existing processes ───
cleanup() {
  log_info "Cleaning up existing processes..."
  pkill -f "node dist/boot.js" 2>/dev/null || true
  killall -9 cloudflared 2>/dev/null || true
  sleep 2
}

# ─── Start backend ───
start_backend() {
  log_info "Starting backend on port $BACKEND_PORT..."
  cd "$PROJECT_DIR"
  
  export NODE_ENV=production
  export DATABASE_URL="sqlite:./data/lnr-ai-hub.db"
  export KIMI_API_KEY="sk-1MFMgGHRVcgp8r21RJMV4FTN0fz4yb3uqkZnpPzuqxxImjiu"
  export KIMI_OPEN_URL="https://api.moonshot.ai"
  export APP_ID="19f48d4c-42e2-86e7-8000-0000d708cdd6"
  export APP_SECRET="kNKAF3N4pkfzMGZhAwaWPJZ1W89TIL7z"
  
  nohup node dist/boot.js > "$BACKEND_LOG" 2>&1 &
  
  # Wait for backend to be ready
  for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/api/trpc/chat.listAgents > /dev/null 2>&1; then
      log_ok "Backend is ready!"
      return 0
    fi
    sleep 1
  done
  
  log_err "Backend failed to start"
  return 1
}

# ─── Start Cloudflare tunnel ───
start_tunnel() {
  log_info "Starting Cloudflare tunnel..."
  
  # Find cloudflared binary
  CLOUDFLARED="/home/kimi/.npm-global/lib/node_modules/cloudflared/bin/cloudflared"
  if [ ! -f "$CLOUDFLARED" ]; then
    CLOUDFLARED="$(which cloudflared 2>/dev/null || echo "")"
  fi
  
  if [ -z "$CLOUDFLARED" ] || [ ! -f "$CLOUDFLARED" ]; then
    log_err "cloudflared not found! Installing..."
    npm install -g cloudflared 2>/dev/null || {
      log_err "Failed to install cloudflared"
      return 1
    }
    CLOUDFLARED="/home/kimi/.npm-global/lib/node_modules/cloudflared/bin/cloudflared"
  fi
  
  # Run postinstall if needed
  if [ ! -f "$CLOUDFLARED" ]; then
    cd /home/kimi/.npm-global/lib/node_modules/cloudflared
    node scripts/postinstall.mjs 2>/dev/null || true
    node lib/cloudflared.js bin install latest 2>/dev/null || true
    sleep 15
  fi
  
  nohup "$CLOUDFLARED" tunnel --url "http://localhost:$BACKEND_PORT" > "$TUNNEL_LOG" 2>&1 &
  
  # Wait for tunnel to be ready
  log_info "Waiting for tunnel URL..."
  for i in {1..60}; do
    TUNNEL_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1)
    if [ -n "$TUNNEL_URL" ]; then
      log_ok "Tunnel is ready!"
      return 0
    fi
    sleep 2
  done
  
  log_err "Tunnel failed to start"
  return 1
}

# ─── Get current tunnel URL ───
get_tunnel_url() {
  grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | tail -1
}

# ─── Update frontend with new tunnel URL ───
update_frontend() {
  local NEW_URL=$1
  local CURRENT_URL
  
  CURRENT_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$PROJECT_DIR/src/providers/trpc.tsx" | head -1)
  
  if [ "$CURRENT_URL" = "$NEW_URL" ]; then
    log_ok "Frontend already up-to-date with $NEW_URL"
    return 0
  fi
  
  log_info "Updating frontend with new tunnel URL..."
  log_info "  Old: $CURRENT_URL"
  log_info "  New: $NEW_URL"
  
  cd "$PROJECT_DIR"
  
  # Update source file
  sed -i "s|https://[a-zA-Z0-9-]*\.trycloudflare\.com|$NEW_URL|g" src/providers/trpc.tsx
  
  # Rebuild
  log_info "Rebuilding frontend..."
  npx vite build > /dev/null 2>&1 || {
    log_err "Frontend build failed"
    return 1
  }
  
  # Copy to static-deploy
  rm -rf static-deploy/assets static-deploy/images
  mkdir -p static-deploy/assets static-deploy/images
  cp dist/public/assets/* static-deploy/assets/ 2>/dev/null || true
  cp -r public/images/* static-deploy/images/ 2>/dev/null || true
  cp dist/public/index.html static-deploy/index.html
  
  # Fix paths
  sed -i 's|/assets/|./assets/|g' static-deploy/index.html
  
  # Update URL in JS
  sed -i "s|https://[a-zA-Z0-9-]*\.trycloudflare\.com|$NEW_URL|g" static-deploy/assets/*.js
  
  # Clean old assets - keep only referenced files
  cd static-deploy/assets
  REF_JS=$(grep -oP 'src="\./assets/\K[^"]+' ../index.html 2>/dev/null || echo "")
  for f in *.js; do
    [ "$f" != "$REF_JS" ] && rm -f "$f" 2>/dev/null || true
  done
  for f in *.css; do
    [ "$f" != "index-oCADZlYG.css" ] && rm -f "$f" 2>/dev/null || true
  done
  cd "$PROJECT_DIR"
  
  log_ok "Frontend updated successfully!"
}

# ─── Health check ───
health_check() {
  local TUNNEL_URL
  TUNNEL_URL=$(get_tunnel_url)
  
  if [ -z "$TUNNEL_URL" ]; then
    return 1
  fi
  
  # Try to reach backend via tunnel
  if curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TUNNEL_URL/api/trpc/chat.listAgents" | grep -q "200"; then
    return 0
  fi
  
  return 1
}

# ─── Save state ───
save_state() {
  local TUNNEL_URL=$1
  echo "$TUNNEL_URL" > "$PROJECT_DIR/.last_tunnel_url"
  echo "$(date)" > "$PROJECT_DIR/.last_started"
}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

# Cleanup old processes
cleanup

# Start backend
if ! start_backend; then
  log_err "Failed to start backend. Exiting."
  exit 1
fi

# Start tunnel
if ! start_tunnel; then
  log_err "Failed to start tunnel. Exiting."
  exit 1
fi

# Get tunnel URL
TUNNEL_URL=$(get_tunnel_url)
if [ -z "$TUNNEL_URL" ]; then
  log_err "Could not get tunnel URL"
  exit 1
fi

log_ok "═══════════════════════════════════════════════════════════════"
log_ok "  TUNNEL URL: $TUNNEL_URL"
log_ok "═══════════════════════════════════════════════════════════════"

# Update frontend
update_frontend "$TUNNEL_URL"

# Save state
save_state "$TUNNEL_URL"

# ─── Monitor loop ───
log_info ""
log_info "Monitoring health every ${HEALTH_CHECK_INTERVAL}s..."
log_info "Press Ctrl+C to stop"
log_info ""

FAIL_COUNT=0
MAX_FAILS=3

while true; do
  sleep "$HEALTH_CHECK_INTERVAL"
  
  if health_check; then
    if [ "$FAIL_COUNT" -gt 0 ]; then
      log_ok "Tunnel is healthy again!"
    fi
    FAIL_COUNT=0
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    log_warn "Health check failed ($FAIL_COUNT/$MAX_FAILS)"
    
    if [ "$FAIL_COUNT" -ge "$MAX_FAILS" ]; then
      log_err "Tunnel appears down. Restarting everything..."
      
      cleanup
      
      if start_backend && start_tunnel; then
        NEW_URL=$(get_tunnel_url)
        if [ -n "$NEW_URL" ]; then
          log_ok "New tunnel URL: $NEW_URL"
          update_frontend "$NEW_URL"
          save_state "$NEW_URL"
          FAIL_COUNT=0
        fi
      else
        log_err "Failed to restart. Will retry in 60s..."
        sleep 60
      fi
    fi
  fi
done
