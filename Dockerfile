# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Production Dockerfile (Render)
# ═══════════════════════════════════════════════════════════════
# Utilise node:20-slim (Debian) car npm crash dans Alpine

FROM node:20-slim AS builder

WORKDIR /app

# Installer les outils de build pour les modules natifs (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier package.json ET package-lock.json
COPY package.json package-lock.json ./

# Installer les dépendances avec npm ci (outil fiable pour la production)
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Définir NODE_ENV pour que esbuild inclue le bloc serve()
ENV NODE_ENV=production

# Build frontend + backend
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
