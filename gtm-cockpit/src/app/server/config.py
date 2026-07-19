"""Runtime configuration for the UKI Insurance GTM Cockpit.

Unlike the hub launcher (which holds no data), the cockpit is a data-backed
app: it reads governed Unity Catalog tables via a SQL warehouse and proxies a
Genie space. Everything is env-driven (set by app.yaml from databricks.yml
variables) so the same code is portable across workspaces.
"""
import os
import logging

from databricks.sdk import WorkspaceClient

logger = logging.getLogger(__name__)
_workspace_client: WorkspaceClient | None = None


def is_databricks_app() -> bool:
    return os.getenv("DATABRICKS_APP_NAME") is not None


def get_workspace_client() -> WorkspaceClient:
    global _workspace_client
    if _workspace_client is None:
        if is_databricks_app():
            _workspace_client = WorkspaceClient()
        else:
            profile = os.getenv("DATABRICKS_PROFILE", "DEV")
            _workspace_client = WorkspaceClient(profile=profile)
    return _workspace_client


def get_catalog() -> str:
    return os.getenv("CATALOG_NAME", "lr_dev_aws_us_catalog")


def get_schema() -> str:
    return os.getenv("SCHEMA_NAME", "gtm_cockpit")


def get_warehouse_id() -> str:
    return os.getenv("WAREHOUSE_ID", "a3b61648ea4809e3")


def get_genie_space_id() -> str:
    return os.getenv("GENIE_SPACE_ID", "01f182fcad1819cf9f8413679c998b54")


def get_entity_name() -> str:
    return os.getenv("ENTITY_NAME", "Bricksurance SE")


def get_territory() -> str:
    return os.getenv("TERRITORY", "UKI")


def get_impact_owner() -> str:
    """Whose impact the 'My Impact' view reflects (label only)."""
    return os.getenv("IMPACT_OWNER", "Laurence Ryszka")


def get_llm_endpoint() -> str:
    """Foundation Model API endpoint for the prep agent (Claude, per standard)."""
    return os.getenv("LLM_ENDPOINT", "databricks-claude-sonnet-4-5")


def fqn(table: str) -> str:
    # Numbered tables need backtick-quoting (1_accounts starts with a digit).
    return f"{get_catalog()}.{get_schema()}.`{table}`"


def app_config() -> dict:
    return {
        "entity_name": get_entity_name(),
        "territory": get_territory(),
        "genie_space_id": get_genie_space_id(),
        "catalog": get_catalog(),
        "schema": get_schema(),
        "impact_owner": get_impact_owner(),
    }
