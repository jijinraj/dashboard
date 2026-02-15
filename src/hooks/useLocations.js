import { useCallback, useState } from "react";
import { api } from "../lib/api";

export function useLocations() {
  const [locations, setLocations] = useState([]);

  const loadLocations = useCallback(async () => {
    const data = await api("/vpn/locations", { auth: false });
    const items = data.items || [];
    setLocations(items);
    return items;
  }, []);

  const loadServerInfo = useCallback(async (locationId) => {
    if (!locationId) return null;
    return api(
      `/vpn/server-info?location_id=${encodeURIComponent(locationId)}`,
      {
        auth: false,
      },
    );
  }, []);

  return { locations, loadLocations, loadServerInfo };
}
