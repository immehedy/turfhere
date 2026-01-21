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
  name: "plus" | "clock" | "check" | "x" | "user" | "phone" | "note";
  className?: string;
}) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
    case "plus":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 8v5l3 2" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
  const map: Record<OwnerBooking["status"], { label: string; cls: string }> = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
    CANCELLED: "bg-gray-50 text-gray-700 ring-gray-200",
  } as any;

  const labelMap: Record<OwnerBooking["status"], string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${map[status]}`}>
      {labelMap[status]}
    </span>
  );
}

function formatCompactRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString([], { month: "short", day: "numeric" });
  const st = time12(s)
  const et = time12(e)
  return `${day} • ${st}-${et}`;
}

function Modal({
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
    <div className="fixed inset-0 z-50">
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

export default function OwnerBookingsPage() {
  const [venues, setVenues] = useState<VenueMini[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // per booking note
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  // toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 4));
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }

  // modal confirm
  const [confirmState, setConfirmState] = useState<null | { id: string; action: "CONFIRMED" | "REJECTED" }>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OwnerBooking["status"]>("ALL");

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const filtered = useMemo(() => {
    const list = statusFilter === "ALL" ? bookings : bookings.filter((b) => b.status === statusFilter);
    // Keep newest first (already sorted by API), but safe:
    return list;
  }, [bookings, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === "PENDING").length, [bookings]);

  async function load() {
    setLoading(true);
    const res = await clientFetch<{ venues: VenueMini[]; bookings: OwnerBooking[] }>("/api/owner/bookings");
    if (!res.ok) {
      pushToast({ type: "error", title: "Failed to load bookings", description: "Please refresh and try again." });
      setLoading(false);
      return;
    }

    setVenues(res.data.venues);
    setBookings(res.data.bookings);

    setNoteById((prev) => {
      const next = { ...prev };
      for (const b of res.data.bookings) {
        if (next[b._id] === undefined) next[b._id] = (b.ownerNote ?? "").toString();
      }
      return next;
    });

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Reset to page 1 when changing filters/page size
  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

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

    // optimistic update
    setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)));

    pushToast({
      type: "success",
      title: status === "CONFIRMED" ? "Booking confirmed" : "Booking rejected",
      description: "The request has been updated.",
    });

    setBusyId(null);
    await load();
  }

  return (
    <PageShell>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-[92vw] max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className={`border rounded-2xl p-3 shadow-sm backdrop-blur ${toastTone(t.type)}`} role="status" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-sm">{t.title}</div>
                {t.description ? <div className="text-xs mt-1 opacity-90">{t.description}</div> : null}
              </div>
              <button className="text-xs opacity-70 hover:opacity-100" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking requests</h1>
          <p className="text-sm text-gray-600 mt-1">
            Quick view. Tap a card to take action.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-900 ring-1 ring-amber-200 px-3 py-1 text-xs font-semibold">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {pendingCount} pending
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            href="/owner/venues/new"
          >
            <Icon name="plus" />
            Create venue
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PENDING", "CONFIRMED", "REJECTED", "CANCELLED"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k === "ALL" ? "ALL" : (k as OwnerBooking["status"]))}
              className={[
                "rounded-full px-3 py-2 text-sm font-medium border transition",
                statusFilter === k ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800",
              ].join(" ")}
            >
              {k === "ALL" ? "All" : k[0] + k.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            {filtered.length} results • Page {safePage} / {totalPages}
          </div>
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as 12 | 24 | 48)}
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
            <option value={48}>48 / page</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-gray-600">
          Loading…
        </div>
      ) : pageItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
          No bookings found.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((b) => {
              const v = venueMap.get(b.venueId);
              const isPending = b.status === "PENDING";
              const isBusy = busyId === b._id;

              const displayName =
                b.guest?.name ??
                b.userSnapshot?.name ??
                (b.userId ? `User ${b.userId.slice(0, 6)}…` : "User");

              const phone = b.guest?.phone ?? b.userSnapshot?.phone ?? null;

              return (
                <div
                  key={b._id}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 flex flex-col gap-3"
                >
                  {/* Top row */}
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
                        {formatCompactRange(b.start, b.end)}
                      </div>
                    </div>

                    <StatusPill status={b.status} />
                  </div>

                  {/* Identity */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Icon name="user" className="h-4 w-4" />
                      <span className="font-semibold truncate">{displayName}</span>
                      <span className="ml-auto text-[11px] rounded-full bg-white px-2 py-0.5 ring-1 ring-gray-200">
                        {b.guest ? "Guest" : "User"}
                      </span>
                    </div>

                    {phone ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                        <Icon name="phone" className="h-3.5 w-3.5" />
                        <span className="font-mono truncate">{phone}</span>
                        <a className="ml-auto text-xs font-semibold hover:underline" href={`tel:${phone}`}>
                          Call
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {/* Note (compact) */}
                  <div>
                    <label className="text-xs text-gray-700 inline-flex items-center gap-2">
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

                  {/* Actions (remove after status change) */}
                  {isPending ? (
                    <div className="flex gap-2">
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
                    <div className="text-xs text-gray-500 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      Decided. Actions hidden.
                    </div>
                  )}

                  {/* Admin note (compact) */}
                  {b.adminNote ? (
                    <div className="text-xs text-gray-700 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="font-semibold text-gray-900">Admin:</span> {b.adminNote}
                    </div>
                  ) : null}

                  {/* Tiny footer */}
                  <div className="text-[11px] text-gray-400">
                    ID: <span className="font-mono">{b._id}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Prev
              </button>

              <div className="text-sm text-gray-700">
                Page <b>{safePage}</b> / {totalPages}
              </div>

              <button
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation modal */}
      <Modal
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
