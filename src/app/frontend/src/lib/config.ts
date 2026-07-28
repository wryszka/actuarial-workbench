/**
 * Hub config — per-workspace URLs and workspace-resource pointers.
 *
 * Served by the FastAPI backend at /api/config, sourced from env vars set by
 * the bundle (databricks.yml). Empty strings mean "not configured", and the
 * caller falls back to a static default (live-tile URLs) or hides the link
 * (accelerator deep links).
 */
export interface HubConfig {
  app_display_name: string;
  entity_name: string;
  solvency_app_url: string;
  pricing_app_url: string;
  claims_app_url: string;
  reinsurance_app_url: string;
  lifecast_app_url: string;
  underwriting_app_url: string;
  ifrs17_app_url: string;
  reserving_app_url: string;

  // Workspace base URL used to build deep links into notebooks / jobs /
  // pipelines / dashboards / Catalog Explorer for the accelerator tiles.
  workspace_host: string;
  catalog_name: string;

  // Excel accelerator (actuarial-excel-accelerator) — notebooks only for now.
  excel_folder_path: string;   // workspace folder holding the demo notebooks
  excel_app_url: string;       // Excel Accelerator front-door app (four use cases + reset)

  // SAS migration (sas_migration) deployed pieces.
  sas_schema: string;
  sas_notebook_path: string;   // workspace path of the demo notebook
}

export async function fetchConfig(): Promise<HubConfig> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
  return res.json();
}

/** Build a deep link into the Databricks workspace from the configured host. */
export const dbx = {
  job: (host: string, id: string) => `${host.replace(/\/$/, '')}/jobs/${id}`,
  pipeline: (host: string, id: string) => `${host.replace(/\/$/, '')}/pipelines/${id}`,
  dashboard: (host: string, id: string) =>
    `${host.replace(/\/$/, '')}/dashboardsv3/${id}/published`,
  workspacePath: (host: string, path: string) =>
    `${host.replace(/\/$/, '')}/#workspace${path}`,
  table: (host: string, catalog: string, schema: string, table: string) =>
    `${host.replace(/\/$/, '')}/explore/data/${catalog}/${schema}/${table}`,
};
