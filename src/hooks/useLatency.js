import { useCallback, useState } from "react";

export function useLatency() {
  const [latency, setLatency] = useState({});
  const [latencyLoading, setLatencyLoading] = useState(false);

  const measureLatencyMs = useCallback(async (url) => {
    const pingUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const t0 = performance.now();
    const res = await fetch(pingUrl, { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error(`Ping HTTP ${res.status}`);
    const t1 = performance.now();
    return Math.round(t1 - t0);
  }, []);

  const refreshLatencies = useCallback(
    async (locations) => {
      if (!locations?.length) return;
      setLatencyLoading(true);

      try {
        const results = await Promise.all(
          locations.map(async (l) => {
            if (!l.ping_url) return [l.id, null];
            try {
              const ms = await measureLatencyMs(l.ping_url);
              return [l.id, ms];
            } catch {
              return [l.id, null];
            }
          }),
        );

        setLatency(Object.fromEntries(results));
      } finally {
        setLatencyLoading(false);
      }
    },
    [measureLatencyMs],
  );

  return { latency, latencyLoading, refreshLatencies };
}
