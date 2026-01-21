"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { clientFetch } from "@/lib/clientFetch";

type OwnerVenue = {
  _id: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  city?: string;
  area?: string;
  thumbnailUrl?: string;
  status?: "ACTIVE" | "SUSPENDED";
};

export default function OwnerHomePage() {
  const { data, status } = useSession();
  const role = (data as any)?.role as string | undefined;

  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMsg(null);

      const res = await clientFetch<{ venues: OwnerVenue[] }>("/api/owner/venues");
      if (res.ok) {
        setVenues(res.data.venues);
      } else {
        setMsg(typeof res.error === "string" ? res.error : "Failed to load venues");
      }

      setLoading(false);
    })();
  }, [status]);

  return (
    <PageShell>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Owner dashboard</h1>
          <p className="text-gray-600 mt-1">
            Create venues, manage your venue details, and confirm/reject booking requests.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner/venues/new">
            Create venue
          </Link>
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner/bookings">
            Booking requests
          </Link>
          {role === "ADMIN" && (
            <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/admin">
              Admin dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold">Your venues</h2>
        <p className="text-sm text-gray-600 mt-1">
          Edit venue details and open the public page.
        </p>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

        {loading ? (
          <p className="mt-4 text-gray-600">Loading…</p>
        ) : venues.length === 0 ? (
          <div className="mt-4 border rounded-lg p-4">
            <p className="text-gray-700">You haven’t created any venues yet.</p>
            <Link className="inline-block mt-3 rounded border px-4 py-2 hover:bg-gray-50" href="/owner/venues/new">
              Create your first venue
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <div key={v._id} className="border rounded-lg overflow-hidden">
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
                    <div className="font-semibold line-clamp-1">{v.name}</div>
                    <span className="text-xs border rounded px-2 py-1">{v.type}</span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                    {[v.area, v.city].filter(Boolean).join(", ")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      className="rounded border px-3 py-1 hover:bg-gray-50 text-sm"
                      href={`/owner/venues/${v._id}/edit`}
                    >
                      Edit
                    </Link>

                    <Link
                      className="rounded border px-3 py-1 hover:bg-gray-50 text-sm"
                      href={`/v/${v.slug}`}
                      target="_blank"
                    >
                      View public
                    </Link>
                  </div>

                  {v.status && (
                    <p className="mt-2 text-xs text-gray-500">
                      Status: <span className="font-medium">{v.status}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
