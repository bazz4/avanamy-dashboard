export interface Provider {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProduct {
  id: string;
  provider_id: string;
  name: string;
  slug: string;
}

export interface ApiSpec {
  id: string;
  api_product_id: string;
  name: string;
  slug: string;
  current_version_label?: string; // e.g. "v4"
  description?: string;
}

export interface SpecVersion {
  id: string;
  version: number;           // numeric v
  label?: string;            // "v4" if backend gives it
  changelog?: string;
  created_at: string;
  diff?: DiffInfo | null;    // Diff from previous version
  summary?: string | null;   // AI-generated summary
}

export interface DiffInfo {
  breaking: boolean;
  changes: DiffChange[];
}

export interface DiffChange {
  type: string;              // e.g. "endpoint_removed", "required_request_field_added"
  path: string;              // e.g. "/users"
  method?: string;           // e.g. "GET", "POST"
  field?: string;            // e.g. "name", "phone"
}

export interface SpecDocs {
  html_url: string;
  markdown_url?: string;
}

export interface ApiError {
  detail?: string;
}
