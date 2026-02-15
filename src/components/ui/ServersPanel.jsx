import React, { useEffect, useMemo, useState } from "react";
import {
  adminCreateServer,
  adminDeleteServer,
  adminListServers,
  adminPatchServer,
} from "../../lib/adminApi";

export default function ServersPanel() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    location_id: "",
    label: "",
    server_public_key: "",
    endpoint: "",
    dns: "1.1.1.1",
    allowed_ips: "0.0.0.0/0, ::/0",
    ping_url: "",
    is_active: true,
  });

  async function refresh() {
    setErr("");
    setLoading(true);
    try {
      const res = await adminListServers();
      setItems(res.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load servers");
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
    return items.filter((x) =>
      [x.location_id, x.label, x.endpoint, x.ping_url].some((v) =>
        (v || "").toLowerCase().includes(s),
      ),
    );
  }, [items, q]);

  async function createServer(e) {
    e.preventDefault();
    setErr("");
    try {
      await adminCreateServer({
        ...form,
        ping_url: form.ping_url.trim() ? form.ping_url.trim() : null,
      });
      setForm({
        location_id: "",
        label: "",
        server_public_key: "",
        endpoint: "",
        dns: "1.1.1.1",
        allowed_ips: "0.0.0.0/0, ::/0",
        ping_url: "",
        is_active: true,
      });
      await refresh();
    } catch (e2) {
      setErr(e2.message || "Create failed");
    }
  }

  async function toggleActive(s) {
    setErr("");
    try {
      await adminPatchServer(s.id, { is_active: !s.is_active });
      await refresh();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function saveOnBlur(s, field, value) {
    const prev = s[field] || "";
    const next = value || "";
    if (next === prev) return;
    setErr("");
    try {
      const patch = {};
      patch[field] = next;
      await adminPatchServer(s.id, patch);
      await refresh();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function remove(s) {
    if (!confirm(`Delete server "${s.label}" (${s.location_id})?`)) return;
    setErr("");
    try {
      await adminDeleteServer(s.id);
      await refresh();
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="md:col-span-2 rounded-2xl border border-neutral-900 bg-neutral-900/40 p-4">
        <h2 className="text-lg font-semibold">Add VPN Server</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Creates a DB-backed VPN server record.
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-900 bg-red-950/40 p-3 text-red-200 text-sm whitespace-pre-wrap">
            {err}
          </div>
        )}

        <form onSubmit={createServer} className="mt-4 space-y-3">
          {[
            ["location_id", "Location ID (e.g. uk-lon-1)"],
            ["label", "Label (e.g. London)"],
            ["server_public_key", "Server public key"],
            ["endpoint", "Endpoint (host:port)"],
            ["dns", "DNS"],
            ["allowed_ips", "Allowed IPs"],
            ["ping_url", "Ping URL (optional)"],
          ].map(([k, ph]) => (
            <input
              key={k}
              className="w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 outline-none text-sm"
              placeholder={ph}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          ))}

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            Active
          </label>

          <button className="w-full rounded-lg bg-white text-black font-semibold py-3">
            Create Server
          </button>
        </form>
      </div>

      <div className="md:col-span-3 rounded-2xl border border-neutral-900 bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Servers</h2>
            <p className="text-sm text-neutral-400">
              {loading ? "Loading..." : `${filtered.length} server(s)`}
            </p>
          </div>
          <button
            onClick={refresh}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Refresh
          </button>
        </div>

        <input
          className="mt-3 w-full rounded-lg bg-neutral-950 border border-neutral-800 p-3 outline-none text-sm"
          placeholder="Search servers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="mt-4 space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">
                    {s.label}{" "}
                    <span className="text-neutral-500 font-normal">
                      ({s.location_id})
                    </span>
                  </div>
                  <div className="text-sm text-neutral-400 mt-1">
                    {s.endpoint} • DNS: {s.dns} • Active: {String(s.is_active)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(s)}
                    className="rounded-lg border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                  >
                    {s.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => remove(s)}
                    className="rounded-lg border border-red-900 px-3 py-2 text-sm hover:bg-red-950/30 text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  className="rounded-lg bg-neutral-950 border border-neutral-800 p-2 text-sm outline-none"
                  defaultValue={s.endpoint || ""}
                  onBlur={(e) => saveOnBlur(s, "endpoint", e.target.value)}
                />
                <input
                  className="rounded-lg bg-neutral-950 border border-neutral-800 p-2 text-sm outline-none"
                  defaultValue={s.ping_url || ""}
                  placeholder="ping_url"
                  onBlur={(e) => saveOnBlur(s, "ping_url", e.target.value)}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-neutral-500">No servers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
