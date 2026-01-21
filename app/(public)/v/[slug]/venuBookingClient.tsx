"use client";

import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

type AvailabilityRes = {
  date: string;
  slotDurationMinutes: number;
  slots: {
    startISO: string;
    endISO: string;
    status?: "AVAILABLE" | "PENDING" | "CONFIRMED" | "UNAVAILABLE";
    isAvailable?: boolean;
    bookingId?: string;
  }[];
};

type Img = { url: string; isThumb?: boolean };

function uniqUrls(urls: string[]) {
  return Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)));
}

function normalizePhone(raw: string) {
  return raw.trim().replace(/[^\d+]/g, "");
}

function isValidPhone(raw: string) {
  const v = normalizePhone(raw);
  if (!v) return false;
  if (/^(\+?8801)\d{9}$/.test(v)) return true;
  if (/^01\d{9}$/.test(v)) return true;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  // Friendly time-only range
  const startStr = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startStr} – ${endStr}`;
}

function formatFull(startISO: string, endISO: string) {
  return `${new Date(startISO).toLocaleString()} → ${new Date(
    endISO
  ).toLocaleString()}`;
}

function slotAvailability(s: AvailabilityRes["slots"][number]) {
  if (typeof s.isAvailable === "boolean") {
    return s.isAvailable ? "AVAILABLE" : "UNAVAILABLE";
  }
  return s.status ?? "AVAILABLE";
}

function badgeForStatus(status: string) {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Available",
        cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    case "PENDING":
      return {
        label: "Pending",
        cls: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        cls: "bg-rose-50 text-rose-700 ring-rose-200",
      };
    case "UNAVAILABLE":
    default:
      return {
        label: "Unavailable",
        cls: "bg-gray-50 text-gray-700 ring-gray-200",
      };
  }
}

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
};

function toastTone(type: Toast["type"]) {
  switch (type) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "info":
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function splitDescription(desc: string) {
  const lines = desc.split("\n").map(l => l.trim()).filter(Boolean);
  const looksLikeList = lines.some(l => /^[-•]/.test(l));
  return { lines, looksLikeList };
}


export default function VenueBookingClient({
  venueId,
  slotDurationMinutes,
  thumbnailUrl,
  images,
  venueName,
  description,
}: {
  venueId: string;
  slotDurationMinutes: number;
  thumbnailUrl?: string;
  images?: string[];
  venueName?: string;
  description?: string;
}) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AvailabilityRes | null>(null);
  const [loading, setLoading] = useState(false);

  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [descExpanded, setDescExpanded] = useState(false);


  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // ✅ Interactive slot selection
  const [selectedStartISO, setSelectedStartISO] = useState<string | null>(null);
  const selectedSlot = useMemo(() => {
    if (!selectedStartISO) return null;
    return (
      (data?.slots ?? []).find((s) => s.startISO === selectedStartISO) ?? null
    );
  }, [data, selectedStartISO]);

  // ✅ Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: Toast = { id, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }

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
      pushToast({
        type: "error",
        title: "Could not load slots",
        description: "Please try again.",
      });
      return;
    }

    setData(res.data);

    // Reset selection if the selected slot no longer exists
    const found = res.data.slots?.some((s) => s.startISO === selectedStartISO);
    if (selectedStartISO && !found) setSelectedStartISO(null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function requestBooking(startISO: string, endISO: string) {
    setMsg(null);

    if (!isAuthed) {
      if (!guestName.trim()) {
        setMsg("Please enter your name.");
        pushToast({
          type: "info",
          title: "Name required",
          description: "Please enter your name to book as guest.",
        });
        return;
      }
      if (!isValidPhone(guestPhone)) {
        setMsg("Please enter a valid phone number.");
        pushToast({
          type: "info",
          title: "Phone required",
          description: "Enter a valid number (01XXXXXXXXX or +8801XXXXXXXXX).",
        });
        return;
      }
    }

    const payload = {
      venueId,
      startISO,
      endISO,
      note: note || undefined,
      guestName: isAuthed ? undefined : guestName.trim(),
      guestPhone: isAuthed ? undefined : normalizePhone(guestPhone),
    };

    const res = await clientFetch<{ id: string; status: string }>(
      "/api/bookings",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err =
        typeof res.error === "string" ? res.error : "Booking request failed";
      setMsg(err);
      pushToast({ type: "error", title: "Booking failed", description: err });
      return;
    }

    setNote("");

    pushToast({
      type: "success",
      title: "Booking requested",
      description: `Status: ${res.data.status}. Owner will confirm.`,
    });

    setMsg("Booking requested. Status: PENDING (Owner will confirm).");
    await load();
  }

  const prettyDate = useMemo(() => {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <div className="relative">
      {/* ✅ Toast stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-[92vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border rounded-xl p-3 shadow-sm backdrop-blur ${toastTone(
              t.type
            )}`}
            role="status"
            aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{t.title}</div>
                {t.description ? (
                  <div className="text-xs mt-1 opacity-90">{t.description}</div>
                ) : null}
              </div>
              <button
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() =>
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }
                aria-label="Dismiss">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Two-column layout: mobile shows slots first, desktop shows slots right */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Slots panel (mobile first, desktop right) */}
        <aside className="lg:col-span-5 order-1 lg:order-2">
          <div className="lg:sticky lg:top-4">
            <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Available slots</div>
                    <div className="text-lg font-semibold">{prettyDate}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Slot: <b>{slotDurationMinutes} min</b>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-600">Date</label>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4">
                {loading ? (
                  <p className="text-gray-600">Loading slots…</p>
                ) : slots.length === 0 ? (
                  <p className="text-gray-600">
                    No slots available for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const st = slotAvailability(s);
                      const isDisabled =
                        st === "CONFIRMED" || st === "UNAVAILABLE";
                      const isSelected = selectedStartISO === s.startISO;
                      const badge = badgeForStatus(st);

                      return (
                        <button
                          key={s.startISO}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedStartISO(s.startISO)}
                          className={[
                            "relative text-left rounded-xl border px-3 py-2 transition",
                            "focus:outline-none focus:ring-2 focus:ring-black/10",
                            isDisabled
                              ? "opacity-60 cursor-not-allowed bg-gray-50"
                              : "hover:bg-gray-50",
                            isSelected
                              ? "border-black ring-2 ring-black/10 bg-gray-50"
                              : "border-gray-200",
                          ].join(" ")}
                          title={
                            isDisabled ? "Not available" : "Select this slot"
                          }>
                          <div className="text-sm font-semibold">
                            {formatTimeRange(s.startISO, s.endISO)}
                          </div>
                          <div className="mt-1 inline-flex items-center">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected slot details + CTA */}
                <div className="mt-4 border rounded-2xl p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-600">Selected slot</div>
                      <div className="font-semibold">
                        {selectedSlot
                          ? formatTimeRange(
                              selectedSlot.startISO,
                              selectedSlot.endISO
                            )
                          : "None"}
                      </div>
                      {selectedSlot ? (
                        <div className="text-xs text-gray-600 mt-1">
                          {formatFull(
                            selectedSlot.startISO,
                            selectedSlot.endISO
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 mt-1">
                          Tap a slot to see details.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        !selectedSlot ||
                        slotAvailability(selectedSlot) === "CONFIRMED" ||
                        slotAvailability(selectedSlot) === "UNAVAILABLE"
                      }
                      onClick={() => {
                        if (!selectedSlot) return;
                        requestBooking(
                          selectedSlot.startISO,
                          selectedSlot.endISO
                        );
                      }}
                      className={[
                        "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
                        "focus:outline-none focus:ring-2 focus:ring-black/10",
                        !selectedSlot ||
                        slotAvailability(selectedSlot) === "CONFIRMED" ||
                        slotAvailability(selectedSlot) === "UNAVAILABLE"
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-black text-white hover:bg-black/90",
                      ].join(" ")}>
                      Request
                    </button>
                  </div>
                </div>

                {msg && <p className="text-sm mt-3">{msg}</p>}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content (mobile after, desktop left) */}
        <section className="lg:col-span-7 order-2 lg:order-1 space-y-4">
          {/* Images */}
          {gallery.length > 0 && (
            <div className="space-y-2">
              {thumbnailUrl ? (
                <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                  <img
                    src={thumbnailUrl}
                    alt={venueName ? `${venueName} thumbnail` : "thumbnail"}
                    className="w-full max-h-[360px] object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}

              {gallery.length > 1 && (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {gallery
                    .filter((g) => !g.isThumb)
                    .slice(0, 6)
                    .map((g) => (
                      <a
                        key={g.url}
                        href={g.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition"
                        title="Open image">
                        <img
                          src={g.url}
                          alt="venue image"
                          className="w-full h-28 object-cover"
                          loading="lazy"
                        />
                        <div className="px-3 py-2 text-xs text-gray-600 group-hover:text-gray-900 transition">
                          View
                        </div>
                      </a>
                    ))}
                </div>
              )}
            </div>
          )}

{description && (
  <div className="border rounded-2xl p-4 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-lg">About this venue</h3>
        <p className="text-sm text-gray-500 mt-1">Details, rules, and notes</p>
      </div>
      <button
        type="button"
        onClick={() => setDescExpanded(v => !v)}
        className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
      >
        {descExpanded ? "Show less" : "Read more"}
      </button>
    </div>

    <div className="mt-3 text-gray-700 text-sm leading-relaxed">
      {(() => {
        const { lines, looksLikeList } = splitDescription(description);

        const displayLines = descExpanded ? lines : lines.slice(0, 6);
        if (looksLikeList) {
          return (
            <ul className="list-disc pl-5 space-y-1">
              {displayLines.map((l, idx) => (
                <li key={idx}>{l.replace(/^[-•]\s*/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <div className="space-y-2">
            {displayLines.map((l, idx) => (
              <p key={idx}>{l}</p>
            ))}
          </div>
        );
      })()}

      {!descExpanded && description.split("\n").filter(Boolean).length > 6 ? (
        <button
          type="button"
          onClick={() => setDescExpanded(true)}
          className="mt-3 text-sm font-medium text-black hover:underline"
        >
          Continue reading →
        </button>
      ) : null}
    </div>
  </div>
)}


          {/* Guest fields */}
          {!isAuthed && (
            <div className="border rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg">Book as guest</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    No account needed. Provide your name & phone so the owner
                    can contact you.
                  </p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  Guest
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-700">Your name</label>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Mehedy Hassan"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700">Phone number</label>
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. 01XXXXXXXXX or +8801XXXXXXXXX"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used only for booking communication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="border rounded-2xl p-4 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-700">Note (optional)</label>
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. team name / details"
                />
              </div>
              <div className="text-sm text-gray-600">
                You’re {isAuthed ? "signed in" : "booking as guest"}.
              </div>
            </div>
          </div>

          {isAuthed ? (
            <p className="text-sm text-gray-600">
              You’re signed in. Your request will be <b>confirmed by Owner</b>.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Booking requests are reviewed by the <b>Owner</b>. You can sign in
              anytime for faster management.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
