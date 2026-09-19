# ==============================================================================
# AgriLog Backend - Production Dockerfile (Multi-stage with Puppeteer support)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build TypeScript source & prepare production dependencies
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies with npm ci for reproducible builds
COPY package*.json ./
RUN npm ci

# Copy TypeScript configs and source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to dist/
RUN npm run build

# Remove devDependencies to keep production bundle small
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Production runtime with Chromium support for Puppeteer PDF export
# ------------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install system Chromium, fonts, and certificates required by Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configure Puppeteer to use the pre-installed system Chromium binary
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV PORT=5000

# Copy compiled files and production node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Use non-root 'node' user for security
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
