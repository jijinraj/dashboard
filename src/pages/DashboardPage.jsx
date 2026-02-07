import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { clearToken } from "../lib/auth";
import {
  generateWgKeypair,
  buildWgConfig,
  downloadTextFile,
} from "../lib/wireguard";
import { useNavigate } from "react-router-dom";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const nav = useNavigate();

  const [peers, setPeers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [serverInfo, setServerInfo] = useState(null);

  const [name, setName] = useState("My Device");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const selectedLocationLabel = useMemo(() => {
    const l = locations.find((x) => x.id === selectedLocation);
    return l?.label || "—";
  }, [locations, selectedLocation]);

  async function loadPeers() {
    const p = await api("/me/peers");
    setPeers(p.items || []);
  }

  async function loadLocations() {
    const data = await api("/wg/locations");
    const items = data.items || [];
    setLocations(items);
    if (!selectedLocation && items.length) setSelectedLocation(items[0].id);
  }

  async function loadServerInfo(locationId) {
    if (!locationId) return;
    const s = await api(
      `/wg/server-info?location_id=${encodeURIComponent(locationId)}`,
    );
    setServerInfo(s);
  }

  async function boot() {
    setErr("");
    await Promise.all([loadPeers(), loadLocations()]);
  }

  useEffect(() => {
    boot().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadServerInfo(selectedLocation).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  async function createPeer() {
    if (!serverInfo || !selectedLocation) return;
    setLoading(true);
    setErr("");

    try {
      // 1) Generate keys in browser
      const { privateKey, publicKey } = generateWgKeypair();

      // 2) Create peer in backend (PUBLIC KEY + location)
      const created = await api("/me/peers", {
        method: "POST",
        body: {
          name,
          public_key: publicKey,
          location_id: selectedLocation,
        },
      });

      // 3) Build config locally
      const conf = buildWgConfig({
        clientPrivateKey: privateKey,
        clientAddress: created.allowed_ip,
        dns: serverInfo.dns,
        serverPublicKey: serverInfo.server_public_key,
        endpoint: serverInfo.endpoint,
        allowedIps: serverInfo.allowed_ips,
      });

      const safeName = created.name.replace(/[^\w-]+/g, "-").toLowerCase();
      downloadTextFile(
        `spartarocket-${safeName}-${selectedLocation}.conf`,
        conf,
      );

      // 4) Refresh list
      await loadPeers();
      setName("My Device");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePeer(peerId) {
    setLoading(true);
    setErr("");
    try {
      await api(`/me/peers/${peerId}`, { method: "DELETE" });
      await loadPeers();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-9 w-9 rounded-full border border-white/15 bg-white/[0.04] overflow-hidden"
            >
              <img
                src="https://static.vecteezy.com/system/resources/thumbnails/046/449/142/small/plaster-statue-of-davids-head-isolated-ancient-greek-hero-sculpture-png.png"
                alt=""
              />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">
                SpartaRocket 🚀
              </div>
              <div className="text-xs text-white/60">Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPeers().catch((e) => setErr(e.message))}
              className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        {err && (
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-sm text-white">
            {err}
          </div>
        )}

        {/* Locations + What you can do */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              VPN locations
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
              Pick the closest region for the best latency — or choose another
              country when you need it.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold">Available regions</h3>
                <Badge>{locations.length} live</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {locations.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-sm font-semibold">{l.label}</p>
                    <p className="mt-1 text-xs text-white/60">
                      Location ID: <span className="font-mono">{l.id}</span>
                    </p>
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="text-sm text-white/60">
                    No locations loaded.
                  </div>
                )}
              </div>

              <p className="mt-5 text-xs text-white/55">
                You’ll choose the location per config below.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <h3 className="text-base font-semibold">What you can do</h3>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70"
                  />
                  Create a new config (download .conf)
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70"
                  />
                  Revoke a config (delete peer)
                </li>
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70"
                  />
                  Choose VPN region per device
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-white/70">
                  Private keys are generated on your device when you create a
                  config. The server never stores your private key.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Create */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Create a new config
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Create a peer on the selected location, then download the
                config.
              </p>
            </div>
            <Badge>Selected: {selectedLocationLabel}</Badge>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-white/90">
                Device name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/30"
                placeholder="e.g., iPhone, Laptop, Work PC"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-white/90">
                VPN location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/30"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-white/55">
                Closest location = best latency.
              </p>
            </div>

            <div className="lg:col-span-3 flex items-end">
              <button
                type="button"
                onClick={createPeer}
                disabled={loading || !serverInfo || !selectedLocation}
                className="w-full inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black"
              >
                {loading ? "Working..." : "Create & Download"}
              </button>
            </div>
          </div>
        </section>

        {/* List */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Your configs
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Delete revokes the config by removing the peer from the VPN
                server.
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
                        onClick={() => deletePeer(p.id)}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black"
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
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} SpartaRocket
          </p>
        </div>
      </footer>
    </div>
  );
}
