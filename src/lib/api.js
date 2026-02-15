// src/lib/api.js
import {
  getBase,
  getAccess,
  getRefresh,
  setTokens,
  clearTokens,
} from "./storage";

let refreshingPromise = null;

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise;

  const refresh_token = getRefresh();
  if (!refresh_token) throw new Error("No refresh_token stored");

  refreshingPromise = (async () => {
    const url = getBase() + "/auth/refresh";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");

    if (!res.ok) {
      clearTokens();
      throw new Error(body?.detail || "Refresh failed");
    }

    if (body?.access_token && body?.refresh_token) {
      setTokens(body); // rotation
      return body.access_token;
    }

    throw new Error("Refresh response missing tokens");
  })().finally(() => {
    refreshingPromise = null;
  });

  return refreshingPromise;
}

export async function apiFetch(
  path,
  { method = "GET", query, json, auth = "auto", retry = true } = {},
) {
  const base = getBase();
  const url = new URL(base + path);

  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v).length > 0) {
        url.searchParams.set(k, v);
      }
    }
  }

  const headers = {};
  if (json !== undefined) headers["Content-Type"] = "application/json";

  const token = getAccess();
  const useAuth = auth === "auto" ? !!token : !!auth;
  if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch (e) {
    throw new Error(`Network error: ${String(e)}`);
  }

  // auto-refresh once on 401
  if (res.status === 401 && retry && getRefresh()) {
    try {
      await refreshAccessToken();
      const headers2 = { ...headers };
      const newAccess = getAccess();
      if (newAccess) headers2["Authorization"] = `Bearer ${newAccess}`;

      res = await fetch(url.toString(), {
        method,
        headers: headers2,
        body: json !== undefined ? JSON.stringify(json) : undefined,
      });
    } catch {
      // refresh failed -> tokens cleared already
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  return { res, body };
}

/**
 * Your app-wide API helper:
 * - returns JSON body on success
 * - throws Error(body.detail || message) on failure
 */
export async function api(path, { method = "GET", body, auth = "auto" } = {}) {
  const { res, body: out } = await apiFetch(path, {
    method,
    json: body,
    auth,
  });

  if (!res.ok) {
    const msg =
      (out && typeof out === "object" && out.detail) ||
      (typeof out === "string" && out) ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return out;
}
