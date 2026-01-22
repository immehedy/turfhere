import React from "react";

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export function StatusPill({ status }: { status: BookingStatus }) {
  const cls: Record<BookingStatus, string> = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-800 ring-rose-200",
    CANCELLED: "bg-gray-50 text-gray-700 ring-gray-200",
  };

  const label: Record<BookingStatus, string> = {
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
