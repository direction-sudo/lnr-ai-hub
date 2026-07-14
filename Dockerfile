# ─── LNR AI Hub - Backend Dockerfile ───

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build frontend and backend
RUN npm run build

# ─── Production Stage ───
FROM node:20-alpine

WORKDIR /app

# Install better-sqlite3 dependencies
RUN apk add --no-cache python3 make g++

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/db ./db

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=sqlite:/app/data/lnr-ai-hub.db

# Expose port
EXPOSE 3000

# Start
CMD ["node", "dist/boot.js"]
