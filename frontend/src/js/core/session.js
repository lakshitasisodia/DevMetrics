import { STORAGE_KEYS } from "./config.js";

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function getUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.token, token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/** Redirect to login and stop further script execution on this page. */
export function requireAuth() {
  if (!isAuthenticated()) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/index.html?next=${next}`);
    throw new Error("redirecting-to-login");
  }
}

/** Protected pages call this first; unauthenticated visitors never see a flash of content. */
export function redirectIfAuthenticated(destination = "/dashboard.html") {
  if (isAuthenticated()) {
    location.replace(destination);
  }
}
