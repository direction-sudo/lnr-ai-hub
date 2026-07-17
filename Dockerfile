# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Production Dockerfile (Render)
# ═══════════════════════════════════════════════════════════════
# Utilise pnpm via Corepack (inclus dans Node 20) — 50% moins de RAM que npm

FROM node:20-slim AS builder

WORKDIR /app

# Activer pnpm via Corepack (inclus dans Node 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Installer les outils de build pour les modules natifs (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier package.json ET pnpm-lock.yaml (si existe) ou package-lock.json
COPY package.json package-lock.json ./

# Convertir package-lock.json en pnpm-lock.yaml et installer avec pnpm
# pnpm consomme 50% moins de RAM que npm — essentiel pour Render free tier (512MB)
RUN pnpm import && rm package-lock.json && pnpm install

# Copier le code source
COPY . .

# Build frontend + backend
ENV NODE_ENV=production
RUN pnpm run build

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
