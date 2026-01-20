"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useState } from "react";

type AdminBooking = {
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

export default function AdminBookingsPage() {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    const res = await clientFetch<{ bookings: AdminBooking[] }>("/api/admin/bookings");
    if (res.ok) setItems(res.data.bookings);
    else setMsg("Failed to load admin bookings");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED") {
    setMsg(null);
    const res = await clientFetch<{ ok: true; status: string }>(`/api/admin/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setMsg(typeof res.error === "string" ? res.error : "Failed to update status");
      return;
    }
    setMsg(`Updated: ${status}`);
    await load();
  }

  return (
    <PageShell>
      <h1 className="text-xl font-semibold">Admin booking requests</h1>
      <p className="text-sm text-gray-600 mt-2">
        Admin has final approval. Owner decision is only a recommendation.
      </p>

      {msg && <p className="mt-3 text-sm">{msg}</p>}

      {loading ? (
        <p className="mt-4 text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-gray-600">No booking requests.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((b) => (
            <div key={b._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    VenueId: <span className="font-mono">{b.venueId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    UserId: <span className="font-mono">{b.userId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs border rounded px-2 py-1">{b.status}</span>
              </div>

              <div className="mt-3 text-sm">
                Owner recommendation: <b>{b.ownerDecision ?? "N/A"}</b>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                  onClick={() => setStatus(b._id, "CONFIRMED")}
                  disabled={b.status !== "PENDING"}
                >
                  Confirm
                </button>
                <button
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                  onClick={() => setStatus(b._id, "REJECTED")}
                  disabled={b.status !== "PENDING"}
                >
                  Reject
                </button>
                <button
                  className="rounded border px-3 py-1 hover:bg-gray-50"
                  onClick={() => setStatus(b._id, "CANCELLED")}
                  disabled={b.status === "CANCELLED"}
                >
                  Cancel
                </button>
              </div>

              {b.adminNote && <p className="text-sm text-gray-700 mt-2">Admin note: {b.adminNote}</p>}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
