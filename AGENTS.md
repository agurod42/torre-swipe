# AGENTS.md — Engineering Decisions & Constraints

> **For LLMs working on this codebase:** This file is the authoritative record of every significant engineering decision made during the build of Torre Swipe. If you change any decision listed here, **update this file in the same commit**. The file must always reflect the current state of the codebase, not historical intent.

---

## Product Constraints

- **No user authentication** — the app is fully anonymous; no login, no accounts.
- **No server-side match history** — liked/passed state lives only in `localStorage` on the client.
- **No employer-facing features** — read-only job browsing only.
- **Single-screen UI** — `apps/web/app/page.tsx` is the only page. No routing.
- **External applications only** — LIKE and SUPER LIKE open `externalApplicationUrl` in a new tab; no in-app application flow.
- **1-level undo only** — only the most recent swipe can be undone.

---

## Visual Design Decisions

- **Dark mode only** — no light mode variant exists or is planned.
- **Single source of truth for all UI** — `references/ui/home-screen.html` and `references/ui/empty-screen.html` are the pixel-level design spec. All colors, CSS classes, SVG paths, layout structure, and design tokens must match those files exactly.
- **Tailwind color palette** (from `home-screen.html`):
  - `primary: "#CCDC39"` — Torre lime-green accent
  - `bg-midnight: "#0B0E14"` — page background
  - `card-dark: "#1C1F26"` — card background
  - `card-dark-lighter: "#282C35"` — button/input backgrounds
  - `neon-cyan: "#A5F3FC"`, `neon-magenta: "#FBCFE8"`, `neon-amber: "#FDE68A"` — skill chip colors
- **Custom CSS classes** (defined verbatim in `apps/web/app/globals.css`): `.btn-glow-red`, `.btn-glow-blue`, `.btn-glow-torre`, `.card-shadow-vibrant`, `.glow-text-primary`, `.glow-emoji`, `.btn-refresh-shadow`, `.shimmer`, `.animate-star-burst`.
- **Like button** uses Torre primary color (`#CCDC39`), not green — overrides spec §3.5.
- **Super like button** uses the Torre logo SVG path (`M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z`), not a star emoji — overrides spec §3.5.
- **Header app icon** uses a custom portrait image (`/header-icon.jpg`) instead of the Torre arrow SVG in the top-left badge — overrides `home-screen.html`.
- **Card layout**: banner image area (h-44) with gradient overlay + company logo at bottom-left, followed by content area — matches `home-screen.html`'s card structure.
- **Card border-radius**: `rounded-[32px]` for cards, `rounded-[48px]` reserved for phone frame (not used in production app).
- **Font**: Inter (400, 500, 600, 700), loaded via `next/font/google`.
- **Icons**: Google Material Symbols Outlined loaded via CDN in `page.tsx`.
- **App shell in production**: `max-w-[400px] mx-auto h-dvh flex flex-col` — the phone frame chrome in the HTML references (rounded border, status bar) is for design preview only and is NOT rendered in the real app.

---

## Architecture Decisions

- **Monorepo with Turborepo + pnpm** — task graph: `build` depends on `^build`; `dev` is persistent and uncached; `test` depends on `^build`.
- **Two separate Next.js apps**:
  - `apps/api` — BFF only (port 3001); no frontend pages; no SSR for client data.
  - `apps/web` — frontend only (port 3000); all UI lives here.
- **BFF is mandatory** — all calls to `https://search.torre.co` go through `apps/api`. Direct calls from the browser are prohibited (CORS + keeping the upstream API server-side).
- **Shared packages** use the `@torre-swipe/` scope:
  - `@torre-swipe/types` — TypeScript types only, no runtime code.
  - `@torre-swipe/torre-client` — `TorreClient`, `TorreApiError`, `LocalStorageStrategy`.
- **No build step for shared packages** — workspace packages are consumed via TypeScript path aliases (`tsconfig.json` `paths`). The `main` field points directly to `src/index.ts`.
- **`output: "standalone"` only in production** — both `next.config.mjs` files gate the standalone output on `NODE_ENV === "production"` so that `docker-compose` hot-reload still works.

