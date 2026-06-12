FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ── Install ALL deps (needed for build tools + runtime) ──────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# ── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ── Production runner ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# App build output and assets
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder                        /app/public ./public
COPY --from=builder                        /app/next.config.ts ./next.config.ts
COPY --from=builder                        /app/package.json ./package.json

# Full node_modules — needed for `next start` and Prisma CLI at runtime
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma schema for db push at startup
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
