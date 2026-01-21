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
  ownerNote?: string;
  adminNote?: string; // superuser note (optional)
};

type VenueMini = { id: string; name: string; slug: string };

export default function OwnerBookingsPage() {
  const [venues, setVenues] = useState<VenueMini[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // optional note input per booking
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await clientFetch<{ venues: VenueMini[]; bookings: OwnerBooking[] }>(
      "/api/owner/bookings"
    );

    if (res.ok) {
      setVenues(res.data.venues);
      setBookings(res.data.bookings);

      // prefill notes map (don’t overwrite user edits if already typed)
      setNoteById((prev) => {
        const next = { ...prev };
        for (const b of res.data.bookings) {
          if (next[b._id] === undefined) next[b._id] = b.ownerNote ?? "";
        }
        return next;
      });
    } else {
      setMsg("Failed to load bookings.");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function finalize(id: string, status: "CONFIRMED" | "REJECTED") {
    setMsg(null);

    const ownerNote = noteById[id]?.trim();
    const body: any = { status };
    if (ownerNote) body.ownerNote = ownerNote;

    const res = await clientFetch<{ ok: true; status: string }>(
      `/api/owner/bookings/${id}/decision`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      setMsg(typeof res.error === "string" ? res.error : "Failed to update booking");
      return;
    }

    setMsg(`Booking updated: ${status}`);
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
        You can <b>confirm</b> or <b>reject</b> booking requests. Admin is a superuser (override).
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

                    <div className="text-xs text-gray-500">
                      Booking ID: <span className="font-mono">{b._id}</span>
                    </div>
                  </div>

                  <div className="text-xs border rounded px-2 py-1">{b.status}</div>
                </div>

                <div className="mt-3">
                  <label className="text-sm">Owner note (optional)</label>
                  <input
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={noteById[b._id] ?? ""}
                    onChange={(e) =>
                      setNoteById((prev) => ({ ...prev, [b._id]: e.target.value }))
                    }
                    placeholder="e.g. call before arriving / payment info"
                    disabled={b.status !== "PENDING"}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                    onClick={() => finalize(b._id, "CONFIRMED")}
                    disabled={b.status !== "PENDING"}
                    title={b.status !== "PENDING" ? "Only PENDING requests can be updated" : ""}
                  >
                    Confirm booking
                  </button>

                  <button
                    className="rounded border px-3 py-1 hover:bg-gray-50"
                    onClick={() => finalize(b._id, "REJECTED")}
                    disabled={b.status !== "PENDING"}
                    title={b.status !== "PENDING" ? "Only PENDING requests can be updated" : ""}
                  >
                    Reject booking
                  </button>
                </div>

                {b.adminNote && (
                  <p className="text-sm text-gray-700 mt-2">
                    Admin note: {b.adminNote}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
