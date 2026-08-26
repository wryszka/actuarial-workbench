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

# ── Build the SPA. Installs deps only if node_modules is missing (npm install
#    needs registry egress; on a restricted network, pre-populate node_modules). ─
build:
	cd src/app/frontend && { [ -d node_modules ] || npm install; } && npm run build
	@# Ship the estate manifest inside the app source (canonical copy stays at repo root).
	cp ESTATE_MANIFEST.yaml src/app/ESTATE_MANIFEST.yaml

# ── Deploy: dev ────────────────────────────────────────────────────────────────
# Databricks Apps does not interpret $${var.X} in app.yaml, so we resolve it
# from the bundle's own variables (databricks.yml stays the single source of
# truth) via scripts/render_app_yaml.py before `apps deploy`.
deploy-dev: build
	databricks bundle deploy -t dev --profile DEV
	@TMPYAML=$$(mktemp); BJSON=$$(mktemp); \
	  databricks bundle validate -t dev --profile DEV -o json > $$BJSON; \
	  python3 scripts/render_app_yaml.py $$BJSON src/app/app.yaml > $$TMPYAML; \
	  databricks workspace import \
	    "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/dev/files/src/app/app.yaml" \
	    --format AUTO --file $$TMPYAML --overwrite --profile DEV; \
	  rm -f $$TMPYAML $$BJSON
	@databricks apps get actuarial-workbench --profile DEV >/dev/null 2>&1 || \
	  databricks apps create actuarial-workbench --description "Actuarial Workbench" --profile DEV
	databricks apps deploy actuarial-workbench \
	    --source-code-path "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/dev/files/src/app" \
	    --profile DEV

# ── Deploy: serverless ───────────────────────────────────────────────────────
deploy-serverless: build
	databricks bundle deploy -t serverless --profile sfevm
	@TMPYAML=$$(mktemp); BJSON=$$(mktemp); \
	  databricks bundle validate -t serverless --profile sfevm -o json > $$BJSON; \
	  python3 scripts/render_app_yaml.py $$BJSON src/app/app.yaml > $$TMPYAML; \
	  databricks workspace import \
	    "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/serverless/files/src/app/app.yaml" \
	    --format AUTO --file $$TMPYAML --overwrite --profile sfevm; \
	  rm -f $$TMPYAML $$BJSON
	@databricks apps get actuarial-workbench --profile sfevm >/dev/null 2>&1 || \
	  databricks apps create actuarial-workbench --description "Actuarial Workbench" --profile sfevm
	databricks apps deploy actuarial-workbench \
	    --source-code-path "/Workspace/Users/$$USER@databricks.com/.bundle/actuarial_workbench_hub/serverless/files/src/app" \
	    --profile sfevm

app-start:
	databricks apps start actuarial-workbench --profile DEV

app-stop:
	databricks apps stop actuarial-workbench --profile DEV
