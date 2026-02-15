import { api } from "./api";

// auth
export const adminLogin = (email, password) =>
  api("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

// users
export const adminListUsers = () => api("/admin/users");
export const adminApproveUserByEmail = (email) =>
  api(`/admin/users/${encodeURIComponent(email)}/approve`, { method: "POST" });

export const adminPatchUser = (userId, patch) =>
  api(`/admin/users/${userId}`, { method: "PATCH", body: patch });

export const adminDeleteUser = (userId) =>
  api(`/admin/users/${userId}`, { method: "DELETE" });

export const adminUserPeers = (userId) => api(`/admin/users/${userId}/peers`);
export const adminForceDeletePeer = (peerId) =>
  api(`/admin/peers/${peerId}`, { method: "DELETE" });

// servers
export const adminListServers = () => api("/admin/vpn/servers");
export const adminCreateServer = (payload) =>
  api("/admin/vpn/servers", { method: "POST", body: payload });

export const adminPatchServer = (serverId, patch) =>
  api(`/admin/vpn/servers/${serverId}`, { method: "PATCH", body: patch });

export const adminDeleteServer = (serverId) =>
  api(`/admin/vpn/servers/${serverId}`, { method: "DELETE" });
