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

export function getSpecVersions(specId: string): Promise<SpecVersion[]> {
  return apiGet<SpecVersion[]>(`/api-specs/${specId}/versions`);
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
