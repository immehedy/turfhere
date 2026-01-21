"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function VenuesPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // ✅ initialize from URL (landing page sends these)
  const initialQ = sp.get("q") ?? "";
  const initialType = (sp.get("type") ?? "") as VenueTypeFilter;
  const initialDate = sp.get("date") ?? ""; // YYYY-MM-DD

  const [items, setItems] = useState<VenueListItem[]>([]);
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<VenueTypeFilter>(
    initialType === "TURF" || initialType === "EVENT_SPACE" ? initialType : ""
  );
  const [date, setDate] = useState(initialDate);

  const [loading, setLoading] = useState(true);

  // ✅ keep URL in sync when user changes filters (nice UX)
  function updateUrl(next: { q?: string; type?: VenueTypeFilter; date?: string }) {
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
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return items.filter((v) => {
      // type filter
      if (type && v.type !== type) return false;

      // text filter
      if (!s) return true;
      const hay = `${v.name} ${v.city ?? ""} ${v.area ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [items, q, type]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await clientFetch<{ venues: VenueListItem[] }>("/api/venues");
      if (res.ok) setItems(res.data.venues);
      setLoading(false);
    })();
  }, []);

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
              placeholder="Search by name / city / area…"
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
              title="(MVP) Date is passed from search. Availability filtering can be added later."
            />
          </div>
        </div>

        {/* Optional: show active filter summary */}
        {(q.trim() || type || date) && (
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
      </div>

      {loading ? (
        <p className="mt-4 text-gray-600">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-gray-600">No venues found.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v._id}
              href={`/v/${v.slug}${date ? `?date=${encodeURIComponent(date)}` : ""}`}
              className="border rounded-lg overflow-hidden hover:shadow-sm transition"
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
