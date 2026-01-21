"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type VenueListItem = {
  _id: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  city?: string;
  area?: string;
  thumbnailUrl: string;
};

type VenueTypeFilter = "" | "TURF" | "EVENT_SPACE";

/** small debounce hook */
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function VenuesPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // initialize from URL
  const initialQ = sp.get("q") ?? "";
  const initialTypeRaw = sp.get("type") ?? "";
  const initialType: VenueTypeFilter =
    initialTypeRaw === "TURF" || initialTypeRaw === "EVENT_SPACE" ? (initialTypeRaw as VenueTypeFilter) : "";
  const initialDate = sp.get("date") ?? "";

  const [items, setItems] = useState<VenueListItem[]>([]);
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<VenueTypeFilter>(initialType);
  const [date, setDate] = useState(initialDate);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // debounce search text so we don't spam the API
  const dq = useDebouncedValue(q, 300);

  // keep URL in sync
  const updateUrl = (next: { q?: string; type?: VenueTypeFilter; date?: string }) => {
    const params = new URLSearchParams(sp.toString());

    if (next.q !== undefined) {
      const v = next.q.trim();
      if (v) params.set("q", v);
      else params.delete("q");
    }

    if (next.type !== undefined) {
      if (next.type) params.set("type", next.type);
      else params.delete("type");
    }

    if (next.date !== undefined) {
      if (next.date) params.set("date", next.date);
      else params.delete("date");
    }

    const qs = params.toString();
    router.replace(qs ? `/venues?${qs}` : "/venues");
  };

  // Build API query string from current filters
  const apiQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (dq.trim()) params.set("q", dq.trim());
    // date is MVP only; we pass it to preserve in URL, not used by API yet
    // If later you add availability filtering server-side, pass it:
    // if (date) params.set("date", date);
    return params.toString();
  }, [type, dq /* date */]);

  // Prevent stale responses from racing
  const reqIdRef = useRef(0);

  // Fetch whenever filters change (server-side filtering)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const myReqId = ++reqIdRef.current;
      setLoading(true);
      setMsg(null);

      const url = apiQuery ? `/api/venues?${apiQuery}` : "/api/venues";
      const res = await clientFetch<{ venues: VenueListItem[] }>(url);

      // ignore if newer request already started
      if (cancelled || myReqId !== reqIdRef.current) return;

      if (!res.ok) {
        setItems([]);
        setMsg(typeof res.error === "string" ? res.error : "Failed to load venues");
        setLoading(false);
        return;
      }

      setItems(res.data.venues);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [apiQuery]);

  const hasFilters = q.trim() || type || date;

  return (
    <PageShell>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Venues</h1>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-3xl">
            <select
              className="border rounded px-3 py-2 sm:w-48"
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as VenueTypeFilter;
                setType(nextType);
                updateUrl({ type: nextType });
              }}
            >
              <option value="">All types</option>
              <option value="TURF">Turf</option>
              <option value="EVENT_SPACE">Event space</option>
            </select>

            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Search by name / city / area / description…"
              value={q}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                updateUrl({ q: v });
              }}
            />

            <input
              className="border rounded px-3 py-2 sm:w-44"
              type="date"
              value={date}
              onChange={(e) => {
                const v = e.target.value;
                setDate(v);
                updateUrl({ date: v });
              }}
              title="(MVP) Date is preserved from search. Availability filtering can be added later."
            />
          </div>
        </div>

        {hasFilters && (
          <div className="text-sm text-gray-600 flex flex-wrap gap-2 items-center">
            <span className="font-medium">Filters:</span>
            {type && <span className="border rounded px-2 py-1 text-xs">Type: {type}</span>}
            {q.trim() && <span className="border rounded px-2 py-1 text-xs">Query: {q.trim()}</span>}
            {date && <span className="border rounded px-2 py-1 text-xs">Date: {date}</span>}

            <button
              className="text-xs underline ml-1"
              onClick={() => {
                setQ("");
                setType("");
                setDate("");
                router.replace("/venues");
              }}
            >
              Clear
            </button>
          </div>
        )}

        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </div>

      {loading ? (
        <p className="mt-4 text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-gray-600">No venues found.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <Link
              key={v._id}
              href={`/v/${v.slug}${date ? `?date=${encodeURIComponent(date)}` : ""}`}
              className="border rounded-lg overflow-hidden hover:shadow-sm transition bg-white"
            >
              <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                {v.thumbnailUrl ? (
                  <img
                    src={v.thumbnailUrl}
                    alt={v.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold line-clamp-1">{v.name}</h2>
                  <span className="text-xs border rounded px-2 py-1">{v.type}</span>
                </div>

                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {[v.area, v.city].filter(Boolean).join(", ")}
                </p>

                <p className="text-sm text-gray-700 mt-3">View details →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
