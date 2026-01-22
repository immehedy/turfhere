"use client";

import React from "react";
import Link from "next/link";
import { Modal } from "./modal";
import { StatusPill } from "./status-pill";
import { Icon } from "./icons";
import { formatTimeRange } from "./date-helpers";

type GuestInfo = { name: string; phone: string };

export type OwnerBooking = {
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

export type VenueMini = { id: string; name: string; slug: string };

export function DayDetailModal({
  open,
  title,
  dayKey,
  bookings,
  venueMap,
  busyId,
  noteById,
  setNoteById,
  onClose,
  onConfirmClick,
  onRejectClick,
}: {
  open: boolean;
  title: string;
  dayKey: string | null;
  bookings: OwnerBooking[];
  venueMap: Map<string, VenueMini>;
  busyId: string | null;
  noteById: Record<string, string>;
  setNoteById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onClose: () => void;
  onConfirmClick: (id: string) => void;
  onRejectClick: (id: string) => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {dayKey && bookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-md p-6 text-gray-600">
          <div className="text-sm font-semibold text-gray-900">No bookings</div>
          <div className="text-sm mt-1">This day has no requests or confirmed bookings.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookings.map((b) => {
            const v = venueMap.get(b.venueId);
            const isPending = b.status === "PENDING";
            const isBusy = busyId === b._id;

            const displayName =
              b.guest?.name ?? b.userSnapshot?.name ?? (b.userId ? `User ${b.userId.slice(0, 6)}…` : "User");
            const phone = b.guest?.phone ?? b.userSnapshot?.phone ?? null;

            return (
              <div key={b._id} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm flex flex-col gap-2">
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

                {isPending ? (
                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => onConfirmClick(b._id)}
                      disabled={isBusy}
                    >
                      <Icon name="check" />
                      Confirm
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                      onClick={() => onRejectClick(b._id)}
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
  );
}
