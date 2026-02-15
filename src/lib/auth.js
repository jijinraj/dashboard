import {
  getAccess,
  getRefresh,
  clearTokens,
  setTokens,
  setUserEmail,
} from "./storage";

export function setTokenPair({ access_token, refresh_token, email }) {
  setTokens({ access_token, refresh_token });
  if (email) setUserEmail(email);
}

// Used by <PrivateRoute />
export function getToken() {
  // allow either access OR refresh (since refresh can auto-rotate access)
  return getAccess() || getRefresh();
}

export function clearToken() {
  clearTokens();
}
