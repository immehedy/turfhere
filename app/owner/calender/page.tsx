"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { time12 } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GuestInfo = { name: string; phone: string };

type OwnerBooking = {
  _id: string;
  venueId: string;
  userId: string | null;
  guest: GuestInfo | null;
  userSnapshot: { name?: string; email?: string; phone?: string } | null;
  start: string;
  end: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  ownerNote?: string | null;
  adminNote?: string | null;
};

type VenueMini = { id: string; name: string; slug: string };

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

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name:
    | "chevL"
    | "chevR"
    | "clock"
    | "calendar"
    | "check"
    | "x"
    | "user"
    | "phone"
    | "note";
  className?: string;
}) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
    case "chevL":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case "chevR":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 8v5l3 2" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 2v4M16 2v4" />
          <path d="M3 10h18" />
          <path d="M5 6h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 21a8 8 0 1 0-16 0" />
          <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 10.8 19.86 19.86 0 0 1 .08 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L6 7.5a16 16 0 0 0 10.5 10.5l1.17-1.15a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case "note":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8M8 12h8M8 16h6" />
        </svg>
      );
    default:
      return null;
  }
}

function StatusPill({ status }: { status: OwnerBooking["status"] }) {
  const cls: Record<OwnerBooking["status"], string> = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
    CANCELLED: "bg-gray-50 text-gray-700 ring-gray-200",
  };

  const label: Record<OwnerBooking["status"], string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${cls[status]}`}>
      {label[status]}
    </span>
  );
}

/** -------- Date helpers -------- **/
function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// dynamic weeks (no forced 6th row)
function buildCalendarDays(month: Date) {
  const s = startOfMonth(month);
  const e = endOfMonth(month);

  const startDow = s.getDay(); // 0..6, Sunday-start
  const daysInMonth = e.getDate();

  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const gridStart = new Date(s);
  gridStart.setDate(s.getDate() - startDow);

  const days: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatMonthTitle(d: Date) {
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}
function formatDayHeader(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}
function formatTimeRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  return `${time12(s)} – ${time12(e)}`;
}

/** -------- Modal with fixed height + scroll body -------- **/
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          className={[
            "w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden",
            // fixed-ish height, not stretched
            "h-[78vh] sm:h-[74vh] max-h-[74vh]",
            "flex flex-col",
          ].join(" ")}
        >
          {/* Header stays fixed */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{title}</div>
              <div className="text-xs text-gray-500 mt-0.5">Scroll to view more</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          {/* Scrollable body */}
          <div className="p-4 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** -------- Confirm dialog (same flow as booking requests) -------- **/
function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmTone = "danger",
  onConfirm,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  confirmTone?: "danger" | "success";
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="Close modal" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="text-lg font-semibold">{title}</div>
            {description ? <div className="text-sm text-gray-600 mt-1">{description}</div> : null}
          </div>
          <div className="p-4 pt-0 flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
                confirmTone === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
              ].join(" ")}
            >
              {busy ? "Working..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ALLOWED_STATUSES: Array<OwnerBooking["status"]> = ["PENDING", "CONFIRMED"];

export default function OwnerCalendarPage() {
  const [venues, setVenues] = useState<VenueMini[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<null | { id: string; action: "CONFIRMED" | "REJECTED" }>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 4));
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  async function load() {
    setLoading(true);
    const res = await clientFetch<{ venues: VenueMini[]; bookings: OwnerBooking[] }>("/api/owner/bookings");
    if (!res.ok) {
      pushToast({ type: "error", title: "Failed to load bookings", description: "Please refresh and try again." });
      setLoading(false);
      return;
    }

    setVenues(res.data.venues);

    const filtered = res.data.bookings.filter((b) => ALLOWED_STATUSES.includes(b.status));
    setBookings(filtered);

    setNoteById((prev) => {
      const next = { ...prev };
      for (const b of filtered) {
        if (next[b._id] === undefined) next[b._id] = (b.ownerNote ?? "").toString();
      }
      return next;
    });

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function finalize(id: string, status: "CONFIRMED" | "REJECTED") {
    setBusyId(id);

    const ownerNote = noteById[id]?.trim();
    const body: any = { status };
    if (ownerNote) body.ownerNote = ownerNote;

    const res = await clientFetch<{ ok: true; status: string }>(`/api/owner/bookings/${id}/decision`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = typeof res.error === "string" ? res.error : "Failed to update booking";
      pushToast({ type: "error", title: "Update failed", description: err });
      setBusyId(null);
      return;
    }

    setBookings((prev) =>
      prev
        .map((b) => (b._id === id ? { ...b, status } : b))
        .filter((b) => ALLOWED_STATUSES.includes(b.status))
    );

    pushToast({
      type: "success",
      title: status === "CONFIRMED" ? "Booking confirmed" : "Booking rejected",
      description: "The request has been updated.",
    });

    setBusyId(null);
    await load();
  }

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, OwnerBooking[]>();
    for (const b of bookings) {
      const k = dayKey(new Date(b.start));
      const arr = map.get(k) ?? [];
      arr.push(b);
      map.set(k, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      map.set(k, arr);
    }
    return map;
  }, [bookings]);

  const calendarDays = useMemo(() => buildCalendarDays(month), [month]);

  const selectedBookings = useMemo(() => {
    if (!selectedDayKey) return [];
    return bookingsByDay.get(selectedDayKey) ?? [];
  }, [selectedDayKey, bookingsByDay]);

  const selectedTitle = useMemo(() => {
    if (!selectedDayKey) return "";
    const [y, m, d] = selectedDayKey.split("-").map((x) => Number(x));
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return formatDayHeader(dt);
  }, [selectedDayKey]);

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const todayDateOnly = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  return (
    <PageShell>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[70] space-y-2 w-[92vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border rounded-2xl p-3 shadow-sm backdrop-blur ${toastTone(t.type)}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{t.title}</div>
                {t.description ? <div className="text-xs mt-1 opacity-90">{t.description}</div> : null}
              </div>
              <button
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight inline-flex items-center gap-2">
            <Icon name="calendar" className="h-5 w-5" />
            Calendar
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Month view. Shows only <b>Pending</b> and <b>Confirmed</b> bookings. Past dates are dimmed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/owner/bookings"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            Booking requests
          </Link>
        </div>
      </div>

      {/* Month controls */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <Icon name="chevL" />
          </button>

          <div className="text-base sm:text-lg font-semibold">{formatMonthTitle(month)}</div>

          <button
            className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <Icon name="chevR" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {weekdayLabels.map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-semibold text-gray-700">
              {w}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-4 text-gray-600">Loading…</div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((d) => {
              const k = dayKey(d);
              const count = bookingsByDay.get(k)?.length ?? 0;

              const isInMonth = d.getMonth() === month.getMonth();
              const cellDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
              const isPast = cellDateOnly.getTime() < todayDateOnly.getTime();

              return (
                <button
                  key={k}
                  onClick={() => setSelectedDayKey(k)}
                  className={[
                    "relative min-h-[78px] sm:min-h-[96px] border-b border-r border-gray-200 p-2 text-left hover:bg-gray-50 transition",
                    !isInMonth ? "bg-gray-50/60 text-gray-400" : "bg-white",
                    isPast ? "opacity-60 grayscale" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{d.getDate()}</div>

                    {count > 0 ? (
                      <span className="text-[11px] rounded-full bg-black text-white px-2 py-0.5">{count}</span>
                    ) : (
                      <span className="text-[11px] rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 ring-1 ring-gray-200">
                        0
                      </span>
                    )}
                  </div>

                  {/* mini indicators */}
                  {count > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(bookingsByDay.get(k) ?? []).slice(0, 5).map((b) => (
                        <span
                          key={b._id}
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1",
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-amber-50 text-amber-800 ring-amber-200",
                          ].join(" ")}
                        >
                          {time12(new Date(b.start))}
                        </span>
                      ))}
                      {count > 5 ? <span className="text-[10px] text-gray-500 mt-1">+{count - 5} more</span> : null}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-400">No bookings</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail modal */}
      <Modal open={!!selectedDayKey} title={selectedTitle} onClose={() => setSelectedDayKey(null)}>
        {selectedDayKey && selectedBookings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-600">No bookings for this day.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedBookings.map((b) => {
              const v = venueMap.get(b.venueId);
              const isPending = b.status === "PENDING";
              const isBusy = busyId === b._id;

              const displayName =
                b.guest?.name ?? b.userSnapshot?.name ?? (b.userId ? `User ${b.userId.slice(0, 6)}…` : "User");
              const phone = b.guest?.phone ?? b.userSnapshot?.phone ?? null;

              return (
                <div
                  key={b._id}
                  className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm flex flex-col gap-2"
                >
                  {/* top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {v ? (
                          <Link className="hover:underline" href={`/v/${v.slug}`}>
                            {v.name}
                          </Link>
                        ) : (
                          "Venue"
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 inline-flex items-center gap-2">
                        <Icon name="clock" className="h-3.5 w-3.5" />
                        {formatTimeRange(b.start, b.end)}
                      </div>
                    </div>
                    <StatusPill status={b.status} />
                  </div>

                  {/* identity */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-2">
                    <div className="flex items-center gap-2 text-xs text-gray-900">
                      <Icon name="user" className="h-3.5 w-3.5" />
                      <span className="font-semibold truncate">{displayName}</span>
                      <span className="ml-auto text-[10px] rounded-full bg-white px-2 py-0.5 ring-1 ring-gray-200">
                        {b.guest ? "Guest" : "User"}
                      </span>
                    </div>

                    {phone ? (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-700">
                        <Icon name="phone" className="h-3.5 w-3.5" />
                        <span className="font-mono truncate">{phone}</span>
                        <a className="ml-auto text-[11px] font-semibold hover:underline" href={`tel:${phone}`}>
                          Call
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {/* note */}
                  <div>
                    <label className="text-[11px] text-gray-700 inline-flex items-center gap-2">
                      <Icon name="note" className="h-3.5 w-3.5" />
                      Owner note
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50"
                      value={noteById[b._id] ?? ""}
                      onChange={(e) => setNoteById((prev) => ({ ...prev, [b._id]: e.target.value }))}
                      placeholder="Optional…"
                      disabled={!isPending}
                    />
                  </div>

                  {/* actions */}
                  {isPending ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        onClick={() => setConfirmState({ id: b._id, action: "CONFIRMED" })}
                        disabled={isBusy}
                      >
                        <Icon name="check" />
                        Confirm
                      </button>
                      <button
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                        onClick={() => setConfirmState({ id: b._id, action: "REJECTED" })}
                        disabled={isBusy}
                      >
                        <Icon name="x" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      Confirmed booking.
                    </div>
                  )}

                  {b.adminNote ? (
                    <div className="text-[11px] text-gray-700 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="font-semibold text-gray-900">Admin:</span> {b.adminNote}
                    </div>
                  ) : null}

                  <div className="text-[10px] text-gray-400 pt-1">
                    ID: <span className="font-mono">{b._id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.action === "CONFIRMED" ? "Confirm this booking?" : "Reject this booking?"}
        description={
          confirmState?.action === "CONFIRMED"
            ? "This will confirm the slot for the user."
            : "This will reject the request."
        }
        confirmText={confirmState?.action === "CONFIRMED" ? "Yes, confirm" : "Yes, reject"}
        confirmTone={confirmState?.action === "CONFIRMED" ? "success" : "danger"}
        busy={!!(confirmState && busyId === confirmState.id)}
        onClose={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          const { id, action } = confirmState;
          setConfirmState(null);
          await finalize(id, action);
        }}
      />
    </PageShell>
  );
}
