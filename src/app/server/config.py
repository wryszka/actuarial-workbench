"""Runtime configuration for the Actuarial Workbench hub.

The hub is a pure launcher — it holds no data and talks to no warehouse. Its
configuration is the set of URLs for the apps each tile links out to, plus a
handful of pointers (paths / job IDs) used to build deep links into the
workspace for the accelerator tiles.

Everything is read from environment variables (set by app.yaml from the
bundle's databricks.yml variables) so the hub is portable across workspaces
with no code changes.
"""
import os


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def get_app_display_name() -> str:
    return _env("APP_DISPLAY_NAME", "Actuarial Workbench")


def get_entity_name() -> str:
    return _env("ENTITY_NAME", "Bricksurance SE")


def get_solvency_app_url() -> str:
    return _env("SOLVENCY_APP_URL")


def get_pricing_app_url() -> str:
    return _env("PRICING_APP_URL")


def get_claims_app_url() -> str:
    return _env("CLAIMS_APP_URL")


def hub_config() -> dict:
    """Everything the frontend needs at /api/config."""
    return {
        "app_display_name": get_app_display_name(),
        "entity_name": get_entity_name(),
        "solvency_app_url": get_solvency_app_url(),
        "pricing_app_url": get_pricing_app_url(),
        "claims_app_url": get_claims_app_url(),
        # Workspace base + catalog for accelerator deep links.
        "workspace_host": _env("WORKSPACE_HOST"),
        "catalog_name": _env("CATALOG_NAME"),
        # Excel accelerator pieces. Notebooks only for now — the jobs + DLT
        # pipeline were removed and the notebooks aren't validated yet.
        "excel_folder_path": _env("EXCEL_FOLDER_PATH"),
        # SAS migration pieces.
        "sas_schema": _env("SAS_SCHEMA"),
        "sas_notebook_path": _env("SAS_NOTEBOOK_PATH"),
    }
