# Make targets for the Actuarial Workbench hub app.

.PHONY: help build deploy-dev deploy-serverless app-start app-stop dev

help:
	@echo "  make build            — build the React frontend (frontend/dist)"
	@echo "  make deploy-dev       — build + bundle deploy + app deploy to the dev target"
	@echo "  make deploy-serverless— build + bundle deploy + app deploy to the serverless target"
	@echo "  make app-start        — start the Databricks App"
	@echo "  make app-stop         — stop the Databricks App (no DBU while stopped)"
	@echo "  make dev              — run backend (uvicorn:8000) + frontend (vite) locally"

# ── Local dev ────────────────────────────────────────────────────────────────
dev:
	@echo "Backend → http://localhost:8000   Frontend → http://localhost:5173 (proxies /api)"
	@echo "Run in two shells:"
	@echo "  (cd src/app && uvicorn app:app --reload --port 8000)"
	@echo "  (cd src/app/frontend && npm run dev)"

# ── Build the SPA (uv-friendly: uses npm via the shell; no network egress here) ─
build:
	cd src/app/frontend && npm install && npm run build

# ── Deploy: dev ────────────────────────────────────────────────────────────────
deploy-dev: build
	databricks bundle deploy -t dev --profile DEV
	@# Databricks Apps does not interpret $${var.X} in app.yaml; substitute first.
	@TMPYAML=$$(mktemp); \
	  sed \
	    -e 's|$${var.app_display_name}|Actuarial Workbench|g' \
	    -e 's|$${var.entity_name}|Bricksurance SE|g' \
	    -e 's|$${var.solvency_app_url}|https://solvency2-workbench-7474659673789953.aws.databricksapps.com|g' \
	    -e 's|$${var.pricing_app_url}|https://pricing-workbench-7474656169654171.aws.databricksapps.com/|g' \
	    src/app/app.yaml > $$TMPYAML; \
	  databricks workspace import \
	    "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/dev/files/src/app/app.yaml" \
	    --format AUTO --file $$TMPYAML --overwrite --profile DEV; \
	  rm -f $$TMPYAML
	@databricks apps get actuarial-workbench --profile DEV >/dev/null 2>&1 || \
	  databricks apps create actuarial-workbench --description "Actuarial Workbench" --profile DEV
	databricks apps deploy actuarial-workbench \
	    --source-code-path "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/dev/files/src/app" \
	    --profile DEV

# ── Deploy: serverless ───────────────────────────────────────────────────────
deploy-serverless: build
	databricks bundle deploy -t serverless --profile sfevm
	@TMPYAML=$$(mktemp); \
	  sed \
	    -e 's|$${var.app_display_name}|Actuarial Workbench|g' \
	    -e 's|$${var.entity_name}|Bricksurance SE|g' \
	    -e 's|$${var.solvency_app_url}||g' \
	    -e 's|$${var.pricing_app_url}||g' \
	    src/app/app.yaml > $$TMPYAML; \
	  databricks workspace import \
	    "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/serverless/files/src/app/app.yaml" \
	    --format AUTO --file $$TMPYAML --overwrite --profile sfevm; \
	  rm -f $$TMPYAML
	@databricks apps get actuarial-workbench --profile sfevm >/dev/null 2>&1 || \
	  databricks apps create actuarial-workbench --description "Actuarial Workbench" --profile sfevm
	databricks apps deploy actuarial-workbench \
	    --source-code-path "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/serverless/files/src/app" \
	    --profile sfevm

app-start:
	databricks apps start actuarial-workbench --profile DEV

app-stop:
	databricks apps stop actuarial-workbench --profile DEV
