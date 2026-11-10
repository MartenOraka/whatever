import { API_URL } from './config';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Small typed fetch wrapper. credentials:'include' sends the httpOnly JWT cookie.
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data.details) ? data.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ') : '';
    throw new ApiError(res.status, details || data.error || 'Something went wrong');
  }
  return data as T;
}

export const imageUrl = (path: string | null) => (path ? API_URL + path : null);

// Multipart upload (avatar). No Content-Type header: the browser sets the boundary itself.
export async function upload<T = unknown>(path: string, field: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append(field, file);
  const res = await fetch(API_URL + path, { method: 'PUT', credentials: 'include', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'Upload failed');
  return data as T;
}
