FROM oven/bun:1 AS base
WORKDIR /app

# Copy root workspace configurations
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build API
WORKDIR /app/apps/api
RUN bun run build

EXPOSE 3000
CMD ["bun", "dist/index.js"]
