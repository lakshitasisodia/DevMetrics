import { API_BASE_URL } from "./config.js";
import { getToken, clearSession } from "./session.js";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Perform a request against the DevMetrics backend.
 * - Automatically attaches the Bearer token when present.
 * - Parses JSON responses and throws ApiError with the backend's
 *   `error` message on non-2xx responses, matching the shape every
 *   route in this API returns: { error: "..." }.
 * - On 401, clears the local session so the next protected-page load
 *   redirects to login instead of looping on stale credentials.
 */
export async function apiRequest(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkError) {
    throw new ApiError(
      "Can't reach the DevMetrics backend. Check that it's running and that VITE_API_BASE_URL is correct.",
      0,
      networkError
    );
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession();
    }
    const message =
      (data && data.error) || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiRequest(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => apiRequest(path, { ...opts, method: "DELETE" }),
};
