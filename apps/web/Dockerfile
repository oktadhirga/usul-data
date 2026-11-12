FROM oven/bun:1 AS base
WORKDIR /app

# Copy root workspace configurations
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build Web app
WORKDIR /app/apps/web
RUN bun run build

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
CMD ["bun", "build/index.js"]
