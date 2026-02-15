import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";
import {
  generateWgKeypair,
  buildWgConfig,
  downloadTextFile,
} from "../lib/wireguard";
import { api } from "../lib/api";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LocationsPanel from "../components/dashboard/LocationsPanel";
import CreateConfigPanel from "../components/dashboard/CreateConfigPanel";
import PeersTable from "../components/dashboard/PeersTable";

import { usePeers } from "../hooks/usePeers";
import { useLocations } from "../hooks/useLocations";
import { useLatency } from "../hooks/useLatency";

export default function DashboardPage() {
  const nav = useNavigate();

  const { peers, loadPeers, deletePeer } = usePeers();
  const { locations, loadLocations, loadServerInfo } = useLocations();
  const { latency, latencyLoading, refreshLatencies } = useLatency();

  const [selectedLocation, setSelectedLocation] = useState("");
  const [serverInfo, setServerInfo] = useState(null);

  const [name, setName] = useState("My Device");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function logout() {
    clearToken();
    nav("/login");
  }

  async function boot() {
    setErr("");
    await loadPeers();
    const locs = await loadLocations();
    if (!selectedLocation && locs.length) setSelectedLocation(locs[0].id);
    await refreshLatencies(locs);
  }

  useEffect(() => {
    boot().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    loadServerInfo(selectedLocation)
      .then(setServerInfo)
      .catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  useEffect(() => {
    if (!locations.length) return;
    const id = setInterval(() => refreshLatencies(locations), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  async function createPeer() {
    if (!serverInfo || !selectedLocation) return;
    setLoading(true);
    setErr("");

    try {
      const { privateKey, publicKey } = generateWgKeypair();

      const created = await api("/vpn/me/peers", {
        method: "POST",
        body: {
          name,
          public_key: publicKey,
          location_id: selectedLocation,
        },
      });

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

      await loadPeers();
      setName("My Device");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePeer(peerId) {
    setLoading(true);
    setErr("");
    try {
      await deletePeer(peerId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Header
        right={
          <>
            <button
              type="button"
              onClick={() => loadPeers().catch((e) => setErr(e.message))}
              className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        {err && (
          <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-sm text-white">
            {err}
          </div>
        )}

        <LocationsPanel
          locations={locations}
          latency={latency}
          latencyLoading={latencyLoading}
          onRefreshLatency={() => refreshLatencies(locations)}
        />

        <CreateConfigPanel
          name={name}
          setName={setName}
          locations={locations}
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          loading={loading}
          serverInfoReady={!!serverInfo}
          onCreate={createPeer}
        />

        <PeersTable peers={peers} loading={loading} onDelete={onDeletePeer} />
      </main>

      <Footer />
    </div>
  );
}
