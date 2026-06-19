# 🌍 Near-Earth Object Tracker

An immersive **3D space dashboard** that tracks all asteroids approaching Earth in the next 7 days, powered by NASA's free NeoWs API. Built entirely through **prompt engineering with an AI agent on [Replit](https://replit.com)** — no manual coding.

---

## 🚀 Live Demo

**[→ Open the app](https://celestial-approaching-objects--rapha321.replit.app/)**

![Near-Earth Object Tracker](screenshots/NearEarthObject.mp4)

> The 3D scene (Earth + orbiting asteroids) requires a GPU-capable browser. The data panels work everywhere.

---

## ✨ Features

- **Live asteroid data** — fetches all near-Earth objects approaching within 7 days from NASA's NeoWs API
- **3D space scene** — Earth at the center, asteroids orbiting at scaled distances, color-coded 🔴 red (hazardous) or 🔵 blue (safe), size-scaled by estimated diameter
- **Real-time KPI cards** — total tracked count, hazardous count, closest approach distance, and fastest velocity
- **Sorted sidebar** — all objects ranked by miss distance (closest first) with **HAZARD** badges
- **Detail panel** — click any asteroid to see miss distance, velocity, diameter range, approach date, and a direct NASA JPL link
- **Graceful fallback** — if the NASA rate limit is hit, the app serves realistic cached seed data so the UI never goes blank

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces |
| **Language** | TypeScript 5.9, Node.js 24 |
| **Backend** | Express 5 — NASA NeoWs proxy with 55-min in-memory cache |
| **Frontend** | React 19 + Vite + Tailwind CSS v4 |
| **3D Graphics** | React Three Fiber + Drei (Three.js) |
| **Data Fetching** | TanStack React Query (auto-generated hooks via Orval) |
| **API Contract** | OpenAPI 3.1 spec → codegen (hooks + Zod schemas) |
| **Validation** | Zod v4 |
| **Build** | esbuild (server), Vite (client) |
| **Hosting** | Replit Deployments |

---

## 🤖 Built with AI

This entire application was built through **prompt engineering with the Replit AI Agent** — no manual coding. The development workflow:

1. Described the product idea to the Replit Agent in plain English
2. The agent scaffolded the full pnpm monorepo, designed the OpenAPI contract, implemented the Express backend, and built all React components
3. Iterative refinements (3D scene, error boundaries, caching, seed fallback) were done through natural language prompts
4. The agent handled TypeScript types, codegen pipelines, and deployment configuration automatically

> **Replit Agent** is an autonomous AI coding assistant that can build, run, debug, and deploy full-stack applications from a conversation.

---

## 📡 Data Source

NASA's **[NeoWs (Near Earth Object Web Service)](https://api.nasa.gov/)** API — free and publicly available. Register for a free API key at [api.nasa.gov](https://api.nasa.gov) to raise the rate limit beyond the default 30 req/hour.

---

## 🗂️ Project Structure

```
├── artifacts/
│   ├── api-server/        # Express backend (NASA proxy + cache)
│   └── data-app/          # React + Three.js frontend
├── lib/
│   ├── api-spec/          # OpenAPI 3.1 contract (source of truth)
│   ├── api-client-react/  # Generated React Query hooks
│   └── api-zod/           # Generated Zod validation schemas
└── scripts/               # Shared utility scripts
```

---

## ⚡ Architecture Highlights

- **Contract-first API**: The OpenAPI spec drives all codegen — hooks and Zod schemas are generated automatically. No hand-written fetch calls.
- **Server-side caching**: NASA responses are cached for 55 minutes. On rate-limit (429), serves stale cache or realistic seed data — the UI always renders.
- **No per-ID API calls**: The detail panel reuses data from the already-loaded list, avoiding extra NASA calls that would exhaust the free rate limit.
- **WebGL error boundary**: A React error boundary wraps the Three.js canvas. In no-GPU environments, the 3D scene degrades gracefully while data panels remain functional.
