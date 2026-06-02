/**
 * Hub config — the per-workspace URLs each live tile opens.
 *
 * Served by the FastAPI backend at /api/config, sourced from env vars set by
 * the bundle (databricks.yml). Empty strings mean "not configured", and the
 * caller falls back to the static default baked into the tile registry.
 */
export interface HubConfig {
  app_display_name: string;
  entity_name: string;
  solvency_app_url: string;
  pricing_app_url: string;
}

export async function fetchConfig(): Promise<HubConfig> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
  return res.json();
}
