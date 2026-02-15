// src/lib/storage.js
export const LS = {
  base: "sr_api_base",
  refresh: "sr_refresh_token",
  role: "sr_role",
  email: "sr_email",
};

export const SS = {
  access: "sr_access_token",
};

export function getBase() {
  return (localStorage.getItem(LS.base) || "http://127.0.0.1:8000").replace(
    /\/+$/,
    "",
  );
}
export function setBase(v) {
  localStorage.setItem(LS.base, (v || "").trim().replace(/\/+$/, ""));
}

export function getAccess() {
  return sessionStorage.getItem(SS.access) || "";
}
export function setAccess(v) {
  if (v) sessionStorage.setItem(SS.access, v);
  else sessionStorage.removeItem(SS.access);
}

export function getRefresh() {
  return localStorage.getItem(LS.refresh) || "";
}
export function setRefresh(v) {
  if (v) localStorage.setItem(LS.refresh, v);
  else localStorage.removeItem(LS.refresh);
}

export function setTokens({ access_token, refresh_token }) {
  if (access_token) setAccess(access_token);
  if (refresh_token) setRefresh(refresh_token);
}

export function clearTokens() {
  setAccess("");
  setRefresh("");
  localStorage.removeItem(LS.role);
  localStorage.removeItem(LS.email);
}

export function setUserEmail(email) {
  if (email) localStorage.setItem(LS.email, email);
}
export function getUserEmail() {
  return localStorage.getItem(LS.email) || "";
}
export function setRole(role) {
  if (role) localStorage.setItem(LS.role, role);
}
export function getRole() {
  return localStorage.getItem(LS.role) || "";
}
