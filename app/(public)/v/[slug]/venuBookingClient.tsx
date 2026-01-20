"use client";

import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type AvailabilityRes = {
  date: string;
  slotDurationMinutes: number;
  slots: { startISO: string; endISO: string }[];
};

export default function VenueBookingClient({
  venueId,
  slotDurationMinutes,
}: {
  venueId: string;
  slotDurationMinutes: number;
}) {
  const { status } = useSession();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AvailabilityRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const canBook = status === "authenticated";

  const slots = useMemo(() => data?.slots ?? [], [data]);

  async function load() {
    setMsg(null);
    setLoading(true);
  
    const res = await clientFetch<AvailabilityRes>(
      `/api/venues/id/${venueId}/availability?date=${encodeURIComponent(date)}`
    );
  
    setLoading(false);
  
    if (!res.ok) {
      setData(null);
      setMsg(`Failed to load availability. (${res.status})`);
      return;
    }
  
    setData(res.data);
  }
  

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function requestBooking(startISO: string, endISO: string) {
    setMsg(null);
    if (!canBook) {
      setMsg("Please sign in to request booking.");
      return;
    }

    const res = await clientFetch<{ id: string; status: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ venueId, startISO, endISO, note }),
    });

    if (!res.ok) {
      setMsg(typeof res.error === "string" ? res.error : "Booking request failed");
      return;
    }

    setNote("");
    setMsg("Booking requested. Status: PENDING (Admin will confirm).");
    await load(); // refresh availability (PENDING blocks slot)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <label className="text-sm">Date</label>
          <input
            className="mt-1 border rounded px-3 py-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label className="text-sm">Note (optional)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. team name / phone / details"
          />
        </div>

        <div className="text-sm text-gray-600">
          Slot: <b>{slotDurationMinutes} min</b>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading slots…</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-600">No slots available for this date.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s) => (
            <button
              key={s.startISO}
              onClick={() => requestBooking(s.startISO, s.endISO)}
              className="border rounded px-3 py-2 text-left hover:bg-gray-50"
            >
              <div className="text-sm font-medium">Request</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(s.startISO).toLocaleString()} → {new Date(s.endISO).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}
      {!canBook && (
        <p className="text-sm text-gray-600">
          Sign in to request booking. Your request will be <b>confirmed by Admin</b>.
        </p>
      )}
    </div>
  );
}
