import React, { useEffect, useState } from "react";
import { adminForceDeletePeer, adminUserPeers } from "../../lib/adminApi";

export default function UserPeersModal({ user, onClose }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await adminUserPeers(user.id);
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load peers");
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  async function removePeer(peerId) {
    if (!confirm("Force delete this peer?")) return;
    setErr("");
    try {
      await adminForceDeletePeer(peerId);
      await load();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Peers for {user.email}</div>
            <div className="text-sm text-neutral-400">
              {items.length} peer(s)
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Close
          </button>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-900 bg-red-950/40 p-3 text-red-200 text-sm whitespace-pre-wrap">
            {err}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-sm text-neutral-400 truncate">
                  {p.allowed_ip} • {p.location_label} ({p.location_id})
                </div>
                <div className="text-xs text-neutral-500 truncate">
                  pubkey: {p.public_key}
                </div>
              </div>
              <button
                onClick={() => removePeer(p.id)}
                className="rounded-lg border border-red-900 px-3 py-2 text-sm hover:bg-red-950/30 text-red-200"
              >
                Delete
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-neutral-500">No peers.</div>
          )}
        </div>
      </div>
    </div>
  );
}
