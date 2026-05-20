# ── Dockerfile ───────────────────────────────────────────────────
# Multi-stage build for a lean GCP Cloud Run image

# ── Stage 1: build ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TRANSPORT=http
# PORT is injected by Cloud Run at runtime (default 8080)
ENV PORT=3000

# Copy only prod deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -S mcpgrp && adduser -S mcpuser -G mcpgrp
USER mcpuser

EXPOSE 3000
CMD ["node", "dist/index.js"]
