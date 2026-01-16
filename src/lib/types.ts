// Add these to your existing src/lib/types.ts file

export interface Provider {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
}

export interface ProviderCreate {
  name: string;
  slug: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

export interface ProviderUpdate {
  name?: string;
  slug?: string;
  website?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

export interface ApiProduct {
  id: string;
  tenant_id: string;
  provider_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  provider_name: string | null;     
  provider_slug: string | null;   
  latest_spec_id: string | null;
  latest_spec_version: string | null;
  latest_spec_uploaded_at: string | null;
  spec_count?: number;
  // Breaking changes info
  has_breaking_changes?: boolean;
  breaking_changes_count?: number;
}

export interface ProductSpecsSummary {
  product_id: string;
  product_name: string;
  product_slug: string;
  provider_id: string;
  provider_name: string | null;
  spec_count: number;
  specs: Array<{
    id: string;
    name: string;
    version: string;
    created_at: string;
  }>;
}

export interface ApiProductCreate {
  name: string;
  slug: string;
  provider_id: string;
  description?: string | null;
}

export interface ApiProductUpdate {
  name?: string;
  slug?: string;
  provider_id?: string;
  description?: string | null;
}

export interface ApiSpec {
  id: string;
  api_product_id: string;
  name: string;
  slug: string;
  current_version_label?: string; // e.g. "v4"
  description?: string;
}

// Enriched spec for list views with provider/product context
export interface ApiSpecEnriched {
  id: string;
  api_product_id: string;
  name: string;
  description?: string;
  provider_id: string;
  provider_name: string;
  provider_slug: string;
  product_name: string;
  product_slug: string;
  latest_version: number | null;
  latest_version_created_at: string | null;
  has_breaking_changes: boolean;
  total_versions: number;
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
  // Breaking changes info
  has_breaking_changes?: boolean;
  latest_version_id?: number;
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

// Code Repository Types
export interface CodeRepository {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  owner_team: string | null;
  owner_email: string | null;
  access_token_encrypted: string | null;
  scan_status: 'pending' | 'scanning' | 'success' | 'failed';
  last_scanned_at: string | null;
  last_scan_commit_sha: string | null;
  last_scan_error: string | null;
  total_files_scanned: number;
  total_endpoints_found: number;
  scan_interval_hours: number;
  next_scan_at: string | null;
  consecutive_scan_failures: number;
  created_at: string;
  updated_at: string;
}

export interface EndpointUsage {
  endpoint_path: string;
  http_method: string | null;
  file_path: string;
  line_number: number;
  code_context: string | null;
  confidence: number;
  detection_method: string;
}

export interface CodeRepositoryDetail extends CodeRepository {
  endpoint_usages: EndpointUsage[];
}

export interface CreateCodeRepositoryRequest {
  name: string;
  url: string;
  owner_team?: string;
  owner_email?: string;
  access_token_encrypted?: string;
  installation_id?: number;  
}

export interface UpdateCodeRepositoryRequest {
  name?: string;
  owner_team?: string;
  owner_email?: string;
}

// Impact Analysis Types
export interface AffectedUsage {
  file_path: string;
  line_number: number;
  code_context: string;
  confidence: number;
  repository_name: string;
  repository_url: string | null;
}

export interface AffectedRepository {
  repository_id: string;
  repository_name: string;
  repository_url: string | null;
  usages_count: number;
  usages: AffectedUsage[];
}

export interface BreakingChange {
  breaking_change_type: string;
  endpoint_path: string;
  http_method: string | null;
  severity: string;
  affected_repositories: AffectedRepository[];
}

export interface ImpactAnalysis {
  has_impact: boolean;
  total_breaking_changes: number;
  total_affected_repos: number;
  total_usages_affected: number;
  severity: string;
  analyzed_at: string;
  created_by_user_id: string | null;
  breaking_changes: BreakingChange[];
}