---

## State Management Decisions

- **Zustand** for all client state — `apps/web/store/swipeStore.ts`.
- **`StorageStrategy` interface** (`packages/types/src/storage.ts`) abstracts persistence — the store holds a reference and calls it; callers inject the implementation at bootstrap.
- **`LocalStorageStrategy`** is the only provided implementation — capped at 500 entries to avoid quota issues; oldest entries are dropped when the cap is exceeded.
- **Seen IDs are persisted on every swipe** (fire-and-forget) under the key `torre_seen_ids`.
- **The queue is never persisted** — on page reload, cards are re-fetched from the BFF.
- **Undo stack depth: 1** — `undoCard` holds at most one card. After undo, `undoCard` is cleared.
- **Queue constants**:
  - `INITIAL_FETCH_SIZE = 20`
  - `REFILL_SIZE = 10`
  - `REFILL_THRESHOLD = 5` (trigger refill when queue drops below this)
  - `MAX_QUEUE_SIZE = 50`

---

## Testing Decisions

- **Test runner: Vitest** in both `apps/api` and `apps/web`.
- **Component testing: React Testing Library** (behavior-focused, no snapshot tests).
- **Coverage provider: v8** (`@vitest/coverage-v8`).
- **Coverage targets**:
  - `apps/api`: statements ≥ 98%, branches ≥ 95%, functions ≥ 98%, lines ≥ 98%.
  - `apps/web`: statements ≥ 80%, branches ≥ 75%.
- **E2E tests: deferred** — Playwright is listed as a future-work dependency; no E2E tests exist in v1.
- **Mocking strategy (api)**: `vi.stubGlobal("fetch", vi.fn())` — the global `fetch` is mocked so no real HTTP calls are made.
- **Mocking strategy (web components)**: `framer-motion` and `next/image` are mocked in component tests to avoid animation/SSR complexity.
- **CI test automation**: GitHub Actions workflow at `.github/workflows/tests.yml` runs `pnpm test` on `push`, `pull_request`, and manual `workflow_dispatch`.

---

## Logging Decisions

- **Environment variable gates**:
  - `apps/api`: `DEBUG_LOGS=true` enables logging.
  - `apps/web`: `NEXT_PUBLIC_DEBUG_LOGS=true` enables logging.
- **Logger format**: `[api:info]` / `[web:info]` prefixes, wrapping `console.log/warn/error`.
- **Logging is disabled by default** — `.env.example` files set both flags to `false`.
- **In production, logging MUST remain disabled** — never set `DEBUG_LOGS=true` in a production deployment.

---

## Deployment Decisions

- **Each app has its own `Dockerfile`** (`apps/api/Dockerfile`, `apps/web/Dockerfile`) using a 4-stage build: `base → pruner → installer → builder → runner`.
- **Turborepo `turbo prune --scope=<app> --docker`** is used to produce a minimal file set for each image.
- **`docker-compose.yml`** is for **local development only** — it uses bind mounts + hot reload (not the production Dockerfiles).
- **Dokploy deployment**: point each service at its respective `Dockerfile`; the build context must be the monorepo root so that `turbo prune` can see all packages.
- **`NEXT_PUBLIC_API_URL`** must be provided as a Docker build arg for `apps/web` in production, because Next.js bakes public env vars at build time.
- **Named Docker volumes** for `node_modules` in `docker-compose.yml` — prevents macOS ↔ Linux binary incompatibility when bind-mounting the repo.

---

## API Integration Decisions

- **Torre API base URL**: `https://search.torre.co` (server-side only, via `TORRE_API_BASE_URL` env var in `apps/api`).
- **Always include `status: open`** in the Torre search request body.
- **Default query params**: `lang=en`, `contextFeature=job_feed`, `currency=USD`, `periodicity=yearly`.
- **CORS headers**: `Access-Control-Allow-Origin: *` on all responses from `apps/api` (including error responses). Restrict to the web origin in a hardened production deployment.
- **BFF does NOT filter by `seenIds`** — deduplication is the frontend's responsibility.
