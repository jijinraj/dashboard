import React, { useMemo } from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

export default function CreateConfigPanel({
  name,
  setName,
  locations,
  selectedLocation,
  setSelectedLocation,
  loading,
  serverInfoReady,
  onCreate,
}) {
  const selectedLocationLabel = useMemo(() => {
    const l = locations.find((x) => x.id === selectedLocation);
    return l?.label || "—";
  }, [locations, selectedLocation]);

  return (
    <Card>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Create a new config
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Create a peer on the selected location, then download the config.
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
            className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white"
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
            className="mt-2 w-full rounded-md border border-white/15 bg-black px-3 py-2 text-sm text-white"
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
            onClick={onCreate}
            disabled={loading || !serverInfoReady || !selectedLocation}
            className="w-full inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Working..." : "Create & Download"}
          </button>
        </div>
      </div>
    </Card>
  );
}
