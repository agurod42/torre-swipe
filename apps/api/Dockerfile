# ---- base ----------------------------------------------------------------
FROM node:20-alpine AS base
RUN npm install -g pnpm@9 turbo@2

# ---- pruner: prune monorepo to only api and its deps --------------------
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune api --docker

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
RUN turbo build --filter=api

# ---- runner: minimal production image ----------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone output contains server.js + minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/static     ./apps/api/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# server.js lives at the monorepo-root level inside standalone
CMD ["node", "apps/api/server.js"]
