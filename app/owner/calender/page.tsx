"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clientFetch } from "@/lib/clientFetch";

import { Icon } from "@/components/owner-calendar/icons";
import { ToastStack, Toast } from "@/components/owner-calendar/toasts";
import { ConfirmDialog } from "@/components/owner-calendar/confirm-dialog";
import { CalendarGrid } from "@/components/owner-calendar/calendar-grid";
import { DayDetailModal, OwnerBooking, VenueMini } from "@/components/owner-calendar/day-detail-modal";

import {
  buildCalendarDays,
  dayKey,
  formatDayHeader,
  formatMonthTitle,
} from "@/components/owner-calendar/date-helpers";

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
    const map = new Map<string, { _id: string; start: string; status: OwnerBooking["status"] }[]>();
    for (const b of bookings) {
      const k = dayKey(new Date(b.start));
      const arr = map.get(k) ?? [];
      arr.push({ _id: b._id, start: b.start, status: b.status });
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
    return (bookingsByDay.get(selectedDayKey) ?? [])
      .map((mini) => bookings.find((b) => b._id === mini._id))
      .filter(Boolean) as OwnerBooking[];
  }, [selectedDayKey, bookingsByDay, bookings]);

  const selectedTitle = useMemo(() => {
    if (!selectedDayKey) return "";
    const [y, m, d] = selectedDayKey.split("-").map((x) => Number(x));
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return formatDayHeader(dt);
  }, [selectedDayKey]);

  const todayDateOnly = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  return (
    <PageShell>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

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

          <div className="text-base sm:text-lg font-semibold bg-linear-to-r from-indigo-700 via-fuchsia-700 to-emerald-700 bg-clip-text text-transparent">
            {formatMonthTitle(month)}
          </div>

          <button
            className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <Icon name="chevR" />
          </button>
        </div>
      </div>

      <CalendarGrid
        loading={loading}
        month={month}
        calendarDays={calendarDays}
        bookingsByDay={bookingsByDay}
        onSelectDay={(k) => setSelectedDayKey(k)}
        todayDateOnly={todayDateOnly}
      />

      <DayDetailModal
        open={!!selectedDayKey}
        title={selectedTitle}
        dayKey={selectedDayKey}
        bookings={selectedBookings}
        venueMap={venueMap}
        busyId={busyId}
        noteById={noteById}
        setNoteById={setNoteById}
        onClose={() => setSelectedDayKey(null)}
        onConfirmClick={(id) => setConfirmState({ id, action: "CONFIRMED" })}
        onRejectClick={(id) => setConfirmState({ id, action: "REJECTED" })}
      />

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
