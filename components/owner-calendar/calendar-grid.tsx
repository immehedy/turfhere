"use client";

import React from "react";
import { dayKey } from "./date-helpers";

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export type OwnerBookingMini = {
  _id: string;
  start: string;
  status: BookingStatus;
};

export function CalendarGrid({
  loading,
  month,
  calendarDays,
  bookingsByDay,
  onSelectDay,
  todayDateOnly,
}: {
  loading: boolean;
  month: Date;
  calendarDays: Date[];
  bookingsByDay: Map<string, OwnerBookingMini[]>;
  onSelectDay: (key: string) => void;
  todayDateOnly: Date;
}) {
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-pink-50 to-emerald-50">
        {weekdayLabels.map((w) => (
          <div key={w} className="px-3 py-2 text-xs font-semibold text-gray-800">
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
            const items = bookingsByDay.get(k) ?? [];
            const count = items.length;

            const isInMonth = d.getMonth() === month.getMonth();
            const cellDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const isPast = cellDateOnly.getTime() < todayDateOnly.getTime();
            const isToday = cellDateOnly.getTime() === todayDateOnly.getTime();

            const cellClass = [
              "relative min-h-[78px] sm:min-h-[96px] border-b border-r border-gray-200 p-2 text-left transition",
              !isInMonth
                ? "bg-gray-50/60 text-gray-400"
                : count === 0
                ? "bg-white/45 backdrop-blur-sm text-gray-400 hover:bg-white/55"
                : "bg-gradient-to-br from-indigo-50 via-white to-emerald-50 hover:from-indigo-100 hover:to-emerald-100",
              isPast ? "opacity-60 grayscale" : "",
              isToday ? "ring-2 ring-indigo-500/60 ring-inset" : "",
            ].join(" ");

            return (
              <button key={k} onClick={() => onSelectDay(k)} className={cellClass}>
                <div className="flex items-center justify-between">
                  <div
                    className={[
                      "text-sm font-semibold inline-flex h-6 w-6 items-center justify-center rounded-full",
                      isToday ? "bg-indigo-600 text-white shadow-sm" : "",
                    ].join(" ")}
                  >
                    {d.getDate()}
                  </div>

                  {count > 0 && (
                    <span className="text-[11px] rounded-full bg-gradient-to-r from-indigo-600 to-emerald-600 text-white px-2 py-0.5 shadow-sm">
                      {count}
                    </span>
                  )}
                </div>

                {count === 0 && isInMonth && !isPast ? (
                  <div className="mt-3 text-[10px] text-gray-400 italic">No bookings</div>
                ) : null}

                {count > 0 && (
                  <>
                    {/* Mobile */}
                    <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                      {items.slice(0, 2).map((b) => (
                        <span
                          key={b._id}
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 max-w-full",
                            b.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-900 ring-emerald-300"
                              : "bg-amber-100 text-amber-900 ring-amber-300",
                          ].join(" ")}
                        >
                          <span className="truncate">
                            {new Date(b.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </span>
                      ))}
                      {count > 2 ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 bg-gray-50 text-gray-700 ring-gray-200">
                          +{count - 2}
                        </span>
                      ) : null}
                    </div>

                    {/* Desktop */}
                    <div className="mt-2 hidden sm:flex flex-wrap gap-1">
                      {items.slice(0, 4).map((b) => (
                        <span
                          key={b._id}
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 max-w-full",
                            b.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-900 ring-emerald-300"
                              : "bg-amber-100 text-amber-900 ring-amber-300",
                          ].join(" ")}
                        >
                          <span className="truncate">
                            {new Date(b.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </span>
                      ))}
                      {count > 4 ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 bg-gray-50 text-gray-700 ring-gray-200">
                          +{count - 4}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
