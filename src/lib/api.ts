const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!;

async function getClerkToken(): Promise<string> {
  // Clerk stores tokens in the window object
  if (typeof window !== 'undefined' && (window as any).Clerk) {
    try {
      const token = await (window as any).Clerk.session?.getToken();
      console.log('✅ Got Clerk token:', !!token, token?.substring(0, 20)); // DEBUG
      return token || '';
    } catch (e) {
      console.error('❌ Failed to get Clerk token:', e);
      return '';
    }
  }
  console.warn('⚠️ Clerk not available on window'); // DEBUG
  return '';
}

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getClerkToken();
  
  console.log('📡 Making API call:', path, 'with token:', !!token); // DEBUG
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Only log as error if it's truly unexpected (not 404)
    if (res.status >= 500) {
      console.error(`GET ${path} failed`, res.status, text);
    } else {
      console.warn(`GET ${path} returned ${res.status}`, text);
    }
    throw new Error(`API GET ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const token = await getClerkToken();
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      ...(body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) }),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`POST ${path} failed`, res.status, text);
    
    // NEW: Try to parse error detail from response
    let errorMessage = `API POST ${path} failed: ${res.status}`;
    try {
      const errorData = JSON.parse(text);
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If JSON parsing fails, keep the default message
    }
    
    throw new Error(errorMessage);
  }

  return res.json().catch(() => ({} as T));
}

// === Domain-specific helpers ===

import type {
  ApiSpec,
  SpecVersion,
  WatchedAPI,
  AlertConfig,
  AlertHistory,
  EndpointHealth,
  EndpointHealthSummary,
  WatchedAPIHealthSummary,
  VersionDiff, // ADD THIS
} from "./types";
// Add these to your existing src/lib/api.ts file

// Provider Types
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

// Provider API Functions
export async function getProviders(): Promise<Provider[]> {
  return apiGet<Provider[]>('/providers');
}

export async function getProvider(providerId: string): Promise<Provider> {
  return apiGet<Provider>(`/providers/${providerId}`);
}

export async function createProvider(data: ProviderCreate): Promise<Provider> {
  return apiPost<Provider>('/providers', data);
}

export async function updateProvider(
  providerId: string,
  data: ProviderUpdate
): Promise<Provider> {
  return apiPut<Provider>(`/providers/${providerId}`, data);
}

export async function deleteProvider(providerId: string): Promise<void> {
  return apiDelete(`/providers/${providerId}`);
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
async function apiPut<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const token = await getClerkToken();
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    body: JSON.stringify(body ?? {}),
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`PUT ${path} failed`, res.status, text);
    
    // NEW: Try to parse error detail from response
    let errorMessage = `API PUT ${path} failed: ${res.status}`;
    try {
      const errorData = JSON.parse(text);
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If JSON parsing fails, keep the default message
    }
    
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

async function apiPatch<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const token = await getClerkToken();  // ADD THIS LINE
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
    headers: { 
      'Authorization': token ? `Bearer ${token}` : '',  // ADD THIS LINE
      "Content-Type": "application/json", 
      ...(init?.headers ?? {}) 
    },
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
  const token = await getClerkToken();
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: { 
      'Authorization': token ? `Bearer ${token}` : '',
      ...(init?.headers ?? {}) 
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`DELETE ${path} failed`, res.status, text);
    
    // Try to parse error detail from response
    let errorDetail = `API DELETE ${path} failed: ${res.status}`;
    if (text) {
      try {
        const errorData = JSON.parse(text);
        if (errorData.detail) {
          // Handle structured error from backend
          if (typeof errorData.detail === 'object' && errorData.detail.message) {
            errorDetail = errorData.detail.message;
          } else if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail;
          }
        }
      } catch {
        // If not JSON, use the text as-is (or keep default)
        if (text.length < 200) {
          errorDetail = text;
        }
      }
    }
    
    throw new Error(errorDetail);
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

// === Documentation Viewer ===

export function getAvailableDocFormats(
  specId: string,
  versionId: number
): Promise<{
  spec_id: string;
  version: number;
  available_formats: {
    markdown: boolean;
    html: boolean;
  };
  total_artifacts: number;
}> {
  return apiGet(`/docs/${specId}/versions/${versionId}/available`);
}

export function getVersionDocumentation(
  specId: string,
  versionId: number,
  format: 'html' | 'markdown' = 'html'
): Promise<{
  spec_id: string;
  spec_name: string;
  version: number;
  format: string;
  content: string;
  s3_path: string;
  generated_at: string;
}> {
  return apiGet(`/docs/${specId}/versions/${versionId}?format=${format}`);
}

export function getLatestDocumentation(
  specId: string,
  format: 'html' | 'markdown' = 'html'
): Promise<{
  spec_id: string;
  spec_name: string;
  version: number;
  format: string;
  content: string;
  s3_path: string;
  generated_at: string;
}> {
  return apiGet(`/docs/${specId}/latest?format=${format}`);
}

// API Product Types & Functions
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

export async function getApiProducts(providerId?: string): Promise<ApiProduct[]> {
  const query = providerId ? `?provider_id=${providerId}` : '';
  return apiGet<ApiProduct[]>(`/api-products${query}`);
}

export async function getApiProduct(productId: string): Promise<ApiProduct> {
  return apiGet<ApiProduct>(`/api-products/${productId}`);
}

export async function createApiProduct(data: ApiProductCreate): Promise<ApiProduct> {
  return apiPost<ApiProduct>('/api-products', data);
}

export async function updateApiProduct(
  productId: string,
  data: ApiProductUpdate
): Promise<ApiProduct> {
  return apiPut<ApiProduct>(`/api-products/${productId}`, data);
}

export async function deleteApiProduct(productId: string): Promise<void> {
  return apiDelete(`/api-products/${productId}`);
}

// API Spec Upload
export async function uploadApiSpec(
  productId: string,
  file: File,
  name?: string,
  version?: string
): Promise<any> {
  const token = await getClerkToken();

  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (version) formData.append('version', version);

  // Send api_product_id as query parameter
  const queryParams = new URLSearchParams({
    api_product_id: productId
  });

  const res = await fetch(`${API_BASE_URL}/api-specs/upload?${queryParams}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let errorMessage = `Failed to upload spec (${res.status})`;
    try {
      const errorData = JSON.parse(text);
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((err: any) => {
              const location = err.loc?.slice(1).join('.') || 'Field';
              return `${location}: ${err.msg}`;
            })
            .join('; ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
    } catch {
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  return res.json();
}