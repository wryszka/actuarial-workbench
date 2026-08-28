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


def get_reinsurance_app_url() -> str:
    return _env("REINSURANCE_APP_URL")


def get_lifecast_app_url() -> str:
    return _env("LIFECAST_APP_URL")


def get_underwriting_app_url() -> str:
    return _env("UNDERWRITING_APP_URL")


def get_ifrs17_app_url() -> str:
    return _env("IFRS17_APP_URL")


def get_reserving_app_url() -> str:
    return _env("RESERVING_APP_URL")


def get_document_gateway_app_url() -> str:
    return _env("DOCUMENT_GATEWAY_APP_URL")


def get_gtm_cockpit_url() -> str:
    return _env("GTM_COCKPIT_URL")


def get_group_warehouse_id() -> str:
    return _env("GROUP_WAREHOUSE_ID")


def get_group_model_endpoint() -> str:
    return _env("GROUP_MODEL_ENDPOINT", "databricks-claude-sonnet-4-5")


def get_group_catalog() -> str:
    return _env("GROUP_CATALOG")


def get_group_identity_mode() -> str:
    return _env("GROUP_IDENTITY_MODE", "app-principal")


def group_enabled() -> bool:
    """The Control Tower's live reads need a warehouse; without one it still
    renders the manifest-driven map/tiles but marks data unavailable."""
    return bool(get_group_warehouse_id())


def hub_config() -> dict:
    """Everything the frontend needs at /api/config."""
    return {
        "group_enabled": group_enabled(),
        "app_display_name": get_app_display_name(),
        "entity_name": get_entity_name(),
        "solvency_app_url": get_solvency_app_url(),
        "pricing_app_url": get_pricing_app_url(),
        "claims_app_url": get_claims_app_url(),
        "reinsurance_app_url": get_reinsurance_app_url(),
        "lifecast_app_url": get_lifecast_app_url(),
        "underwriting_app_url": get_underwriting_app_url(),
        "ifrs17_app_url": get_ifrs17_app_url(),
        "reserving_app_url": get_reserving_app_url(),
        "document_gateway_app_url": get_document_gateway_app_url(),
        "gtm_cockpit_url": get_gtm_cockpit_url(),
        # Workspace base + catalog for accelerator deep links.
        "workspace_host": _env("WORKSPACE_HOST"),
        "catalog_name": _env("CATALOG_NAME"),
        # Excel accelerator pieces: the shared notebooks folder + the
        # front-door app (four use cases, health chips, reset buttons).
        "excel_folder_path": _env("EXCEL_FOLDER_PATH"),
        "excel_app_url": _env("EXCEL_APP_URL"),
        # SAS migration pieces.
        "sas_schema": _env("SAS_SCHEMA"),
        "sas_notebook_path": _env("SAS_NOTEBOOK_PATH"),
    }
