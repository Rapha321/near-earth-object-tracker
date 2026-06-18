# Near-Earth Object 3D Tracker

An immersive 3D dashboard that tracks all near-Earth asteroids approaching in the next 7 days, using NASA's free NeoWs API. Features an animated 3D space scene (Earth + orbiting asteroids color-coded by hazard level), real-time KPI cards, and a detail panel showing miss distance, velocity, and diameter.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/data-app run dev` — run the frontend (port determined by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Frontend: React + Vite + Tailwind CSS v4
- 3D: React Three Fiber + Drei
- Data fetching: TanStack React Query (generated hooks via Orval)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/neo.ts` — NASA NeoWs proxy + in-memory cache + seed fallback
- `artifacts/data-app/src/pages/tracker.tsx` — main page layout
- `artifacts/data-app/src/components/Scene.tsx` — Three.js 3D scene (Earth + asteroids)
- `artifacts/data-app/src/components/NeoSidebar.tsx` — sorted object list
- `artifacts/data-app/src/components/NeoDetail.tsx` — selected asteroid detail panel
- `artifacts/data-app/src/components/KpiCards.tsx` — top summary stats
- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives all codegen (hooks + Zod schemas). Change the spec, run codegen, never hand-write fetch calls.
- **Server-side caching**: The API server caches NASA responses for 55 minutes (DEMO_KEY limit is 30 req/hour). If the cache is empty and NASA returns 429, it falls back to realistic seed data so the UI always renders.
- **NeoDetail uses list data**: The detail panel receives the full NEO object from the already-loaded list, avoiding extra per-ID NASA API calls that would exhaust the rate limit.
- **WebGL error boundary**: A React class error boundary wraps the Three.js Canvas. In no-GPU environments (like Replit's preview iframe), the 3D scene degrades gracefully and the data panels still function.
- **Dark-only theme**: `App.tsx` force-adds the `dark` class to `<html>` on mount — the space aesthetic requires it.

## Product

- Live list of all NEOs approaching Earth within 7 days
- 3D space scene: Earth at center, asteroids orbiting at scaled distances, color-coded red (hazardous) or blue (safe), size-scaled by estimated diameter
- KPI cards: total count, hazardous count, closest approach distance, fastest velocity
- Sidebar sorted by miss distance (closest first) with HAZARD badges
- Click any asteroid to see miss distance, velocity, diameter range, approach date, and NASA JPL link

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- NASA `DEMO_KEY` rate-limit: 30 requests/hour. The API server caches results for 55 minutes and falls back to seed data when exhausted. Set `NASA_API_KEY` env var with a real key to raise this limit (free registration at api.nasa.gov).
- WebGL errors in Replit preview are expected — the Replit sandbox has no GPU. The app renders the full 3D scene in any real browser.
- Do not run `pnpm dev` at workspace root — use workflow restarts or `pnpm --filter @workspace/<name> run dev`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
