# Initial Instructions — The Regenerative Earth Project
## V0.1.0 Developer Onboarding Guide

This document is the starting point for anyone working on or contributing to the codebase. Read this before touching any source files.

---

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x | 18+ required for native `fetch` in server code |
| npm | 9.x | Bundled with Node 18+ |
| Git | Any recent | — |

No API keys are required. All external data sources used in V0.1 are free and keyless.

---

## Getting Started

**1. Clone the repository**
```bash
git clone https://github.com/regenerative-earth-project/regenerative-earth-project.git
cd regenerative-earth-project
```

**2. Install dependencies**
```bash
npm install
```

**3. Copy environment file**
```bash
cp .env.example .env.local
```
No values need to be edited for local development.

**4. Start the development server**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── blueprint/route.ts     # POST /api/blueprint — main endpoint
│   │   └── health/route.ts        # GET /api/health — liveness probe
│   ├── layout.tsx                  # Root layout with React Query provider
│   ├── page.tsx                    # Home page — coordinate form + results
│   └── globals.css
├── lib/
│   ├── adapters/                   # External API adapters (data layer)
│   │   ├── types.ts               # Shared adapter interfaces
│   │   ├── open-meteo.ts          # Climate data (Open-Meteo)
│   │   ├── open-elevation.ts      # Terrain/elevation data
│   │   ├── nominatim.ts           # Reverse geocoding (OpenStreetMap)
│   │   └── fetch-all.ts           # Parallel orchestrator for all adapters
│   ├── engine/                     # Rule engine (pure functions, no async)
│   │   ├── types.ts               # Strategy module interfaces
│   │   ├── index.ts               # Engine orchestrator → Blueprint
│   │   ├── water.ts               # Water strategy rules
│   │   ├── food.ts                # Food strategy rules
│   │   ├── shelter.ts             # Shelter strategy rules
│   │   ├── energy.ts              # Energy strategy rules
│   │   └── risks.ts               # Risk assessment rules
│   ├── ethics/
│   │   └── guardrails.ts          # Ethical validation (runs on every request)
│   ├── schemas/
│   │   ├── input.ts               # Zod input schema (lat/lon)
│   │   └── blueprint.ts           # Zod output schema + inferred TS types
│   └── utils/
│       └── reasoning.ts           # ReasoningTraceBuilder utility
├── components/
│   ├── Providers.tsx               # React Query provider wrapper
│   ├── CoordinateForm.tsx          # Input form with example locations
│   └── BlueprintDisplay.tsx        # Collapsible blueprint result renderer
└── __fixtures__/                   # Static JSON fixtures for tests
    ├── mock-open-meteo-tropical.json
    ├── mock-open-meteo-arid.json
    ├── mock-open-elevation.json
    └── mock-nominatim.json
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server on port 3000 |
| `npm run build` | Compile production build (run before deploying) |
| `npm run start` | Start production server (requires `build` first) |
| `npm test` | Run all tests once with Vitest |
| `npm run test:watch` | Run tests in watch mode during development |
| `npm run typecheck` | Run TypeScript compiler check with no emit |
| `npm run lint` | Run ESLint |

---

## API Reference

### `POST /api/blueprint`

Accepts geographic coordinates. Returns a full regenerative development blueprint.

**Request body:**
```json
{
  "latitude": -1.2921,
  "longitude": 36.8219
}
```

**Constraints:**
- `latitude`: number, `-90` to `90`
- `longitude`: number, `-180` to `180`
- `(0, 0)` (Null Island) is rejected — it is treated as an unset default value

**Success response — `200 OK`:**
```json
{
  "metadata": {
    "coordinates": { "latitude": -1.2921, "longitude": 36.8219 },
    "location_name": "Nairobi, Kenya",
    "generated_at": "2026-02-27T17:00:00.000Z",
    "version": "0.1.0",
    "disclaimer": "This is decision support only..."
  },
  "water_strategy": {
    "primary_method": "Combined rainwater harvesting + groundwater",
    "techniques": [...],
    "estimated_annual_rainfall_mm": 700,
    "storage_recommendation": "...",
    "reasoning_trace": [...]
  },
  "food_strategy": { ... },
  "shelter_strategy": { ... },
  "energy_strategy": { ... },
  "risks": { ... },
  "reasoning_trace": {
    "data_sources_used": [...],
    "rules_applied": [...],
    "confidence_level": "high",
    "limitations": [...],
    "ethical_checks_passed": [...]
  }
}
```

**Error responses:**

| Code | Cause |
|---|---|
| `400` | Invalid or missing latitude/longitude |
| `403` | Rejected by ethical guardrails (e.g. Null Island) |
| `502` | All upstream data sources are unavailable |
| `500` | Unexpected internal error |

**Response headers of note:**
- `X-Confidence-Level: high | medium | low` — reflects how many data sources succeeded
- `Cache-Control: no-store` — coordinates are never cached

### `GET /api/health`

Returns server status. Used by Railway for health checks.

```json
{ "status": "ok", "version": "0.1.0", "timestamp": "..." }
```

---

## Testing the API Locally

**Nairobi, Kenya (tropical):**
```bash
curl -X POST http://localhost:3000/api/blueprint \
  -H "Content-Type: application/json" \
  -d '{"latitude": -1.2921, "longitude": 36.8219}'
```

