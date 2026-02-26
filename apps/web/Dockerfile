# ---- base ----------------------------------------------------------------
FROM node:20-alpine AS base
RUN npm install -g pnpm@9 turbo@2

# ---- pruner: prune monorepo to only web and its deps --------------------
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune web --docker

# ---- installer: install only the pruned lockfile ------------------------
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---- builder: copy source and build ------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
ENV NODE_ENV=production

# NEXT_PUBLIC_API_URL must be provided as a Docker build argument
# because Next.js bakes NEXT_PUBLIC_* values into the JS bundle at build time.
# In Dokploy: set this build arg to your deployed API URL, e.g.
#   NEXT_PUBLIC_API_URL=https://api.yourapp.com
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_DEBUG_LOGS=false
ENV NEXT_PUBLIC_DEBUG_LOGS=$NEXT_PUBLIC_DEBUG_LOGS

RUN turbo build --filter=web

# ---- runner: minimal production image ----------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone output contains server.js + minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public           ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
