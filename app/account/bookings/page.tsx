"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { time12 } from "@/lib/utils";

type MyBooking = {
  _id: string;
  venueId: string;
  venueSlug: string;
  venueName: string;
  start: string;
  end: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  ownerNote?: string;
  adminNote?: string;
};

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
  name: "clock" | "check" | "x" | "alert" | "note";
  className?: string;
}) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
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
    case "alert":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
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

function StatusPill({ status }: { status: MyBooking["status"] }) {
  const map: Record<
    MyBooking["status"],
    { label: string; cls: string; icon: "clock" | "check" | "x" | "alert" }
  > = {
    PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-800 ring-amber-200", icon: "clock" },
    CONFIRMED: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", icon: "check" },
    REJECTED: { label: "Rejected", cls: "bg-rose-50 text-rose-800 ring-rose-200", icon: "x" },
    CANCELLED: { label: "Cancelled", cls: "bg-gray-50 text-gray-700 ring-gray-200", icon: "alert" },
  };

  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 ${s.cls}`}>
      <Icon name={s.icon} className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}

function formatCompactRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString([], { month: "short", day: "numeric" });
  const st = time12(s)
  const et = time12(e)
  return `${day} • ${st}–${et}`;
}

function statusHint(status: MyBooking["status"]) {
  switch (status) {
    case "PENDING":
      return "Waiting for owner approval.";
    case "CONFIRMED":
      return "Approved by the owner.";
    case "REJECTED":
      return "Not approved by the owner.";
    case "CANCELLED":
    default:
      return "This booking was cancelled.";
  }
}

export default function MyBookingsPage() {
  const { status } = useSession();

  const [items, setItems] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Optional toast (for load errors)
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 3));
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }

  // Filters + pagination
  const [statusFilter, setStatusFilter] = useState<"ALL" | MyBooking["status"]>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12);

  useEffect(() => {
    (async () => {
      if (status !== "authenticated") {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await clientFetch<{ bookings: MyBooking[] }>("/api/bookings/me");

      if (res.ok) {
        setItems(res.data.bookings);
      } else {
        pushToast({
          type: "error",
          title: "Failed to load bookings",
          description: typeof res.error === "string" ? res.error : "Please try again.",
        });
      }

      setLoading(false);
    })();
  }, [status]);

  const filtered = useMemo(() => {
    return statusFilter === "ALL" ? items : items.filter((b) => b.status === statusFilter);
  }, [items, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  const summary = useMemo(() => {
    const pending = items.filter((x) => x.status === "PENDING").length;
    const confirmed = items.filter((x) => x.status === "CONFIRMED").length;
    return { pending, confirmed, total: items.length };
  }, [items]);

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

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My bookings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track your requests and confirmations in one place.
          </p>

          {status === "authenticated" ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-gray-50 text-gray-700 ring-1 ring-gray-200 px-3 py-1">
                Total: <b>{summary.total}</b>
              </span>
              <span className="rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200 px-3 py-1">
                Pending: <b>{summary.pending}</b>
              </span>
              <span className="rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 px-3 py-1">
                Confirmed: <b>{summary.confirmed}</b>
              </span>
            </div>
          ) : null}
        </div>

        <Link
          href="/venues"
          className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Browse venues
        </Link>
      </div>

      {status !== "authenticated" ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-gray-800">
            Please{" "}
            <Link className="font-semibold underline" href="/signin">
              sign in
            </Link>{" "}
            to see your bookings.
          </p>
        </div>
      ) : loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-gray-600">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
          No bookings yet.
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "PENDING", "CONFIRMED", "REJECTED", "CANCELLED"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatusFilter(k === "ALL" ? "ALL" : (k as MyBooking["status"]))}
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
          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((b) => (
              <div key={b._id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link className="text-sm font-semibold text-gray-900 hover:underline truncate" href={`/v/${b.venueSlug}`}>
                    {b.venueName}
                  </Link>
                  <StatusPill status={b.status} />
                </div>

                <div className="text-xs text-gray-600 inline-flex items-center gap-2">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {formatCompactRange(b.start, b.end)}
                </div>

                <div className="text-sm text-gray-700 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  {statusHint(b.status)}
                </div>

                {(b.ownerNote || b.adminNote) ? (
                  <div className="space-y-2">
                    {b.ownerNote ? (
                      <div className="text-xs text-gray-700 rounded-xl border border-gray-200 bg-white px-3 py-2">
                        <div className="font-semibold text-gray-900 inline-flex items-center gap-2">
                          <Icon name="note" className="h-3.5 w-3.5" />
                          Owner note
                        </div>
                        <div className="mt-1">{b.ownerNote}</div>
                      </div>
                    ) : null}

                    {b.adminNote ? (
                      <div className="text-xs text-gray-700 rounded-xl border border-gray-200 bg-white px-3 py-2">
                        <div className="font-semibold text-gray-900 inline-flex items-center gap-2">
                          <Icon name="note" className="h-3.5 w-3.5" />
                          Admin note
                        </div>
                        <div className="mt-1">{b.adminNote}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-[11px] text-gray-400">
                  ID: <span className="font-mono">{b._id}</span>
                </div>
              </div>
            ))}
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
    </PageShell>
  );
}
