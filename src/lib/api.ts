const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!;

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // include credentials / headers if needed later
    headers: {
      "X-Tenant-ID": TENANT_ID,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`GET ${path} failed`, res.status, text);
    throw new Error(`API GET ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    headers:
      body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`POST ${path} failed`, res.status, text);
    throw new Error(`API POST ${path} failed: ${res.status}`);
  }

  return res.json().catch(() => ({} as T));
}

// === Domain-specific helpers ===

import type {
  Provider,
  ApiProduct,
  ApiSpec,
  SpecVersion,
  SpecDocs,
  WatchedAPI,
  AlertConfig,
  AlertHistory,
  EndpointHealth,
  EndpointHealthSummary,
  WatchedAPIHealthSummary,
  VersionDiff, // ADD THIS
} from "./types";

export function getProviders(): Promise<Provider[]> {
  return apiGet<Provider[]>("/providers");
}

export function getProductsForProvider(
  providerId: string,
): Promise<ApiProduct[]> {
  return apiGet<ApiProduct[]>(`/providers/${providerId}/products`);
}

export function getSpecsForProduct(productId: string): Promise<ApiSpec[]> {
  return apiGet<ApiSpec[]>(`/products/${productId}/specs`);
}


export async function getSpecDocs(specId: string) {
  // Fetch plain text markdown
  const markdownRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/docs/docs/${specId}/markdown`, {
    headers: {
      "X-Tenant-ID": TENANT_ID, // or your default tenant
    },
  });

  const markdown = markdownRes.ok ? await markdownRes.text() : null;

  // Fetch plain HTML
  const htmlRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/docs/docs/${specId}/html`, {
    headers: {
      "X-Tenant-ID": TENANT_ID,
    },
  });

  const html = htmlRes.ok ? await htmlRes.text() : null;

  return { markdown, html };
}


export function regenerateDocs(specId: string): Promise<unknown> {
  return apiPost(`/api-specs/${specId}/regenerate-docs`);
}

export function uploadNewSpecVersion(
  specId: string,
  file: File,
  changelog?: string,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  if (changelog) formData.append("changelog", changelog);

  return apiPost(`/api-specs/${specId}/upload-new-version`, formData);
}

// === Phase 6: Watched APIs ===

async function apiPatch<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
    headers: { "Content-Type": "application/json", "X-Tenant-ID": TENANT_ID, ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`PATCH ${path} failed`, res.status, text);
    throw new Error(`API PATCH ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiDelete(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { "X-Tenant-ID": TENANT_ID, ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`DELETE ${path} failed`, res.status, text);
    throw new Error(`API DELETE ${path} failed: ${res.status}`);
  }
}

export function getWatchedAPIs(): Promise<WatchedAPI[]> {
  return apiGet<WatchedAPI[]>("/watched-apis");
}

export function getWatchedAPI(id: string): Promise<WatchedAPI> {
  return apiGet<WatchedAPI>(`/watched-apis/${id}`);
}

export function createWatchedAPI(data: {
  provider_id: string;
  api_product_id: string;
  spec_url: string;
  polling_frequency: string;
}): Promise<WatchedAPI> {
  return apiPost<WatchedAPI>("/watched-apis", data);
}

export function updateWatchedAPI(
  id: string,
  data: Partial<{
    polling_enabled: boolean;
    polling_frequency: string;
    status: string;
  }>
): Promise<WatchedAPI> {
  return apiPatch<WatchedAPI>(`/watched-apis/${id}`, data);
}

export function deleteWatchedAPI(id: string): Promise<void> {
  return apiDelete(`/watched-apis/${id}`);
}

export function triggerPoll(id: string): Promise<any> {
  return apiPost<any>(`/watched-apis/${id}/poll`);
}

// === Phase 6: Alert Configurations ===

export function getAlertConfigs(watchedApiId?: string): Promise<AlertConfig[]> {
  const query = watchedApiId ? `?watched_api_id=${watchedApiId}` : "";
  return apiGet<AlertConfig[]>(`/alert-configs${query}`);
}

export function getAlertConfig(id: string): Promise<AlertConfig> {
  return apiGet<AlertConfig>(`/alert-configs/${id}`);
}

