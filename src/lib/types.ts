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
  id?: string;               // Optional since backend might not return it
  version: number;           // numeric version
  label?: string;            // "v4" if backend gives it
  changelog?: string;
  created_at: string;
  diff?: any;                // Diff from previous version (flexible type for now)
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

// Phase 6: Watched APIs
export interface WatchedAPI {
  id: string;
  tenant_id: string;
  provider_id: string;
  api_product_id: string;
  provider_name?: string;  // NEW
  product_name?: string;   // NEW
  api_spec_id?: string;
  spec_url: string;
  polling_frequency: 'hourly' | 'daily' | 'weekly';
  polling_enabled: boolean;
  last_polled_at: string | null;
  last_successful_poll_at: string | null;
  last_version_detected: string | null;
  last_error: string | null;
  consecutive_failures: number;
  status: string;
  created_at: string;
}

// Phase 6: Alert Configuration
export interface AlertConfig {
  id: string;
  tenant_id: string;
  watched_api_id: string;
  alert_type: 'email' | 'webhook' | 'slack';
  destination: string;
  alert_on_breaking_changes: boolean;
  alert_on_non_breaking_changes: boolean;
  alert_on_endpoint_failures: boolean;
  alert_on_endpoint_recovery: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string | null;
}

// Phase 6: Alert History
export interface AlertHistory {
  id: string;
  tenant_id: string;
  watched_api_id: string;
  alert_config_id: string;
  provider_name?: string;
  product_name?: string;
  alert_reason: string;
  severity: 'info' | 'warning' | 'critical';
  endpoint_path?: string;
  http_method?: string;
  payload?: any;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at: string | null;
  created_at: string;
}

// Phase 6: Endpoint Health
// Endpoint Health
export interface EndpointHealth {
  id: string;
  watched_api_id: string;
  endpoint_path: string;
  http_method: string;
  status_code?: number;
  response_time_ms?: number;
  is_healthy: boolean;
  error_message?: string;
  checked_at: string;
}

export interface EndpointHealthSummary {
  endpoint_path: string;
  http_method: string;
  total_checks: number;
  healthy_checks: number;
  uptime_percentage: number;
  avg_response_time_ms?: number;
  last_check: string;
  is_currently_healthy: boolean;
}

export interface WatchedAPIHealthSummary {
  watched_api_id: string;
  provider_name?: string;
  product_name?: string;
  total_endpoints: number;
  healthy_endpoints: number;
  avg_response_time_ms?: number;
  uptime_percentage: number;
  last_checked: string;
}

export interface VersionDiff {
  version_id: number;
  version: number;
  diff: any;
  summary?: string;
  created_at: string;
}