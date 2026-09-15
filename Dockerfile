# 1. Base stage
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# 3. Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN bun run build

# 4. Runner stage (Hasil akhir super ringan)
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]