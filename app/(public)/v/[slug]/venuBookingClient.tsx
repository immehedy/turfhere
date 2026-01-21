"use client";

import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type AvailabilityRes = {
  date: string;
  slotDurationMinutes: number;
  slots: { startISO: string; endISO: string }[];
};

type Img = { url: string; isThumb?: boolean };

function uniqUrls(urls: string[]) {
  return Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)));
}

export default function VenueBookingClient({
  venueId,
  slotDurationMinutes,
  thumbnailUrl,
  images,
  venueName,
}: {
  venueId: string;
  slotDurationMinutes: number;

  // ✅ new
  thumbnailUrl?: string;
  images?: string[];
  venueName?: string;
}) {
  const { status } = useSession();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AvailabilityRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const canBook = status === "authenticated";
  const slots = useMemo(() => data?.slots ?? [], [data]);

  // ✅ build gallery: thumbnail first + rest
  const gallery: Img[] = useMemo(() => {
    const all = uniqUrls([thumbnailUrl ?? "", ...(images ?? [])]);
    return all.map((url) => ({ url, isThumb: url === (thumbnailUrl ?? "") }));
  }, [thumbnailUrl, images]);

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
    setMsg("Booking requested. Status: PENDING (Owner will confirm).");
    await load(); // refresh availability (PENDING blocks slot)
  }

  return (
    <div className="space-y-4">
      {/* ✅ Images section */}
      {gallery.length > 0 && (
        <div className="space-y-2">
          {thumbnailUrl ? (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={thumbnailUrl}
                alt={venueName ? `${venueName} thumbnail` : "thumbnail"}
                className="w-full max-h-[320px] object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          {gallery.length > 1 && (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {gallery
                .filter((g) => !g.isThumb) // keep thumb only in hero
                .slice(0, 8) // small MVP limit for UI
                .map((g) => (
                  <a
                    key={g.url}
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border rounded-lg overflow-hidden hover:bg-gray-50"
                    title="Open image"
                  >
                    <img
                      src={g.url}
                      alt="venue image"
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                  </a>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
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

      {/* Slots */}
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
                {new Date(s.startISO).toLocaleString()} →{" "}
                {new Date(s.endISO).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}

      {!canBook && (
        <p className="text-sm text-gray-600">
          Sign in to request booking. Your request will be <b>confirmed by Owner</b>.
        </p>
      )}
    </div>
  );
}
