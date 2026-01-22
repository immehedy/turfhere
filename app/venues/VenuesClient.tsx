"use client";

import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Info, Search, ChevronLeft, ChevronRight } from "lucide-react";

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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function VenuesClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // init from URL
  const initialQ = sp.get("q") ?? "";
  const initialTypeRaw = sp.get("type") ?? "";
  const initialType: VenueTypeFilter =
    initialTypeRaw === "TURF" || initialTypeRaw === "EVENT_SPACE"
      ? (initialTypeRaw as VenueTypeFilter)
      : "";
  const initialDate = sp.get("date") ?? "";
  const initialPage = Number(sp.get("page") ?? "1");
  const initialPageSafe = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;

  const [items, setItems] = useState<VenueListItem[]>([]);
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<VenueTypeFilter>(initialType);
  const [date, setDate] = useState(initialDate);
  const [page, setPage] = useState<number>(initialPageSafe);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const dq = useDebouncedValue(q, 300);

  const updateUrl = (next: {
    q?: string;
    type?: VenueTypeFilter;
    date?: string;
    page?: number;
  }) => {
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

    if (next.page !== undefined) {
      if (next.page > 1) params.set("page", String(next.page));
      else params.delete("page");
    }

    const qs = params.toString();
    router.replace(qs ? `/venues?${qs}` : "/venues");
  };

  // query to API (server-side filtering)
  const apiQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (dq.trim()) params.set("q", dq.trim());
    return params.toString();
  }, [type, dq]);

  const reqIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const myReqId = ++reqIdRef.current;
      setLoading(true);
      setMsg(null);

      const url = apiQuery ? `/api/venues?${apiQuery}` : "/api/venues";
      const res = await clientFetch<{ venues: VenueListItem[] }>(url);

      if (cancelled || myReqId !== reqIdRef.current) return;

      if (!res.ok) {
        setItems([]);
        setMsg(typeof res.error === "string" ? res.error : "Failed to load venues");
        setLoading(false);
        return;
      }

      setItems(res.data.venues);
      setLoading(false);

      // If filters changed, go back to page 1 (more natural UX)
      setPage(1);
      updateUrl({ page: 1 });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiQuery]);

  const hasFilters = q.trim() || type || date;

  // ---------- Pagination (client-side) ----------
  const pageSize = 12;

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / pageSize));
  }, [items.length]);

  const currentPage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
      updateUrl({ page: currentPage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage]);

  const resultCountText = useMemo(() => {
    if (loading) return "Loading…";
    if (items.length === 0) return "0 results";
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(items.length, currentPage * pageSize);
    return `${start}–${end} of ${items.length}`;
  }, [loading, items.length, currentPage]);

  const goToPage = (p: number) => {
    const next = clamp(p, 1, totalPages);
    setPage(next);
    updateUrl({ page: next });

    // Optional: jump user back to list top on mobile
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ---------- UI helpers ----------
  const typeLabel = (t: VenueTypeFilter) => {
    if (t === "TURF") return "Turf";
    if (t === "EVENT_SPACE") return "Event Space";
    return "All types";
  };

  const pill = "inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs text-gray-700";

  return (
    <div className="space-y-4">
      {/* Sticky header + filters */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          {/* Title row */}
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Venues</h1>

              {/* Info icon */}
              <div className="relative group">
                <button
                  type="button"
                  aria-label="Info"
                  className="inline-flex items-center justify-center rounded-full border bg-white h-8 w-8 hover:bg-gray-50"
                >
                  <Info className="h-4 w-4 text-gray-700" />
                </button>

                {/* Tooltip */}
                <div
                  className="
                    pointer-events-none
                    absolute left-1/2 -translate-x-1/2 mt-2
                    w-[280px]
                    rounded-xl border bg-white shadow-lg
                    p-3 text-xs text-gray-700
                    opacity-0 group-hover:opacity-100
                    transition
                  "
                >
                  Date is currently preserved and passed to venue details (MVP).
                  Availability filtering can be added later.
                </div>
              </div>

              {/* Result count */}
              <span className="text-sm text-gray-600">{resultCountText}</span>
            </div>

            <Link
              href="/register"
              className="rounded-lg bg-black text-white px-3 py-2 text-sm hover:opacity-90"
            >
              Register venue
            </Link>
          </div>

          {/* Filters */}
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-[220px_1fr_180px_auto] items-stretch">
            {/* Type */}
            <div className="min-w-0">
              <label className="sr-only">Type</label>
              <select
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white"
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value as VenueTypeFilter;
                  setType(nextType);
                  setPage(1);
                  updateUrl({ type: nextType, page: 1 });
                }}
              >
                <option value="">All types</option>
                <option value="TURF">Turf</option>
                <option value="EVENT_SPACE">Event space</option>
              </select>
            </div>

            {/* Search input with icon */}
            <div className="min-w-0">
              <label className="sr-only">Search</label>
              <div className="flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-white">
                <Search className="h-4 w-4 text-gray-500 shrink-0" />
                <input
                  className="w-full outline-none text-sm"
                  placeholder="Search by name / city / area…"
                  value={q}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQ(v);
                    setPage(1);
                    updateUrl({ q: v, page: 1 });
                  }}
                />
              </div>
            </div>

            {/* Date */}
            <div className="min-w-0">
              <label className="sr-only">Date</label>
              <input
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white"
                type="date"
                value={date}
                onChange={(e) => {
                  const v = e.target.value;
                  setDate(v);
                  setPage(1);
                  updateUrl({ date: v, page: 1 });
                }}
              />
            </div>

            {/* Clear */}
            <div className="min-w-0">
              <button
                type="button"
                className="w-full rounded-xl border px-3 py-2.5 text-sm hover:bg-gray-50"
                onClick={() => {
                  setQ("");
                  setType("");
                  setDate("");
                  setPage(1);
                  router.replace("/venues");
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Active:</span>
              {type && <span className={pill}>Type: {typeLabel(type)}</span>}
              {q.trim() && <span className={pill}>Query: {q.trim()}</span>}
              {date && <span className={pill}>Date: {date}</span>}
            </div>
          )}

          {msg && <p className="text-sm text-red-600">{msg}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="py-8 text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-gray-600">No venues found.</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pagedItems.map((v) => (
                <Link
                  key={v._id}
                  href={`/v/${v.slug}${date ? `?date=${encodeURIComponent(date)}` : ""}`}
                  className="group border rounded-2xl overflow-hidden bg-white hover:shadow-md transition"
                >
                  <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnailUrl}
                        alt={v.name}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold line-clamp-1">{v.name}</h2>
                      <span className="text-xs rounded-full border px-2 py-1 text-gray-700 bg-gray-50">
                        {v.type === "TURF" ? "Turf" : "Event"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {[v.area, v.city].filter(Boolean).join(", ") || "Location not set"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">View details</span>
                      <span className="text-sm text-gray-500 group-hover:translate-x-0.5 transition">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                {/* Page buttons (compact) */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages })
                    .slice(0, 7) // keep it simple; you can expand to windowed paging later
                    .map((_, idx) => {
                      const p = idx + 1;
                      const active = p === currentPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => goToPage(p)}
                          className={`h-9 w-9 rounded-xl border text-sm hover:bg-gray-50 ${
                            active ? "bg-black text-white border-black hover:bg-black" : "bg-white"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  {totalPages > 7 && (
                    <span className="px-2 text-gray-500 text-sm">…</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