**Riyadh, Saudi Arabia (arid):**
```bash
curl -X POST http://localhost:3000/api/blueprint \
  -H "Content-Type: application/json" \
  -d '{"latitude": 24.7136, "longitude": 46.6753}'
```

**London, UK (temperate):**
```bash
curl -X POST http://localhost:3000/api/blueprint \
  -H "Content-Type: application/json" \
  -d '{"latitude": 51.5074, "longitude": -0.1278}'
```

**Null Island rejection (should return 403):**
```bash
curl -X POST http://localhost:3000/api/blueprint \
  -H "Content-Type: application/json" \
  -d '{"latitude": 0, "longitude": 0}'
```

---

## Data Architecture

V0.1 fetches from three keyless APIs in parallel on every request:

| Source | Purpose | Endpoint |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Climate: rainfall, temperature, wind, sunshine | `api.open-meteo.com/v1/forecast` |
| [Open Elevation](https://api.open-elevation.com) | Terrain: elevation + slope estimate | `api.open-elevation.com/api/v1/lookup` |
| [Nominatim / OSM](https://nominatim.org) | Reverse geocoding: country, region, location name | `nominatim.openstreetmap.org/reverse` |

**Graceful degradation:** if one or more adapters fail, the system continues with available data and fallback defaults. The `confidence_level` in the response reflects this:
- `high` — all 3 sources succeeded
- `medium` — 1 source failed or used fallback
- `low` — 2 or more sources failed

Failures are always documented in `reasoning_trace.limitations`.

---

## Rule Engine

All strategy logic lives in `src/lib/engine/`. Each strategy module is a **pure synchronous function** with the signature:

```typescript
type StrategyModule<T> = (input: StrategyInput) => T
```

Rules use if/else chains with documented thresholds. Every decision appends a human-readable step to `reasoning_trace` so any recommendation can be traced back to specific data and rules.

The five modules are independent. Adding a new rule means editing only one file. Changing a threshold requires changing only one line, with no downstream side effects.

---

## Ethical Guardrails

Every request passes through `src/lib/ethics/guardrails.ts` before any data is fetched or processing begins. V0.1 checks:

1. Coordinate range validity (defense-in-depth, after Zod validation)
2. Null Island rejection `(0, 0)` — treated as an unset default
3. Antarctic interior warning — request proceeds but a limitation is flagged
4. Disclaimer injection — always ensures "decision support, not instructions" is in output
5. No-persistence attestation — confirms coordinates are not stored

All checks that pass are recorded in `reasoning_trace.ethical_checks_passed`. Rejections return a clear, human-readable reason in the HTTP 403 response.

**The ethical guardrails module must never be bypassed.** It is called directly in the API route handler, not as middleware that can be accidentally omitted.

---

## Deployment (Railway)

**Automated deployment:**
1. Push to the `main` branch on GitHub
2. Railway auto-detects Next.js, runs `npm run build`, then `npm run start`
3. Verify deployment via health check: `GET https://<your-domain>/api/health`

**Manual deployment steps:**
1. `npm run build` — verify a clean build locally first
2. `npm test` — verify all tests pass
3. Push to GitHub — Railway deploys automatically on push to `main`

Railway configuration is in [railway.toml](./railway.toml). No environment variables are required for V0.1 beyond `NODE_ENV=production`.

---

## Known Limitations (V0.1)

These are documented in every blueprint's `reasoning_trace.limitations`:

- **Seismic data** — no seismic risk assessment; deferred to V0.2 (USGS integration planned)
- **Soil classification** — no soil type data; field assessment always recommended
- **Coastal detection** — approximate only; based on OSM type/category fields
- **Humidity** — Open-Meteo free tier does not include humidity in daily data; `60%` is used as a global average default
- **Climate zone** — simplified 5-zone Köppen classification; not a substitute for detailed regional climate analysis
- **All strategies are rule-based** — explicit if/else logic; AI reasoning and probabilistic models are deferred to V0.2

---

## Before Submitting a Pull Request

1. `npm run typecheck` — must exit with zero errors
2. `npm test` — all tests must pass
3. `npm run build` — production build must succeed
4. If you modified a rule in `src/lib/engine/`, add or update the corresponding test in `src/lib/engine/__tests__/`
5. If you added a new rule threshold, document the value and unit in an inline comment
6. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for ethical alignment requirements — all contributions must align with the project's humanitarian mission

---

## Core Principles (Summary)

The detailed rationale lives in [MANIFESTO.md](./MANIFESTO.md) and [ARCHITECTURE.md](./ARCHITECTURE.md). In code terms, these principles translate to concrete constraints:

- **Local materials only** — shelter and food strategies never recommend manufactured or imported inputs as primary solutions
- **Decision support, not instructions** — the disclaimer is hard-coded into the Zod output schema and cannot be omitted
- **All logic must be explainable** — every strategy module must populate `reasoning_trace`; empty traces are a bug
- **No data storage** — this is a stateless system; there is no database in V0.1; coordinates must never be logged to persistent storage
- **Transparency** — confidence level and data source status are always returned in the response

---

*Version 0.1.0 — Last updated February 2026*
