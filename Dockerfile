# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Production Dockerfile (Render)
# ═══════════════════════════════════════════════════════════════
# npm 9.9.4 = dernière version stable SANS le bug "Exit handler never called"
# dans Docker. npm 10.x a ce bug sur Render free tier (512MB RAM).

FROM node:20-slim AS builder

WORKDIR /app

# Outils de compilation pour better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# CRITIQUE : Downgrade npm à 9.9.4 (évite le crash dans Docker)
# npm 10.x a un bug "Exit handler never called" dans Docker Alpine/Debian
RUN npm install -g npm@9.9.4

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Étape 1 : Installer TOUT (dependencies + devDependencies) pour le build
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Étape 2 : Build frontend + backend
ENV NODE_ENV=production
RUN npm run build

# Étape 3 : Supprimer les devDependencies (réduit la taille de 40%)
RUN npm prune --production

# ═══════════════════════════════════════════════════════════════
# Stage de production — image minimale
# ═══════════════════════════════════════════════════════════════

FROM node:20-slim

WORKDIR /app

# Outils pour better-sqlite3 + wget pour healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ wget \
    && rm -rf /var/lib/apt/lists/*

# Copier uniquement les fichiers nécessaires au runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/db ./db
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/start.sh ./
RUN chmod +x start.sh

# Dossier data pour SQLite (monté sur disque persistant Render)
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["./start.sh"]
