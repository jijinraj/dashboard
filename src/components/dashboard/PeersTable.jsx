import React from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function PeersTable({ peers, loading, onDelete }) {
  return (
    <Card>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your configs
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Delete revokes the config by removing the peer from the VPN server.
          </p>
        </div>
        <Badge>{peers.length} total</Badge>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-white/60">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-3">Name</th>
              <th className="py-3 pr-3">Location</th>
              <th className="py-3 pr-3">VPN IP</th>
              <th className="py-3 pr-3">Public Key</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {peers.map((p) => (
              <tr key={p.id} className="border-b border-white/10">
                <td className="py-4 pr-3 font-medium">{p.name}</td>
                <td className="py-4 pr-3 text-white/80">
                  {p.location_label || p.location_id || "—"}
                </td>
                <td className="py-4 pr-3 text-white/80">{p.allowed_ip}</td>
                <td className="py-4 pr-3 font-mono text-xs text-white/70 max-w-[280px] truncate">
                  {p.public_key}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05] disabled:opacity-60"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {peers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-white/60">
                  No configs yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
