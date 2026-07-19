# Make targets for the UKI Insurance GTM Cockpit app.

.PHONY: help parse seed genie build deploy-dev app-start app-stop dev

help:
	@echo "  make parse       — parse the raw UKI sheet/plan → data/gtm_seed.json"
	@echo "  make seed        — create schema + load governed UC tables (dev)"
	@echo "  make genie       — create the Genie space over the schema (prints space_id)"
	@echo "  make build       — build the React frontend (frontend/dist)"
	@echo "  make deploy-dev  — build + bundle deploy + app deploy to dev"
	@echo "  make app-start   — start the Databricks App"
	@echo "  make app-stop    — stop the Databricks App (no DBU while stopped)"
	@echo "  make dev         — run backend (uvicorn:8000) + frontend (vite) locally"

# ── Data layer (run once / on data change) ─────────────────────────────────
parse:
	python3 scripts/parse_gtm_data.py

seed:
	.venv/bin/python scripts/seed_uc.py

genie:
	.venv/bin/python scripts/create_genie_space.py

# ── Local dev ──────────────────────────────────────────────────────────────
dev:
	@echo "Backend → http://localhost:8000   Frontend → http://localhost:5173"
	@echo "  (cd src/app && DATABRICKS_PROFILE=DEV uvicorn app:app --reload --port 8000)"
	@echo "  (cd src/app/frontend && npm run dev)"

# ── Build SPA ────────────────────────────────────────────────────────────────
build:
	cd src/app/frontend && { [ -d node_modules ] || npm install; } && npm run build

# ── Deploy: dev ────────────────────────────────────────────────────────────────
deploy-dev: build
	databricks bundle deploy -t dev --profile DEV
	@TMPYAML=$$(mktemp); BJSON=$$(mktemp); \
	  databricks bundle validate -t dev --profile DEV -o json > $$BJSON; \
	  python3 scripts/render_app_yaml.py $$BJSON src/app/app.yaml > $$TMPYAML; \
	  databricks workspace import \
	    "/Workspace/Users/$$USER@databricks.com/.bundle/gtm_cockpit/dev/files/src/app/app.yaml" \
	    --format AUTO --file $$TMPYAML --overwrite --profile DEV; \
	  rm -f $$TMPYAML $$BJSON
	@databricks apps get gtm-cockpit --profile DEV >/dev/null 2>&1 || \
	  databricks apps create gtm-cockpit --description "UKI Insurance GTM Cockpit" --profile DEV
	databricks apps deploy gtm-cockpit \
	    --source-code-path "/Workspace/Users/$$USER@databricks.com/.bundle/gtm_cockpit/dev/files/src/app" \
	    --profile DEV

app-start:
	databricks apps start gtm-cockpit --profile DEV

app-stop:
	databricks apps stop gtm-cockpit --profile DEV
