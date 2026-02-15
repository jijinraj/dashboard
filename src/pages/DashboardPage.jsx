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
import Card from "../components/ui/Card";

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

  // ✅ beta approval gate
  const [betaBlocked, setBetaBlocked] = useState(false);

  function isBetaApprovalError(e) {
    // const msg = String(e?.message || "").toLowerCase();
    // return (
    //   msg.includes("not approved for beta") ||
    //   msg.includes("not approved") ||
    //   msg.includes("beta")
    // );
    return (
      e?.status === 403 &&
      String(e?.message || "")
        .toLowerCase()
        .includes("beta")
    );
  }

  function logout() {
    clearToken();
    nav("/login");
  }

  async function boot() {
    setErr("");
    setBetaBlocked(false);

    try {
      await loadPeers(); // may 403 if not beta approved
      const locs = await loadLocations();
      if (!selectedLocation && locs.length) setSelectedLocation(locs[0].id);
      await refreshLatencies(locs);
    } catch (e) {
      if (isBetaApprovalError(e)) {
        setBetaBlocked(true);
        return;
      }
      throw e;
    }
  }

  useEffect(() => {
    boot().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (betaBlocked) return;
    if (!selectedLocation) return;

    loadServerInfo(selectedLocation)
      .then(setServerInfo)
      .catch((e) => {
        if (isBetaApprovalError(e)) {
          setBetaBlocked(true);
          return;
        }
        setErr(e.message);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, betaBlocked]);

  useEffect(() => {
    if (betaBlocked) return;
    if (!locations.length) return;

    const id = setInterval(() => refreshLatencies(locations), 30000);
    return () => clearInterval(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, betaBlocked]);

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
      if (isBetaApprovalError(e)) {
        setBetaBlocked(true);
        return;
      }
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
      if (isBetaApprovalError(e)) {
        setBetaBlocked(true);
        return;
      }
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRefreshPeers() {
    setErr("");
    setLoading(true);
    try {
      await loadPeers();
    } catch (e) {
      if (isBetaApprovalError(e)) {
        setBetaBlocked(true);
        return;
      }
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
            {!betaBlocked && (
              <button
                type="button"
                onClick={onRefreshPeers}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05] disabled:opacity-60"
              >
                Refresh
              </button>
            )}

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
        {betaBlocked ? (
          <div className="mx-auto max-w-xl">
            <Card>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Waiting for beta approval
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                You are logged in, but your account is still pending beta
                approval. Once an admin approves you, you’ll be able to create
                and manage VPN configs here.
              </p>

              {err && (
                <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-sm text-white">
                  {err}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => boot().catch((e) => setErr(e.message))}
                  className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05]"
                >
                  Check again
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Logout
                </button>
              </div>
            </Card>
          </div>
        ) : (
          <>
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

            <PeersTable
              peers={peers}
              loading={loading}
              onDelete={onDeletePeer}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
