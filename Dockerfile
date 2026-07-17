# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Production Dockerfile (Render)
# ═══════════════════════════════════════════════════════════════
# Utilise node:20-slim avec optimisations mémoire pour Render free tier

FROM node:20-slim AS builder

WORKDIR /app

# Installer les outils de build pour les modules natifs (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier package.json ET package-lock.json
COPY package.json package-lock.json ./

# Limiter la mémoire npm pour éviter le crash "Exit handler never called"
# Render free tier = 512MB RAM
ENV NODE_OPTIONS=--max-old-space-size=512
ENV npm_config_maxsockets=1
ENV npm_config_fetch_retries=3
ENV npm_config_fetch_retry_mintimeout=20000

# Installer les dépendances (npm install plus stable que npm ci dans Docker)
# --no-audit --no-fund réduit la mémoire utilisée
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copier le code source
COPY . .

# Build frontend + backend
ENV NODE_ENV=production
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# Stage de production
# ═══════════════════════════════════════════════════════════════

FROM node:20-slim

WORKDIR /app

# Outils pour better-sqlite3 + wget pour healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ wget \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers buildés
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/db ./db
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/start.sh ./
RUN chmod +x start.sh

# Créer le dossier data pour SQLite (monté sur disque persistant Render)
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Port
EXPOSE 3000

# Démarrer via le script start.sh
CMD ["./start.sh"]
