FROM node:20-bullseye-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

FROM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL="postgresql://postgres:dummy@localhost:5432/fences"
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./

COPY package.json package-lock.json ./
COPY src ./src/
COPY public ./public/
COPY next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public/uploads/portfolio && \
    chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

RUN mkdir -p /app/public/uploads/portfolio && chown -R nextjs:nodejs /app/public

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]
