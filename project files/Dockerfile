# backend/Dockerfile — multi-stage build (runtime installs production deps)
# Stage 1 — builder
FROM node:20-bullseye-slim AS builder
WORKDIR /usr/src/app

# Build deps needed for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install all deps in builder
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY src ./src

# Stage 2 — runtime
FROM node:20-bullseye-slim AS runtime
WORKDIR /usr/src/app

# Minimal runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files and install production deps
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy application source
COPY --from=builder /usr/src/app/src ./src

ENV NODE_ENV=production
ENV PORT=3100
EXPOSE 3100

CMD ["node", "src/index.js"]
