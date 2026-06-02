# Actuarial Workbench — hub

A standalone **launcher** app: one front door for the actuarial work. The
landing page is a grid of tiles, each opening the Databricks App that owns that
workflow. This app holds no data — no catalog, schema, warehouse, or models. It
is purely the central place to launch the others from.

```
┌──────────────────────────────────────────────────────────┐
│  Actuarial Workbench  (this hub app)                       │
│                                                            │
│   [ Solvency II ]  →  solvency2-workbench app   (live)     │
│   [ Pricing     ]  →  pricing-workbench app     (live)     │
│   [ IFRS 17 ] [ Reinsurance ] [ Claims ] ...    (roadmap)  │
│   [ SAS migration ] [ Excel migration ]         (in prog.) │
└──────────────────────────────────────────────────────────┘
```

The landing page and roadmap stubs are lifted from the Solvency II app's own
"Actuarial Workbench" landing, split out so the hub can run independently and
each workflow can evolve as its own deployed app.

## Stack

- **Frontend** — React 19 + Vite + Tailwind 4 (TypeScript). Two routes: `/`
  (tile landing) and `/roadmap/:slug` (stub describing a not-yet-live workflow).
- **Backend** — a thin FastAPI app that serves the built SPA and exposes
  `/api/config`, which tells the frontend the URL each live tile should open.

No SQL, MLflow, or AI dependencies — `requirements.txt` is just FastAPI + uvicorn.

## Configuration — env-driven, portable

Live-tile URLs are read from environment variables (set by `app.yaml` from the
bundle's `databricks.yml` variables), so the same code deploys to any workspace:

| Env var            | databricks.yml var  | Tile        |
|--------------------|---------------------|-------------|
| `SOLVENCY_APP_URL` | `solvency_app_url`  | Solvency II |
| `PRICING_APP_URL`  | `pricing_app_url`   | Pricing     |
| `ENTITY_NAME`      | `entity_name`       | header      |

If a URL env var is empty, the tile falls back to a static default baked into
`frontend/src/lib/workbench-tiles.ts` so the tiles always open something.

## Local dev

```bash
# backend
cd src/app && uvicorn app:app --reload --port 8000
# frontend (separate shell) — proxies /api to :8000
cd src/app/frontend && npm install && npm run dev
```

## Deploy

```bash
make deploy-dev            # build SPA + bundle deploy + app deploy (dev workspace)
make deploy-serverless     # same, serverless workspace
make app-start / app-stop  # start / stop the app (no DBU while stopped)
```

**Deployed (dev):** https://actuarial-workbench-7474656169654171.aws.databricksapps.com
(FE dev workspace, app name `actuarial-workbench`). The Solvency II and Pricing
tiles point at the deployed apps in the same workspace.

The deploy substitutes `${var.X}` in `app.yaml` before `apps deploy` because
Databricks Apps does not interpolate bundle variables in `app.yaml`.

## Adding / plumbing a tile

Edit `frontend/src/lib/workbench-tiles.ts`:

- **Plumb a live app** — set `status: 'live'` and point `to` at its deployed
  URL. For per-workspace portability, add a `*_app_url` variable in
  `databricks.yml`, surface it via `app.yaml` + `server/config.py` +
  `/api/config`, and override `to` in `Workbench.tsx` from that config (the
  Solvency II + Pricing tiles show the pattern).
- **Advertise a roadmap workflow** — set `status: 'roadmap'` (or
  `'in_progress'`), `to: '/roadmap/<slug>'`, and add a matching entry in
  `frontend/src/lib/roadmap-content.ts`. No new component or route needed.

## About this demo

This is a **demonstration** built by Databricks Field Engineering. All entities,
figures, and data referenced by the linked apps are **synthetic** — "Bricksurance
SE" is a fictional composite insurer. Nothing here is real regulatory output,
financial advice, or a certified Solvency II / IFRS 17 submission. The hub links
to other demo apps; their availability depends on those apps being deployed and
running in the target workspace.
