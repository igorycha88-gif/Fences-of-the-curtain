FROM node:20-bullseye-slim AS base

ENV PRISMA_VERSION=5.22.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

ENV DATABASE_URL="postgresql://postgres:password@localhost:5432/fences"

COPY package.json package-lock.json* ./

RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npx prisma@${PRISMA_VERSION} generate

FROM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://postgres:dummy@localhost:5432/fences"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./

COPY package.json package-lock.json* ./
COPY src ./src/
COPY public ./public/
COPY next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./

RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/public/uploads/portfolio && \
    chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "start"]
