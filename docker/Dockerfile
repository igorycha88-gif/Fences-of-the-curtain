FROM node:20-bullseye-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fontconfig \
    fonts-dejavu-core \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma@5.22.0 generate

FROM base AS builder

ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL="postgresql://postgres:dummy@localhost:5432/fences"
ARG NEXT_PUBLIC_SITE_URL="https://zabor-i-naves.ru"
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID=""
ARG NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=""
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY=""
ARG NEXT_PUBLIC_YANDEX_ORG_ID=""
ARG NEXT_PUBLIC_YANDEX_ORG_URL=""
ARG NEXT_PUBLIC_BASE_URL="https://zabor-i-naves.ru"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID
ENV NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=$NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_YANDEX_ORG_ID=$NEXT_PUBLIC_YANDEX_ORG_ID
ENV NEXT_PUBLIC_YANDEX_ORG_URL=$NEXT_PUBLIC_YANDEX_ORG_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=deps /app/prisma.config.ts ./

COPY package.json package-lock.json ./
COPY src ./src/
COPY public ./public/
COPY next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./

RUN npm run build

FROM base AS runner

LABEL maintainer="dev@zabor-i-naves.ru"
LABEL org.opencontainers.image.source="https://github.com/igor/Fences-of-the-curtain"
LABEL org.opencontainers.image.description="Zabor-i-Naves.ru production app"

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

COPY --chmod=755 docker/entrypoint.sh /app/entrypoint.sh

RUN mkdir -p /app/public/uploads/portfolio && chown -R nextjs:nodejs /app/public

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-3001}/api/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
