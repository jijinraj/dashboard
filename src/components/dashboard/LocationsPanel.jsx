import React from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function LocationsPanel({
  locations,
  latency,
  latencyLoading,
  onRefreshLatency,
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            VPN locations
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-base">
            Pick the closest region for the best latency — or choose another
            country when you need it.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshLatency}
          disabled={latencyLoading}
          className="inline-flex items-center justify-center rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.05] disabled:opacity-60"
        >
          {latencyLoading ? "Measuring..." : "Refresh latency"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((l) => (
          <div
            key={l.id}
            className="rounded-2xl border border-white/10 bg-black/30 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{l.label}</p>
                <p className="mt-1 text-xs text-white/60">
                  Location ID: <span className="font-mono">{l.id}</span>
                </p>
              </div>
              <Badge>
                {latency[l.id] == null ? "— ms" : `~${latency[l.id]} ms`}
              </Badge>
            </div>

            <p className="mt-3 text-xs text-white/55">
              You’ll choose the location per config below.
            </p>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-sm text-white/60">No locations loaded.</div>
        )}
      </div>
    </Card>
  );
}