export function createAlertConfig(data: {
  watched_api_id: string;
  alert_type: string;
  destination: string;
  alert_on_breaking_changes?: boolean;
  alert_on_non_breaking_changes?: boolean;
  alert_on_endpoint_failures?: boolean;
  alert_on_endpoint_recovery?: boolean;
  enabled?: boolean;
}): Promise<AlertConfig> {
  return apiPost<AlertConfig>("/alert-configs", data);
}

export function updateAlertConfig(
  id: string,
  data: Partial<{
    alert_on_breaking_changes: boolean;
    alert_on_non_breaking_changes: boolean;
    alert_on_endpoint_failures: boolean;
    alert_on_endpoint_recovery: boolean;
    enabled: boolean;
    destination: string;
  }>
): Promise<AlertConfig> {
  return apiPatch<AlertConfig>(`/alert-configs/${id}`, data);
}

export function deleteAlertConfig(id: string): Promise<void> {
  return apiDelete(`/alert-configs/${id}`);
}

export function testAlertConfig(id: string): Promise<{ status: string; message: string }> {
  return apiGet<{ status: string; message: string }>(`/alert-configs/${id}/test`);
}

// === Phase 6: Alert History ===

export function getAlertHistory(params?: {
  watched_api_id?: string;
  severity?: string;
  status?: string;
  limit?: number;
}): Promise<AlertHistory[]> {
  const queryParams = new URLSearchParams();
  if (params?.watched_api_id) queryParams.append('watched_api_id', params.watched_api_id);
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const queryString = queryParams.toString();
  return apiGet<AlertHistory[]>(`/alert-history${queryString ? `?${queryString}` : ''}`);
}

export function getAlertHistoryById(id: string): Promise<AlertHistory> {
  return apiGet<AlertHistory>(`/alert-history/${id}`);
}

// === Phase 6: Endpoint Health ===

export function getEndpointHealth(
  watchedApiId: string,
  limit?: number
): Promise<EndpointHealth[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiGet<EndpointHealth[]>(`/watched-apis/${watchedApiId}/health${query}`);
}

export function getEndpointHealthSummary(
  watchedApiId: string,
  hours?: number
): Promise<EndpointHealthSummary[]> {
  const query = hours ? `?hours=${hours}` : '';
  return apiGet<EndpointHealthSummary[]>(`/watched-apis/${watchedApiId}/health/summary${query}`);
}

export function getAllHealthSummary(hours?: number): Promise<WatchedAPIHealthSummary[]> {
  const query = hours ? `?hours=${hours}` : '';
  return apiGet<WatchedAPIHealthSummary[]>(`/health/summary${query}`);
}

// Spec Versions & Diffs
export function getSpecVersions(specId: string): Promise<SpecVersion[]> {
  return apiGet<SpecVersion[]>(`/api-specs/${specId}/versions`);
}

export function getVersionDetail(specId: string, versionId: number): Promise<SpecVersion> {
  return apiGet<SpecVersion>(`/api-specs/${specId}/versions/${versionId}`);
}

export function getVersionDiff(specId: string, versionId: number): Promise<VersionDiff> {
  return apiGet<VersionDiff>(`/api-specs/${specId}/versions/${versionId}/diff`);
}

export function getVersionSchema(specId: string, versionNumber: number): Promise<{ version: number; schema: any }> {
  return apiGet<{ version: number; schema: any }>(`/api-specs/${specId}/versions/${versionNumber}/schema`);
}

// === Full Schema Comparison ===

export function getOriginalSpec(specId: string, versionNumber: number): Promise<{
  version: number;
  spec: any;
  s3_path: string;
}> {
  return apiGet(`/api-specs/${specId}/versions/${versionNumber}/original-spec`);
}

export function compareVersions(
  specId: string,
  currentVersion: number,
  compareWithVersion: number
): Promise<{
  current_version: number;
  previous_version: number;
  current_spec: any;
  previous_spec: any;
}> {
  return apiGet(`/api-specs/${specId}/versions/${currentVersion}/compare?compare_with=${compareWithVersion}`);
}