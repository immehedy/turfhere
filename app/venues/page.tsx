"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VenueListItem = {
  _id: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  city?: string;
  area?: string;
  thumbnailUrl: string;
};

export default function VenuesPage() {
  const [items, setItems] = useState<VenueListItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((v) =>
      `${v.name} ${v.city ?? ""} ${v.area ?? ""}`.toLowerCase().includes(s)
    );
  }, [items, q]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Venues</h1>
        <input
          className="border rounded px-3 py-2 w-full sm:max-w-sm"
          placeholder="Search by name / city / area…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
              href={`/v/${v.slug}`}
              className="border rounded-lg overflow-hidden hover:shadow-sm transition"
            >
              {/* Thumbnail */}
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

              {/* Card content */}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold line-clamp-1">{v.name}</h2>
                  <span className="text-xs border rounded px-2 py-1">
                    {v.type}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {[v.area, v.city].filter(Boolean).join(", ")}
                </p>

                <p className="text-sm text-gray-700 mt-3">
                  View details →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
