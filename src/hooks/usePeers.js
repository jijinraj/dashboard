import { useCallback, useState } from "react";
import { api } from "../lib/api";

export function usePeers() {
  const [peers, setPeers] = useState([]);

  const loadPeers = useCallback(async () => {
    const p = await api("/vpn/me/peers");
    setPeers(p.items || []);
  }, []);

  const deletePeer = useCallback(
    async (peerId) => {
      await api(`/vpn/me/peers/${peerId}`, { method: "DELETE" });
      await loadPeers();
    },
    [loadPeers],
  );

  return { peers, loadPeers, deletePeer };
}
