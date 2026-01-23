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

const Icon = {
  Plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Inbox: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h16v10l-3 3h-4l-2 2-2-2H7l-3-3V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M4 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ArrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 12a8 8 0 1 1-2.34-5.66"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function OwnerHomePage() {
  const { data, status } = useSession();
  const role = (data as any)?.role as string | undefined;

  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadVenues() {
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
  }

  useEffect(() => {
    loadVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <PageShell>
      {/* ✅ Redesigned header + CTA row (cards below unchanged) */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Owner dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Create venues, manage details, and confirm/reject booking requests.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-medium text-white shadow-sm hover:bg-black/90"
              href="/owner/venues/new"
            >
              {Icon.Plus}
              Create venue
            </Link>

            <Link
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              href="/owner/bookings"
            >
              {Icon.Inbox}
              Booking requests
            </Link>

            {role === "ADMIN" && (
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                href="/admin"
              >
                {Icon.Shield}
                Admin
              </Link>
            )}

            <button
              type="button"
              onClick={loadVenues}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
              disabled={loading}
              title="Refresh"
            >
              {Icon.Refresh}
              Refresh
            </button>
          </div>
        </div>

        {/* ✅ message bar */}
        {msg ? (
          <div className="px-5 pb-5 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {msg}
            </div>
          </div>
        ) : null}
      </div>

      {/* ✅ Section header (light polish, no card changes) */}
      <div className="mt-6 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your venues</h2>
          <p className="text-sm text-gray-600 mt-1">Edit venue details and open the public page.</p>
        </div>
      </div>

      {/* ✅ Loading / empty states polished (cards untouched) */}
      {loading ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Loading…
        </div>
      ) : venues.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-900 font-medium">You haven’t created any venues yet.</p>
          <p className="text-sm text-gray-600 mt-1">
            Create your first venue and start accepting bookings.
          </p>

          <div className="mt-4">
            <Link
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-medium text-white shadow-sm hover:bg-black/90"
              href="/owner/venues/new"
            >
              {Icon.Plus}
              Create your first venue
              <span className="ml-1">{Icon.ArrowRight}</span>
            </Link>
          </div>
        </div>
      ) : (
        // ✅ VENUE CARDS: unchanged from your original code
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
    </PageShell>
  );
}
