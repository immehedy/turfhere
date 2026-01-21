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

function normalizePhone(raw: string) {
  // Very MVP-friendly normalization:
  // - remove spaces/dashes
  // - keep leading +
  const v = raw.trim().replace(/[^\d+]/g, "");
  return v;
}

function isValidPhone(raw: string) {
  // Simple validation:
  // - allow +8801XXXXXXXXX, 01XXXXXXXXX, or international 8-15 digits
  const v = normalizePhone(raw);
  if (!v) return false;

  // Bangladesh common formats
  if (/^(\+?8801)\d{9}$/.test(v)) return true;
  if (/^01\d{9}$/.test(v)) return true;

  // generic international
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
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
  thumbnailUrl?: string;
  images?: string[];
  venueName?: string;
}) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AvailabilityRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const slots = useMemo(() => data?.slots ?? [], [data]);

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

    // If not signed in, require guest details
    if (!isAuthed) {
      if (!guestName.trim()) {
        setMsg("Please enter your name.");
        return;
      }
      if (!isValidPhone(guestPhone)) {
        setMsg("Please enter a valid phone number.");
        return;
      }
    }

    const payload = {
      venueId,
      startISO,
      endISO,
      note: note || undefined,

      // ✅ guest info only if not authed
      guestName: isAuthed ? undefined : guestName.trim(),
      guestPhone: isAuthed ? undefined : normalizePhone(guestPhone),
    };

    const res = await clientFetch<{ id: string; status: string }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setMsg(typeof res.error === "string" ? res.error : "Booking request failed");
      return;
    }

    setNote("");
    if (!isAuthed) {
      // keep name/phone for convenience, or clear if you prefer
      // setGuestName(""); setGuestPhone("");
    }

    setMsg("Booking requested. Status: PENDING (Owner will confirm).");
    await load(); // refresh availability
  }

  return (
    <div className="space-y-4">
      {/* Images */}
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
                .filter((g) => !g.isThumb)
                .slice(0, 8)
                .map((g) => (
                  <a
                    key={g.url}
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border rounded-lg overflow-hidden hover:bg-gray-50"
                    title="Open image"
                  >
                    <img src={g.url} alt="venue image" className="w-full h-24 object-cover" loading="lazy" />
                  </a>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Guest fields (only when not signed in) */}
      {!isAuthed && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold">Book as guest</h3>
          <p className="text-sm text-gray-600 mt-1">
            No account needed. Please provide your name and phone so the owner can contact you.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Your name</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Mehedy Hassan"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm">Phone number</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2 bg-white"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. 01XXXXXXXXX or +8801XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="text-xs text-gray-500 mt-1">
                We’ll store this only for booking communication.
              </p>
            </div>
          </div>
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
            placeholder="e.g. team name / details"
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
                {new Date(s.startISO).toLocaleString()} → {new Date(s.endISO).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}

      {isAuthed ? (
        <p className="text-sm text-gray-600">
          You’re signed in. Your request will be <b>confirmed by Owner</b>.
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          Booking requests are reviewed by the <b>Owner</b>. You can also sign in anytime for faster management.
        </p>
      )}
    </div>
  );
}
