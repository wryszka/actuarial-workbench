"""Runtime configuration for the Actuarial Workbench hub.

The hub is a pure launcher — it holds no data and talks to no warehouse. Its
only configuration is the set of URLs for the apps each tile links out to.
Every URL is read from an environment variable (set by app.yaml from the
bundle's databricks.yml variables) so the hub is portable across workspaces
with no code changes.
"""
import os


def get_app_display_name() -> str:
    return os.getenv("APP_DISPLAY_NAME", "Actuarial Workbench").strip()


def get_entity_name() -> str:
    return os.getenv("ENTITY_NAME", "Bricksurance SE").strip()


def get_solvency_app_url() -> str:
    """External Solvency II workbench app URL. Empty falls back to the tile's
    static default (so the hub still renders if the env var is unset)."""
    return os.getenv("SOLVENCY_APP_URL", "").strip()


def get_pricing_app_url() -> str:
    """External pricing workbench app URL. Empty falls back to the tile's
    static default."""
    return os.getenv("PRICING_APP_URL", "").strip()
