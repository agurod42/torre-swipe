# Torre Swipe

A mobile-first web app that lets job seekers discover [Torre.ai](https://torre.ai) job opportunities through a Tinder-style swipe interface. Swipe right to like, left to pass, up to super-like. No account needed.

See [docs/SPEC.md](docs/SPEC.md) for the full product and technical specification.

---

## Architecture

```
torre-ca/ (monorepo — pnpm workspaces + Turborepo)
│
├── apps/
│   ├── api/          Next.js (port 3001) — BFF proxy to Torre API
│   └── web/          Next.js (port 3000) — Swipe UI
│
└── packages/
    ├── types/         Shared TypeScript types (Opportunity, StorageStrategy, …)
    └── torre-client/  Torre API HTTP client + LocalStorageStrategy
```

**Why two apps?** The Torre search API does not allow cross-origin browser requests. `apps/api` acts as a Backend-for-Frontend (BFF): it receives requests from `apps/web`, proxies them server-side to Torre, and returns the results — keeping the upstream API call off the browser entirely.

**Shared packages** (`@torre-swipe/types`, `@torre-swipe/torre-client`) are consumed via TypeScript path aliases — no build step required for local development.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Monorepo | Turborepo ^2 | Task graph, incremental builds |
| Package manager | pnpm ^9 | Workspace support |
| Language | TypeScript ^5.4 | Strict mode throughout |
| Frontend | Next.js 14 (App Router) | Client-side rendered swipe UI |
| Styling | Tailwind CSS ^3.4 | Dark theme, design tokens from `references/ui/` |
| Animations | Framer Motion ^11 | Spring physics, drag gesture |
| State | Zustand ^4 | Queue, undo, celebration, animation flags |
| BFF | Next.js API Routes | Proxies Torre API, adds CORS headers |
| HTTP | Native `fetch` | Node 18+ and browser built-in |
| Testing | Vitest + React Testing Library | Unit + component tests |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm` or via `corepack enable`)

---

## Getting Started (without Docker)

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Set up environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 3. Start both apps concurrently (Turborepo orchestrates them)
pnpm dev
```

- Web app: http://localhost:3000
- BFF API: http://localhost:3001
- Health check: http://localhost:3001/api/health

---

## Getting Started (with Docker)

The `docker-compose.yml` at the repo root is for **local development only** — it uses bind mounts and `next dev` for hot reload.

```bash
docker compose up
```

- Web app: http://localhost:3000
- BFF API: http://localhost:3001

> **Note:** First startup is slow because `pnpm install` runs inside the containers. Subsequent starts use cached Docker volumes for `node_modules`.

---

## Running Tests

```bash
# Run all tests across all apps
pnpm test

# Run tests for a specific app
pnpm --filter api test
pnpm --filter web test

# Run with coverage
pnpm --filter api test:coverage
pnpm --filter web test:coverage
```

**Coverage targets:**
- `apps/api`: statements ≥ 98%, branches ≥ 95%
- `apps/web`: statements ≥ 80%, branches ≥ 75%

---

## Deployment (Dokploy)

Each app is deployed independently. In Dokploy, create two services:

| Service | Dockerfile | Build context |
|---|---|---|
| API | `apps/api/Dockerfile` | Monorepo root |
| Web | `apps/web/Dockerfile` | Monorepo root |

The build context must be the **monorepo root** so Turborepo can prune the dependency graph correctly.

**Required environment variables per service:**

| Variable | Service | Example |
|---|---|---|
| `TORRE_API_BASE_URL` | api | `https://search.torre.co` |
| `DEBUG_LOGS` | api | `false` |
| `NEXT_PUBLIC_API_URL` | web (build arg) | `https://api.yourapp.com` |
| `NEXT_PUBLIC_DEBUG_LOGS` | web | `false` |

> `NEXT_PUBLIC_*` variables are baked into the Next.js bundle at **build time**. Set them as Docker build arguments in Dokploy, not just as runtime environment variables.

---

## Environment Variables

| Variable | App | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:3001` | URL of the BFF API |
| `NEXT_PUBLIC_DEBUG_LOGS` | web | `false` | Enable browser console debug logs |
| `TORRE_API_BASE_URL` | api | `https://search.torre.co` | Torre upstream API base URL |
| `DEBUG_LOGS` | api | `false` | Enable server-side debug logs |

---

## Project Structure

```
torre-ca/
├── AGENTS.md                   ← Engineering decisions for LLMs (keep current!)
├── README.md                   ← This file
├── docker-compose.yml          ← Local dev only
├── package.json                ← Root workspace scripts
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
│
├── docs/
│   ├── SPEC.md                 ← Product + technical specification
│   └── UI_SPEC.md              ← UI design notes
│
├── references/
│   └── ui/
│       ├── home-screen.html    ← Visual design source of truth (home)
│       └── empty-screen.html   ← Visual design source of truth (empty state)
│
├── packages/
│   ├── types/                  ← @torre-swipe/types
│   │   └── src/
│   │       ├── opportunity.ts  ← All domain types
│   │       └── storage.ts      ← StorageStrategy interface
│   └── torre-client/           ← @torre-swipe/torre-client
│       └── src/
│           ├── client.ts       ← TorreClient + TorreApiError
│           └── storage/
│               └── LocalStorageStrategy.ts
│
├── apps/
│   ├── api/                    ← BFF (port 3001)
│   │   ├── app/api/
│   │   │   ├── opportunities/route.ts   ← POST /api/opportunities
│   │   │   └── health/route.ts          ← GET /api/health
│   │   ├── lib/
│   │   │   ├── validation.ts   ← Zod schema
│   │   │   └── logger.ts       ← Server debug logger
│   │   └── __tests__/
│   │       ├── torre.test.ts
│   │       └── route.test.ts
│   │
│   └── web/                    ← Frontend (port 3000)
│       ├── app/
│       │   ├── layout.tsx      ← Inter font, dark class
│       │   ├── page.tsx        ← Home page + keyboard handler
│       │   └── globals.css     ← Tailwind + custom CSS from references
│       ├── components/
│       │   ├── SwipeStack.tsx
│       │   ├── JobCard.tsx
│       │   ├── ActionBar.tsx
│       │   ├── SkeletonCard.tsx
│       │   ├── EmptyState.tsx
│       │   └── CelebrationOverlay.tsx
│       ├── hooks/
│       │   ├── useSwipeQueue.ts
│       │   └── useDragCard.ts
│       ├── store/
│       │   └── swipeStore.ts
│       └── lib/
│           ├── api.ts          ← BFF fetch wrapper
│           └── logger.ts       ← Client debug logger
```
