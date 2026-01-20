"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type MyBooking = {
  _id: string;
  venueId: string;
  venueSlug: string;
  venueName: string;
  start: string;
  end: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  ownerDecision: "APPROVE" | "REJECT" | null;
  adminNote?: string;
};

export default function MyBookingsPage() {
  const { status } = useSession();
  const [items, setItems] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (status !== "authenticated") {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await clientFetch<{ bookings: MyBooking[] }>("/api/bookings/me");
      if (res.ok) setItems(res.data.bookings);
      setLoading(false);
    })();
  }, [status]);

  return (
    <PageShell>
      <h1 className="text-xl font-semibold">My bookings</h1>

      {status !== "authenticated" ? (
        <p className="mt-3 text-gray-700">
          Please <Link className="underline" href="/signin">sign in</Link> to see your bookings.
        </p>
      ) : loading ? (
        <p className="mt-3 text-gray-600">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-gray-600">No bookings yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((b) => (
            <div key={b._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <Link className="font-semibold hover:underline" href={`/v/${b.venueSlug}`}>
                  {b.venueName}
                </Link>
                <span className="text-xs border rounded px-2 py-1">{b.status}</span>
              </div>

              <p className="text-sm text-gray-600 mt-2">
                {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleString()}
              </p>

              <p className="text-sm text-gray-700 mt-2">
                Owner recommendation: <b>{b.ownerDecision ?? "N/A"}</b>
              </p>

              {b.adminNote && <p className="text-sm text-gray-700 mt-2">Admin note: {b.adminNote}</p>}

              {b.status === "PENDING" && (
                <p className="text-sm text-gray-600 mt-2">
                  Pending — admin will confirm or reject.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
