# ═══════════════════════════════════════════════════════════════
# LNR AI Hub — Production Dockerfile (Render)
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /app

# Installer les outils de build pour les modules natifs
RUN apk add --no-cache python3 make g++

# Copier package.json ET package-lock.json
COPY package.json package-lock.json ./

# Installer les dépendances (npm ci est plus fiable que npm install en production)
# --maxsockets=1 évite le bug "Exit handler never called" de npm dans Docker Alpine
RUN npm ci --legacy-peer-deps --maxsockets=1 || (cat /root/.npm/_logs/*.log && exit 1)

# Copier le code source
COPY . .

# Définir NODE_ENV pour que esbuild inclue le bloc serve()
ENV NODE_ENV=production

# Build frontend + backend
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# Stage de production
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine

WORKDIR /app

# Outils pour better-sqlite3
RUN apk add --no-cache python3 make g++

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
