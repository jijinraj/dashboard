import React, { useEffect, useMemo, useState } from "react";
import {
  adminApproveUserByEmail,
  adminDeleteUser,
  adminListUsers,
  adminPatchUser,
} from "../../lib/adminApi";
import UserPeersModal from "./UserPeersModal";

export default function UsersPanel() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [peersUser, setPeersUser] = useState(null);

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const res = await adminListUsers();
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) => (u.email || "").toLowerCase().includes(s));
  }, [items, q]);

  async function approve(email) {
    setErr("");
    try {
      await adminApproveUserByEmail(email);
      await refresh();
    } catch (e) {
      setErr(e.message || "Approve failed");
    }
  }

  async function toggleBeta(u) {
    setErr("");
    try {
      await adminPatchUser(u.id, { is_beta_approved: !u.is_beta_approved });
      await refresh();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function toggleRole(u) {
    const next = u.role === "admin" ? "user" : "admin";
    if (!confirm(`Change role for ${u.email} to ${next}?`)) return;
    setErr("");
    try {
      await adminPatchUser(u.id, { role: next });
      await refresh();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function remove(u) {
    if (!confirm(`Delete user ${u.email}?`)) return;
    setErr("");
    try {
      await adminDeleteUser(u.id);
      await refresh();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-neutral-400">
            {loading ? "Loading..." : `${filtered.length} user(s)`}
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
        >
          Refresh
        </button>
      </div>

      {err && (
        <div className="mt-3 rounded-xl border border-red-900 bg-red-950/40 p-3 text-red-200 text-sm whitespace-pre-wrap">
          {err}
        </div>
      )}

      <input
        className="mt-3 w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 outline-none text-sm"
        placeholder="Search by email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="mt-4 space-y-3">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{u.email}</div>
                <div className="text-sm text-neutral-400 mt-1">
                  role: <span className="text-neutral-200">{u.role}</span> •
                  beta:{" "}
                  <span className="text-neutral-200">
                    {String(u.is_beta_approved)}
                  </span>{" "}
                  • verified:{" "}
                  <span className="text-neutral-200">
                    {String(u.is_email_verified)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                {!u.is_beta_approved && (
                  <button
                    onClick={() => approve(u.email)}
                    className="rounded-lg bg-white text-black px-3 py-2 text-sm font-semibold"
                  >
                    Approve Beta
                  </button>
                )}
                <button
                  onClick={() => toggleBeta(u)}
                  className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                >
                  Toggle Beta
                </button>
                <button
                  onClick={() => setPeersUser(u)}
                  className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                >
                  View Peers
                </button>
                <button
                  onClick={() => toggleRole(u)}
                  className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                >
                  Toggle Role
                </button>
                <button
                  onClick={() => remove(u)}
                  className="rounded-lg border border-red-900 px-3 py-2 text-sm hover:bg-red-950/30 text-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-neutral-500">No users found.</div>
        )}
      </div>

      {peersUser && (
        <UserPeersModal user={peersUser} onClose={() => setPeersUser(null)} />
      )}
    </div>
  );
}
