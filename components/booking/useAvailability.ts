"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clientFetch } from "@/lib/clientFetch";
import type { AvailabilityRes } from "./bookingTypes";

export function useAvailability(venueId: string, date: string) {
  const [data, setData] = useState<AvailabilityRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const slots = useMemo(() => data?.slots ?? [], [data]);

  const load = useCallback(async () => {
    setMsg(null);
    setLoading(true);

    const res = await clientFetch<AvailabilityRes>(
      `/api/venues/id/${venueId}/availability?date=${encodeURIComponent(date)}`
    );

    setLoading(false);

    if (!res.ok) {
      setData(null);
      setMsg(`Failed to load availability. (${res.status})`);
      return { ok: false as const, error: res.error };
    }

    setData(res.data);
    return { ok: true as const, data: res.data };
  }, [venueId, date]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, slots, loading, msg, setMsg, reload: load };
}
