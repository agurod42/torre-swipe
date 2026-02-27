# Torre Swipe — Product & Technical Specification

> Hand this document to an LLM and say **"build this"** to get a complete, production-ready implementation.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core User Flow](#2-core-user-flow)
3. [Home Screen Specification](#3-home-screen-specification)
4. [Background Preloading Strategy](#4-background-preloading-strategy)
5. [Torre API Integration](#5-torre-api-integration)
6. [Monorepo Architecture](#6-monorepo-architecture)
7. [State Management](#7-state-management)
8. [Tech Stack](#8-tech-stack)
9. [Test Requirements](#9-test-requirements)
10. [API Contract (BFF)](#10-api-contract-bff)
11. [Performance Requirements](#11-performance-requirements)
12. [Accessibility](#12-accessibility)

---

## 1. Product Overview

**Torre Swipe** is a mobile-first web application that lets job seekers discover Torre.ai job opportunities through a Tinder-style swipe interface. Users swipe right to like a job, left to pass, and up to super-like. Liked and super-liked jobs open the external application URL in a new tab.

**Primary user:** A job seeker on a mobile browser who wants a fast, low-friction way to browse and shortlist job opportunities.

**Why it works:** Traditional job boards require deliberate search queries. Torre Swipe surfaces opportunities serendipitously, making job discovery feel effortless and even fun. The swipe mechanic creates a lightweight commitment signal — a flick of the thumb — that lowers the psychological cost of engaging with each posting.

**Non-goals (out of scope):**
- User accounts or authentication
- Persistent match history beyond `localStorage`
- Full application flow within the app (redirects to external URLs)
- Employer-facing features

---

## 2. Core User Flow

```
┌─────────────────────────────────────────────────────┐
│  1. User opens app (mobile browser)                 │
│     → Skeleton loading cards appear instantly       │
│     → First batch of jobs fetched from BFF          │
│                                                     │
│  2. Swipe loop (repeated until empty state)         │
│     a. Top card is the current job                  │
│     b. User swipes or taps a button:                │
│        • Right / ❤  → LIKE  (opens ext. URL)       │
│        • Left  / ✕  → PASS  (discard)              │
│        • Up    / ⭐ → SUPER LIKE (opens ext. URL)  │
│     c. Card animates off screen                     │
│     d. Next card slides up to become top            │
│     e. Preloader ensures next cards are ready       │
│                                                     │
│  3. Undo                                            │
│     → One-level undo brings last swiped card back  │
│                                                     │
│  4. Empty state                                     │
│     → "You've seen all jobs!" message + Refresh CTA │
└─────────────────────────────────────────────────────┘
```

### Swipe Actions Detail

| Action | Gesture | Button | Effect |
|--------|---------|--------|--------|
| LIKE   | Swipe right | ❤ (heart) | Opens `externalApplicationUrl` in new tab; card exits right |
| PASS   | Swipe left  | ✕ (cross) | Discards; card exits left |
| SUPER LIKE | Swipe up | ⭐ (star) | Opens `externalApplicationUrl` in new tab; card exits upward; shows celebration overlay |

---

## 3. Home Screen Specification

The home screen is the **only screen**. There is no navigation, no search page, no profile page.

### 3.1 Layout

```
┌────────────────────────────────────┐
│  Torre Swipe          [undo ↩]    │  ← Header (48px)
├────────────────────────────────────┤
│                                    │
│      ┌──────────────────┐          │
│    ┌─┤   Card (top)     ├─┐        │
│  ┌─┤ └──────────────────┘ ├─┐      │
│  │ └──────────────────────┘ │      │  ← Card stack area
│  └────────────────────────── ┘     │    (fills remaining height)
│                                    │
├────────────────────────────────────┤
│      [✕]        [❤]       [⭐]    │  ← Action buttons (80px)
└────────────────────────────────────┘
```

### 3.2 Card Anatomy

Each job card is a rounded rectangle (border-radius: 16px) with a white background and a subtle drop shadow. Content from top to bottom:

```
┌────────────────────────────────────┐
│  [Company Logo 56×56]              │  ← rounded, 4px shadow
│  Company Name            [Remote]  │  ← body-sm, gray-500 | badge
│                                    │
│  Job Title (2 lines max)           │  ← heading-lg, semibold
│                                    │
│  💰 $164k – $246k / year          │  ← compensation (if visible)
│  📍 United States · Remote        │  ← location + remote badge
│  🕐 Full-time                     │  ← commitment
│                                    │
│  ─────────────────────────────    │
│                                    │
│  Tagline text (3 lines max,        │  ← body-sm, gray-600
│  ellipsized)                       │
│                                    │
│  ─────────────────────────────    │
│                                    │
│  [Figma] [React.js] [CSS] +4      │  ← skill chips (max 3 shown)
└────────────────────────────────────┘
```

**Card data mapping:**

| UI element | API field | Fallback |
|---|---|---|
| Company logo | `organizations[0].picture` | Generic building icon |
| Company name | `organizations[0].name` | "Unknown Company" |
| Job title | `objective` | — |
| Salary | `compensation.data` (if `visible: true`) | "Salary not disclosed" |
| Location | `locations[]` joined with `, ` | "Location not specified" |
| Remote badge | `remote === true` | hidden |
| Commitment | `commitment` | hidden |
| Tagline | `tagline` | hidden |
| Skills | `skills[].name` (first 3) | hidden if empty |
| Overflow | `skills.length - 3` shown as `+N` | hidden |

**Salary formatting:**

- If `compensation.visible === false`: show "Salary not disclosed"
- If `code === "range"`: `$${formatK(minAmount)} – $${formatK(maxAmount)} / ${periodicity}`
- If `code === "fixed"`: `$${formatK(minAmount)} / ${periodicity}`
- `formatK`: amounts ≥ 1000 shown as `Xk` (e.g., `164000` → `$164k`)

**Skill chip colors:** Use a deterministic color from a pastel palette based on skill name hash (so the same skill always gets the same color).

### 3.3 Card Stack Visual

Always render exactly **3 cards** (or fewer if fewer remain). Cards are layered with CSS `z-index`. The back cards are purely decorative — they show the card background/shadow only, not full content.

| Position | z-index | Transform | Opacity |
|---|---|---|---|
| Top (active) | 30 | `scale(1)` `translateY(0)` | 1.0 |
| Middle | 20 | `scale(0.97)` `translateY(10px)` | 1.0 |
| Back | 10 | `scale(0.94)` `translateY(20px)` | 1.0 |

Apply transforms via CSS `transform` (not layout properties) for GPU compositing.

### 3.4 Swipe Gesture & Overlay Stamps

**Drag behavior:**
- Card follows the pointer/touch position (CSS `transform: translate(x, y) rotate(θ)`).
- Rotation: `θ = x * 0.08` (degrees), clamped to ±20°.
- Overlay stamp opacity: `Math.min(Math.abs(x) / 80, 1)` for horizontal, `Math.min(-y / 80, 1)` for upward.

**Overlay stamps (shown while dragging):**

| Direction | Text | Color | Position |
|---|---|---|---|
| Right | **LIKE** | `#4CAF50` (green) | top-left of card, rotated -20° |
| Left | **NOPE** | `#F44336` (red) | top-right of card, rotated 20° |
| Up | **SUPER** | `#2196F3` (blue) | center of card |

Stamps use a bordered label style: 3px solid border, uppercase, bold, 28px font.

**Throw threshold:** If the user releases the card with `|x| > 100px` or `y < -100px`, animate the card off screen. Otherwise spring back to center.

**Exit animations (spring physics):**
- Right exit: `x` → `window.innerWidth + 300`, slight upward arc
- Left exit: `x` → `-(window.innerWidth + 300)`, slight upward arc
- Up exit: `y` → `-(window.innerHeight + 300)`
- Spring config: `{ stiffness: 400, damping: 30 }` (Framer Motion defaults)

### 3.5 Action Buttons

Three circular buttons centered horizontally in the action bar:

```
[✕ 56px red/pink]   [❤ 64px green]   [⭐ 56px blue/gold]
```

- ✕ (Pass): diameter 56px, border 2px `#F44336`, icon `#F44336`
- ❤ (Like): diameter 64px, bg `#4CAF50`, icon white — slightly larger as primary CTA
- ⭐ (Super): diameter 56px, border 2px `#2196F3`, icon `#FFC107` (gold star)

Tapping a button triggers the same exit animation as a full swipe gesture. Buttons are disabled (opacity 0.4, pointer-events none) during a card exit animation.

### 3.6 Undo Button

Located in the top-right of the header. Shows a back-arrow icon (↩).

- Enabled only if there is a previous card in the undo stack (max depth: 1 — only the most recent swipe can be undone).
- Tapping it brings the last card back to the top of the stack with a reverse spring animation (card flies in from the direction it exited).
- After undo, the button becomes disabled again until the next swipe.

### 3.7 Super Like Celebration

When a super like fires (gesture or button):
1. Card exits upward.
2. A full-screen overlay fades in (semi-transparent dark bg).
3. Center: animated star burst (CSS keyframes) with text **"Super Like! 🌟"**.
4. Auto-dismisses after 1.5s, or user can tap anywhere to dismiss early.

### 3.8 Loading Skeleton

Shown in place of the card stack while the first fetch is in flight.

```
┌────────────────────────────────────┐
│  [░░░░ 56×56 circle]               │
│  ░░░░░░░░░░░  ░░░░░               │
│                                    │
│  ░░░░░░░░░░░░░░░░░░░░░            │
│  ░░░░░░░░░░░░░░                   │
│                                    │
│  ░░░░░  ░░░░░  ░░░░░             │
└────────────────────────────────────┘
```

Skeleton elements use a shimmer animation (gradient sweep left-to-right, 1.5s infinite).

### 3.9 Empty State

When the card queue is exhausted:

```
        🎉

   You've seen all jobs!

   Check back later or broaden
   your search.

   [  Refresh  ]
```

"Refresh" re-triggers the API fetch (with a fresh random offset/seed so different results may appear).

---

## 4. Background Preloading Strategy

The app must **never show a loading spinner** after the initial skeleton load. Achieve this by maintaining a buffer of pre-fetched cards.

### 4.1 Queue Architecture

```
┌──────────────────────────────────────────────────────────┐
│  DISPLAY QUEUE (cards ready to show)                     │
│  [card_1] [card_2] [card_3] [card_4] [card_5] ...       │
│      ↑ top card shown                                    │
└──────────────────────────────────────────────────────────┘
          ↓ fetch triggered when size < REFILL_THRESHOLD
┌──────────────────────────────────────────────────────────┐
│  FETCH IN FLIGHT (background, non-blocking)              │
│  next batch of 10 cards from BFF                         │
└──────────────────────────────────────────────────────────┘
```

**Constants:**

| Constant | Value | Meaning |
|---|---|---|
| `INITIAL_FETCH_SIZE` | 20 | Cards fetched on first load |
| `REFILL_SIZE` | 10 | Cards fetched per refill |
| `REFILL_THRESHOLD` | 5 | Trigger refill when queue drops below this |
| `MAX_QUEUE_SIZE` | 50 | Cap to avoid unbounded memory |

### 4.2 Deduplication

Track all seen `id` values in a `Set<string>` (persisted in `localStorage` under `torre_seen_ids`). When appending new cards from a fetch, filter out any whose `id` is already in the seen set. Add swiped card IDs to the set immediately on swipe (before the exit animation completes).

### 4.3 Image Preloading

After cards are added to the queue, preload company logo images for the next 5 cards using `new Image()` instances so images are in browser cache when cards render.

```typescript
function preloadImages(cards: Opportunity[], count = 5) {
  cards.slice(0, count).forEach(card => {
    const url = card.organizations[0]?.picture;
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
}
```

### 4.4 Fetch Offset Tracking

Each search request uses a random `offset` or relies on Torre's pagination. Since the Torre API does not expose a traditional `page` or `offset` param, achieve variety by rotating through different keyword search terms or using an empty keyword search with the `contextFeature=job_feed` param. Track which batches have been fetched to avoid re-fetching the same page.

---

## 5. Torre API Integration

### 5.1 Upstream API Details

**Base URL:** `https://search.torre.co`

**Endpoint:** `POST /opportunities/_search`

**Query Parameters:**

| Param | Type | Example | Notes |
|---|---|---|---|
| `currency` | string | `"USD"` | Normalizes compensation display |
| `periodicity` | string | `"yearly"` | `hourly` \| `monthly` \| `yearly` |
| `lang` | string | `"en"` | ISO 639-1 language code |
| `size` | integer | `10` | Results per page (default 10) |
| `contextFeature` | string | `"job_feed"` | Tuning hint for the ranker |

**Request Body:**

```json
{
  "and": [
    { "status": { "code": "open" } }
  ]
}
```

To search by keyword, add:
```json
{ "keywords": { "term": "Designer", "locale": "en" } }
```

To filter by language:
```json
{ "language": { "term": "English", "fluency": "fully-fluent" } }
```

To filter by skill:
```json
{ "skill/role": { "text": "React.js", "proficiency": "proficient" } }
```

**Filter operator schema:**

```typescript
type SearchFilter =
  | { keywords: { term: string; locale?: string } }
  | { language: { term: string; fluency: "basic" | "conversational" | "fully-fluent" | "native" | "fluent" } }
  | { "skill/role": { text: string; proficiency: "no-experience-required" | "beginner" | "proficient" | "expert" } }
  | { status: { code: "open" | "closed" | "paused" } };

type SearchRequest = {
  and?: SearchFilter[];
  or?: SearchFilter[];
  not?: SearchFilter[];
};
```

### 5.2 Response Shape

```typescript
type SearchResponse = {
  total: number;
  size: number;
  results: Opportunity[];
};

type Opportunity = {
  id: string;
  objective: string;
  slug: string;
  tagline: string;
  theme: string;
  type: "full-time-employment" | "part-time-employment" | "contractor" | "freelance";
  opportunity: "employee" | "freelancer";
  organizations: Organization[];
  locations: string[];
  timezones: string[] | null;
  remote: boolean;
  external: boolean;
  deadline: string | null;
  created: string;
  status: "open" | "closed" | "paused";
  commitment: "full-time" | "part-time";
  externalApplicationUrl: string | null;
  compensation: Compensation;
  skills: Skill[];
  place: Place;
};

type Organization = {
  id: number;
  hashedId: string;
  name: string;
  status: string;
  size: number;
  publicId: string;
  picture: string;
  theme: string;
};

type Compensation = {
  data: {
    code: "range" | "fixed";
    currency: string;
    minAmount: number;
    minHourlyUSD: number;
    maxAmount: number;
    maxHourlyUSD: number;
    periodicity: "hourly" | "monthly" | "yearly";
    negotiable: boolean;
    conversionRateUSD: number;
  };
  visible: boolean;
  additionalCompensationDetails: Record<string, unknown>;
};

type Skill = {
  name: string;
  experience: "potential-to-develop" | "applying" | "leading";
  proficiency: "no-experience-required" | "beginner" | "proficient" | "expert";
};

type Place = {
  remote: boolean;
  anywhere: boolean;
  timezone: boolean;
  locationType: "remote_countries" | "anywhere" | "timezone" | "onsite";
  location: Array<{
    id: string;
    timezone: number;
    countryCode: string | null;
    latitude: number;
    longitude: number;
  }>;
};
```

### 5.3 CORS Consideration

The Torre API is a third-party service. All requests **must** go through the BFF (`apps/api`) to avoid CORS issues and to keep the upstream API call server-side.

---

## 6. Monorepo Architecture

### 6.1 Directory Structure

```
torre-swipe/
├── apps/
│   ├── web/                    # Next.js 14 frontend (App Router)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Home screen (swipe UI)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── SwipeStack.tsx  # Card stack orchestrator
│   │   │   ├── JobCard.tsx     # Individual card UI
│   │   │   ├── ActionBar.tsx   # ✕ ❤ ⭐ buttons
│   │   │   ├── SkeletonCard.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── CelebrationOverlay.tsx
│   │   ├── hooks/
│   │   │   ├── useSwipeQueue.ts   # Queue management + preloading
│   │   │   └── useDragCard.ts     # Drag gesture state
│   │   ├── store/
│   │   │   └── swipeStore.ts   # Zustand store
│   │   ├── lib/
│   │   │   └── api.ts          # BFF client (fetch wrappers)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                    # Next.js API routes (BFF)
│       ├── app/
│       │   └── api/
│       │       └── opportunities/
│       │           └── route.ts   # POST /api/opportunities
│       ├── lib/
│       │   └── torre.ts           # Torre API client (server-side)
│       ├── package.json
│       ├── next.config.ts
│       └── tsconfig.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── opportunity.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── torre-client/           # Torre API HTTP client (reusable)
│       ├── src/
│       │   ├── client.ts
│       │   ├── types.ts        # (re-exported from @torre-swipe/types)
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

### 6.2 Package Naming Convention

All internal packages use the `@torre-swipe/` scope:
- `@torre-swipe/types`
- `@torre-swipe/torre-client`

### 6.3 Root `package.json`

```json
{
  "name": "torre-swipe",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 6.4 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 6.5 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 7. State Management

### 7.1 Zustand Store (`swipeStore.ts`)

```typescript
type SwipeAction = "like" | "pass" | "super";

type SwipeStore = {
  // Queue
  queue: Opportunity[];          // Cards ready to display (index 0 = top)
  seenIds: Set<string>;          // All IDs ever shown (for dedup)
  isFetching: boolean;
  fetchError: string | null;

  // Undo
  undoCard: Opportunity | null;  // Last swiped card (for 1-level undo)
  undoAction: SwipeAction | null;

  // UI state
  isAnimating: boolean;          // True while exit animation runs
  isCelebrating: boolean;        // Super like celebration overlay

  // Actions
  addCards: (cards: Opportunity[]) => void;
  swipe: (action: SwipeAction) => void;
  undo: () => void;
  setFetching: (v: boolean) => void;
  setFetchError: (msg: string | null) => void;
  setAnimating: (v: boolean) => void;
  setCelebrating: (v: boolean) => void;
};
```

### 7.2 Persistence — Storage Strategy

Persistence is abstracted behind a `StorageStrategy` interface so the underlying storage mechanism (localStorage, a remote database, etc.) can be swapped without touching the store or queue logic.

```typescript
// packages/types/src/storage.ts

export interface StorageStrategy {
  /** Load the set of already-seen opportunity IDs. */
  loadSeenIds(): Promise<Set<string>>;
  /** Persist the updated set of seen IDs. */
  saveSeenIds(ids: Set<string>): Promise<void>;
}
```

**Provided implementation — `LocalStorageStrategy`:**

```typescript
// packages/torre-client/src/storage/LocalStorageStrategy.ts

const KEY = "torre_seen_ids";
const MAX_ENTRIES = 500;

export class LocalStorageStrategy implements StorageStrategy {
  async loadSeenIds(): Promise<Set<string>> {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  }

  async saveSeenIds(ids: Set<string>): Promise<void> {
    let entries = [...ids];
    // Cap at MAX_ENTRIES, dropping the oldest (head of the array)
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(entries.length - MAX_ENTRIES);
    }
    localStorage.setItem(KEY, JSON.stringify(entries));
  }
}
```

**Wiring the strategy into the store:**

The `StorageStrategy` instance is injected at app bootstrap and passed to the Zustand store initializer. This keeps the store agnostic about _how_ data is saved.

```typescript
// apps/web/app/page.tsx (bootstrap)
import { LocalStorageStrategy } from "@torre-swipe/torre-client";
import { initSwipeStore } from "../store/swipeStore";

const storage = new LocalStorageStrategy();
initSwipeStore(storage); // loads seenIds asynchronously before first render
```

```typescript
// apps/web/store/swipeStore.ts (excerpt)
type SwipeStore = {
  // ...existing fields...
  storage: StorageStrategy;
};

export function initSwipeStore(storage: StorageStrategy) {
  storage.loadSeenIds().then(ids => {
    useSwipeStore.setState({ seenIds: ids, storage });
  });
}

// Inside the `swipe` action — persist after every swipe:
swipe: (action) => {
  set(state => {
    const newSeenIds = new Set(state.seenIds).add(state.queue[0].id);
    state.storage.saveSeenIds(newSeenIds); // fire-and-forget
    return { /* updated queue, seenIds, etc. */ };
  });
}
```

> **Out of scope:** Implementing additional strategies (e.g., a REST/database-backed strategy) is explicitly deferred. The interface above is the extension point.

Do **not** persist the queue itself — always re-fetch on page load.

### 7.3 Swipe Queue Hook (`useSwipeQueue.ts`)

```typescript
export function useSwipeQueue() {
  const { queue, seenIds, isFetching, addCards, setFetching } = useSwipeStore();

  // Trigger refill when queue is low
  useEffect(() => {
    if (queue.length < REFILL_THRESHOLD && !isFetching) {
      fetchMore();
    }
  }, [queue.length]);

  async function fetchMore() {
    setFetching(true);
    try {
      const data = await fetchOpportunities({ size: REFILL_SIZE });
      const fresh = data.results.filter(r => !seenIds.has(r.id));
      addCards(fresh);
      preloadImages(fresh);
    } finally {
      setFetching(false);
    }
  }

  return { fetchMore };
}
```

---

## 8. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Monorepo** | Turborepo | ^2.0 | Fast incremental builds, task graph |
| **Package manager** | pnpm | ^9.0 | Workspace support, disk efficiency |
| **Language** | TypeScript | ^5.4 | Strict mode throughout |
| **Frontend framework** | Next.js (App Router) | ^14.x | SSR/SSG optional, great DX |
| **Styling** | Tailwind CSS | ^3.4 | Utility-first, no runtime |
| **Animation / gestures** | Framer Motion | ^11.x | Spring physics, drag gesture built-in |
| **State management** | Zustand | ^4.x | Minimal boilerplate, localStorage easy |
| **BFF** | Next.js API Routes | (same as frontend or separate app) | Proxies Torre API, hides CORS |
| **HTTP client** | Native `fetch` | — | Built into Node 18+ and browsers |
| **Testing (unit)** | Vitest | ^1.x | Fast, native ESM, c8 coverage |
| **Testing (component)** | React Testing Library | ^14.x | Behavior-focused component tests |
| **Testing (e2e)** | Playwright | ^1.x | Cross-browser, mobile viewport — **future work** |
| **Linting** | ESLint + eslint-config-next | — | Consistent code style |
| **Formatting** | Prettier | ^3.x | Opinionated, zero config |

### 8.1 Tailwind Configuration

```javascript
// tailwind.config.ts (apps/web)
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        like: "#4CAF50",
        pass: "#F44336",
        super: "#2196F3",
        "super-star": "#FFC107",
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
};
```

### 8.2 Framer Motion Drag Setup

The top card uses Framer Motion's `drag` prop. Only the top card is draggable; back cards are static.

```typescript
<motion.div
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
  dragElastic={0.9}
  onDragEnd={handleDragEnd}
  animate={controls}
  style={{ x, y, rotate }}
>
  <JobCard job={currentJob} />
  <SwipeOverlay x={x} y={y} />
</motion.div>
```

---

## 9. Test Requirements

### 9.1 Backend (`apps/api`) — Target: ~100% coverage

Every line of BFF code must be covered by unit tests. Use Vitest with c8 for coverage reporting.

**Coverage targets:**
- Statements: ≥ 98%
- Branches: ≥ 95%
- Functions: ≥ 98%
- Lines: ≥ 98%

**Test files:**

```
apps/api/
└── __tests__/
    ├── route.test.ts          # POST /api/opportunities handler
    └── torre.test.ts          # Torre API client unit tests
```

**`torre.test.ts` must cover:**
- Happy path: valid request returns parsed Opportunity[]
- Torre API returns non-200: throws `TorreApiError`
- Network failure: throws and propagates
- Response body with missing optional fields (e.g., `compensation.visible = false`)
- `seenIds` deduplication filter
- Request body construction with all filter types (keywords, language, skill/role, status)
- Query param serialization (currency, periodicity, lang, size, contextFeature)

**`route.test.ts` must cover:**
- Valid POST body → 200 with opportunity list
- Missing/invalid body → 400
- Torre client throws → 502
- CORS headers present in response
- Empty results array handled gracefully

**Test pattern (mock `fetch` globally):**

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.stubGlobal("fetch", vi.fn());

describe("TorreClient.searchOpportunities", () => {
  it("returns parsed results on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 1, size: 1, results: [mockOpportunity] }),
    });
    const result = await client.searchOpportunities({ size: 1 });
    expect(result.results).toHaveLength(1);
  });
});
```

### 9.2 Frontend (`apps/web`) — Unit + Integration

**Component tests (`*.test.tsx`):**

| Component | What to test |
|---|---|
| `JobCard` | Renders title, company name, salary (visible/hidden), skills (max 3 + overflow), remote badge, missing logo fallback |
| `ActionBar` | All 3 buttons render; disabled state during animation; click handlers called |
| `SwipeStack` | Shows skeleton when loading; shows empty state when queue empty; renders correct z-order |
| `SkeletonCard` | Renders shimmer elements |
| `EmptyState` | Shows refresh button; calls onRefresh on click |

**Hook tests:**

| Hook | What to test |
|---|---|
| `useSwipeQueue` | Triggers fetch on mount; triggers refill when queue < threshold; deduplicates by seenIds |

**Store tests (`swipeStore.test.ts`):**
- `addCards` appends without duplicates
- `swipe("like")` removes top card, sets `undoCard`, adds id to `seenIds`
- `swipe("pass")` same as like for queue management
- `swipe("super")` same + sets `isCelebrating = true`
- `undo` restores top card from `undoCard`, clears `undoCard`
- `undo` when `undoCard === null` is a no-op

**Coverage targets (frontend):**
- Statements: ≥ 80%
- Branches: ≥ 75%

### 9.3 E2E — Future Work

> **Status: Out of scope for v1.** E2E tests are planned but deferred. The scenarios below document the intended coverage once E2E is prioritised.

Use Playwright at mobile viewport (375×812, iPhone 13).

| Test | Scenario |
|---|---|
| `swipe.spec.ts` | Mock BFF → swipe right via drag → card exits right |
| `swipe.spec.ts` | Tap ❤ button → card exits right |
| `swipe.spec.ts` | Tap ✕ button → card exits left |
| `swipe.spec.ts` | Tap ⭐ button → celebration overlay appears, auto-dismisses |
| `swipe.spec.ts` | Swipe left then tap undo → card reappears |
| `empty.spec.ts` | Empty queue → empty state shown → tap Refresh → fetch triggered |
| `skeleton.spec.ts` | On load (slow network) → skeletons shown |

---

## 10. API Contract (BFF)

The BFF (`apps/api`) exposes one endpoint to the frontend.

### `POST /api/opportunities`

**Request body:**

```typescript
type OpportunitiesRequest = {
  size?: number;           // default: 10, max: 20
  keywords?: string;       // free text search term
  language?: string;       // e.g. "English"
  fluency?: "basic" | "conversational" | "fully-fluent" | "native" | "fluent";
  currency?: string;       // e.g. "USD"
  periodicity?: "hourly" | "monthly" | "yearly";
};
```

**Example request:**

```json
POST /api/opportunities
Content-Type: application/json

{
  "size": 10,
  "currency": "USD",
  "periodicity": "yearly"
}
```

**Response: 200 OK**

```typescript
type OpportunitiesResponse = {
  results: Opportunity[];  // from @torre-swipe/types
  total: number;
};
```

**Response: 400 Bad Request**

```json
{ "error": "Invalid request body", "details": "..." }
```

**Response: 502 Bad Gateway**

```json
{ "error": "Upstream API error", "message": "..." }
```

### BFF Implementation

The BFF handler:
1. Validates the incoming request body (Zod schema recommended).
2. Constructs a `SearchRequest` for Torre with `status: open` always included.
3. Calls `TorreClient.searchOpportunities()` from `@torre-swipe/torre-client`.
4. Returns the `results` array and `total` to the frontend.
5. Does NOT filter by `seenIds` — that is the frontend's responsibility.

**CORS:** Set `Access-Control-Allow-Origin: *` (or restrict to the web app origin in production).

```typescript
// apps/api/app/api/opportunities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TorreClient } from "@torre-swipe/torre-client";
import { opportunitiesSchema } from "../../../lib/validation";

const torre = new TorreClient("https://search.torre.co");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = opportunitiesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await torre.searchOpportunities(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream API error", message: String(err) },
      { status: 502 }
    );
  }
}
```

---

## 11. Performance Requirements

| Metric | Target |
|---|---|
| First Contentful Paint (mobile 3G) | < 2s |
| Skeleton shown before first card ready | ≤ 200ms after page load |
| Card transition animation | 60 fps, no jank |
| Time between swipe and next card appearing | < 100ms (card is already in DOM, just z-index change) |
| Image load for top 3 cards | Pre-cached before card reaches top position |
| Bundle size (web, gzipped JS) | < 150 KB first load |

### 11.1 Animation Performance Rules

- Use `transform` and `opacity` for all animations (no layout-triggering properties).
- Apply `will-change: transform` to the top card only (remove after exit).
- Back cards use CSS transitions (not JS-driven) — they only change when the queue changes.
- Framer Motion's `useMotionValue` + `useTransform` for overlay opacity — avoids React re-renders during drag.

### 11.2 Bundle Optimization

- Dynamic import `framer-motion` only in the `SwipeStack` component.
- No server-side rendering needed for the swipe UI — render client-side with `"use client"`.
- Use Next.js Image component for company logos with `priority` on the top card's logo.

---

## 12. Accessibility

The swipe interface must be fully usable **without gestures**.

### 12.1 Keyboard Support

| Key | Action |
|---|---|
| `→` Arrow Right | Like (same as ❤ button) |
| `←` Arrow Left | Pass (same as ✕ button) |
| `↑` Arrow Up | Super Like (same as ⭐ button) |
| `Z` | Undo last swipe |
| `Enter` / `Space` | Like (when card is focused) |

Add a global `keydown` event listener on the home page.

### 12.2 ARIA Labels

```html
<button aria-label="Pass this job">✕</button>
<button aria-label="Like this job">❤</button>
<button aria-label="Super like this job">⭐</button>
<button aria-label="Undo last swipe" aria-disabled="true">↩</button>
```

The card itself:
```html
<article
  role="article"
  aria-label="{job.objective} at {company.name}"
  tabIndex={0}
>
```

### 12.3 Reduced Motion

Respect `prefers-reduced-motion`. When active:
- Disable drag animations (cards still respond to button taps).
- Use instant transitions instead of spring animations.
- Disable celebration overlay animation (show static text instead).

```typescript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const springConfig = prefersReducedMotion
  ? { duration: 0 }
  : { type: "spring", stiffness: 400, damping: 30 };
```

### 12.4 Touch Target Sizes

All interactive elements meet the WCAG 2.5.5 AAA minimum of **44×44px** touch target size.

- Action buttons: 56px and 64px diameter ✓
- Undo button: minimum 44×44px ✓
- Skill chips: not interactive, no requirement

---

## Appendix A — Sample API Call

```bash
curl -X POST "https://search.torre.co/opportunities/_search?currency=USD&periodicity=yearly&lang=en&size=10&contextFeature=job_feed" \
  -H "Content-Type: application/json" \
  -d '{
    "and": [
      { "status": { "code": "open" } }
    ]
  }'
```

## Appendix B — Key File Summaries

| File | Purpose |
|---|---|
| `packages/types/src/opportunity.ts` | All shared TypeScript types (Opportunity, Compensation, Skill, etc.) |
| `packages/torre-client/src/client.ts` | `TorreClient` class with `searchOpportunities()` method |
| `apps/api/app/api/opportunities/route.ts` | BFF route handler (validates input, calls TorreClient, returns JSON) |
| `apps/web/store/swipeStore.ts` | Zustand store (queue, undo, celebration state) |
| `apps/web/hooks/useSwipeQueue.ts` | Preloading logic, refill triggering |
| `apps/web/hooks/useDragCard.ts` | Framer Motion drag state, threshold detection |
| `apps/web/components/SwipeStack.tsx` | Renders top 3 cards with correct z-index/transforms |
| `apps/web/components/JobCard.tsx` | Card UI (logo, title, salary, skills, tagline) |
| `apps/web/components/ActionBar.tsx` | ✕ ❤ ⭐ buttons |
| `apps/web/app/page.tsx` | Home page — composes all components, keyboard handler |

## Appendix C — `@torre-swipe/torre-client` Interface

```typescript
export class TorreClient {
  constructor(private baseUrl: string) {}

  async searchOpportunities(params: {
    size?: number;
    currency?: string;
    periodicity?: string;
    lang?: string;
    contextFeature?: string;
    keywords?: string;
    language?: string;
    fluency?: string;
  }): Promise<{ total: number; size: number; results: Opportunity[] }>;
}

export class TorreApiError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Torre API error ${status}: ${body}`);
  }
}
```
