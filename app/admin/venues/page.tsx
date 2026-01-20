"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useState } from "react";

type Venue = {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
};

export default function AdminVenuesPage() {
  const [items, setItems] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await clientFetch<{ venues: Venue[] }>("/api/admin/venues");
      if (res.ok) setItems(res.data.venues);
      setLoading(false);
    })();
  }, []);

  return (
    <PageShell>
      <h1 className="text-xl font-semibold">Venues (Admin)</h1>

      {loading ? (
        <p className="mt-4 text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-gray-600">No venues.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <div key={v._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{v.name}</div>
                <span className="text-xs border rounded px-2 py-1">{v.status}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Owner: <span className="font-mono">{v.ownerId}</span>
              </p>
              <div className="mt-3 flex gap-2">
                <Link className="rounded border px-3 py-1 hover:bg-gray-50" href={`/v/${v.slug}`}>
                  Open page
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
