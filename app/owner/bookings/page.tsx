"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OwnerBooking = {
  _id: string;
  venueId: string;
  userId: string;
  start: string;
  end: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  ownerDecision: "APPROVE" | "REJECT" | null;
  ownerNote?: string;
  adminNote?: string;
};

type VenueMini = { id: string; name: string; slug: string };

export default function OwnerBookingsPage() {
  const [venues, setVenues] = useState<VenueMini[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  async function load() {
    setLoading(true);
    setMsg(null);
    const res = await clientFetch<{ venues: VenueMini[]; bookings: OwnerBooking[] }>("/api/owner/bookings");
    if (res.ok) {
      setVenues(res.data.venues);
      setBookings(res.data.bookings);
    } else {
      setMsg("Failed to load bookings.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, ownerDecision: "APPROVE" | "REJECT") {
    setMsg(null);
    const res = await clientFetch<{ ok: true }>(`/api/owner/bookings/${id}/decision`, {
      method: "PATCH",
      body: JSON.stringify({ ownerDecision }),
    });
    if (!res.ok) {
      setMsg(typeof res.error === "string" ? res.error : "Failed to update decision");
      return;
    }
    setMsg(`Owner recommendation saved: ${ownerDecision}. Admin will finalize.`);
    await load();
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Owner booking requests</h1>
        <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner/venues/new">
          Create venue
        </Link>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        You can recommend approve/reject. <b>Admin confirms</b> the final status.
      </p>

      {msg && <p className="mt-3 text-sm">{msg}</p>}

      {loading ? (
        <p className="mt-4 text-gray-600">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="mt-4 text-gray-600">No bookings yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {bookings.map((b) => {
            const v = venueMap.get(b.venueId);
            return (
              <div key={b._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {v ? (
                        <Link className="hover:underline" href={`/v/${v.slug}`}>
                          {v.name}
                        </Link>
                      ) : (
                        "Venue"
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-xs border rounded px-2 py-1">{b.status}</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-sm">
                    Current recommendation: <b>{b.ownerDecision ?? "N/A"}</b>
                  </span>

                  <button
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                    onClick={() => decide(b._id, "APPROVE")}
                    disabled={b.status !== "PENDING"}
                    title={b.status !== "PENDING" ? "Only for PENDING requests" : ""}
                  >
                    Recommend approve
                  </button>

                  <button
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                    onClick={() => decide(b._id, "REJECT")}
                    disabled={b.status !== "PENDING"}
                    title={b.status !== "PENDING" ? "Only for PENDING requests" : ""}
                  >
                    Recommend reject
                  </button>
                </div>

                {b.adminNote && <p className="text-sm text-gray-700 mt-2">Admin note: {b.adminNote}</p>}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
