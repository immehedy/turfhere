"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import type { Slot } from "./bookingTypes";
import {
  badgeForStatus,
  formatFull,
  formatTimeRange,
  slotAvailability,
} from "./bookingUtils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SlotsPanel({
  variant = "default",
  date,
  setDate,
  prettyDate,
  slotDurationMinutes,
  loading,
  slots,
  selectedStartISO,
  setSelectedStartISO,
  onRequestSelected,
  msg,
}: {
  variant?: "default" | "compact";
  date: string;
  setDate: (v: string) => void;
  prettyDate: string;
  slotDurationMinutes: number;
  loading: boolean;
  slots: Slot[];
  selectedStartISO: string | null;
  setSelectedStartISO: (v: string | null) => void;
  onRequestSelected: (slot: Slot) => void;
  msg: string | null;
}) {
  const selectedSlot = useMemo(() => {
    if (!selectedStartISO) return null;
    return slots.find((s) => s.startISO === selectedStartISO) ?? null;
  }, [slots, selectedStartISO]);

  const selectedBlocked =
    !selectedSlot ||
    slotAvailability(selectedSlot) === "CONFIRMED" ||
    slotAvailability(selectedSlot) === "UNAVAILABLE";

  const isCompact = variant === "compact";

  return (
    <Card className={cn("overflow-hidden", !isCompact && "shadow-sm")}>
      <CardHeader className={cn(isCompact ? "pb-1" : "pb-2")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Available slots</CardDescription>
            <CardTitle className={cn(isCompact ? "text-base" : "text-lg")}>
              {prettyDate}
            </CardTitle>
          </div>

          <div className="text-xs text-muted-foreground">
            Slot: <b className="text-foreground">{slotDurationMinutes} min</b>
          </div>
        </div>

        {/* Date input (optional in compact) */}
        <div className={cn("mt-3", isCompact && "mt-2")}>
          <label className="text-xs text-muted-foreground">Date</label>
          <input
            className={cn(
              "mt-1 w-full border rounded-xl px-3 py-2 bg-background",
              "focus:outline-none focus:ring-2 focus:ring-black/10",
              isCompact && "py-2"
            )}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent className={cn(isCompact ? "pt-0" : "pt-0")}>
        {loading ? (
          <p className="text-muted-foreground">Loading slots…</p>
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground">No slots available for this date.</p>
        ) : (
          <div
            className={cn(
              "grid gap-2",
              isCompact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
            )}
          >
            {slots.map((s) => {
              const st = slotAvailability(s);
              const isDisabled = st === "CONFIRMED" || st === "UNAVAILABLE";
              const isSelected = selectedStartISO === s.startISO;
              const badge = badgeForStatus(st);

              return (
                <button
                  key={s.startISO}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedStartISO(s.startISO)}
                  className={cn(
                    "relative text-left rounded-xl border px-3 py-2 transition",
                    "focus:outline-none focus:ring-2 focus:ring-black/10",
                    isDisabled
                      ? "opacity-60 cursor-not-allowed bg-muted/40"
                      : "hover:bg-muted/40",
                    isSelected
                      ? "border-black ring-2 ring-black/10 bg-muted/40"
                      : "border-border"
                  )}
                  title={isDisabled ? "Not available" : "Select this slot"}
                >
                  <div className={cn("font-semibold", isCompact ? "text-sm" : "text-sm")}>
                    {formatTimeRange(s.startISO, s.endISO)}
                  </div>

                  {/* Hide badge in compact to save space (optional) */}
                  {!isCompact && (
                    <div className="mt-1 inline-flex items-center">
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full ring-1",
                          badge.cls
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected slot block (compact version is tighter) */}
        <div
          className={cn(
            "mt-4 border rounded-2xl bg-muted/30",
            isCompact ? "p-3" : "p-3"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Selected slot</div>
              <div className="font-semibold">
                {selectedSlot
                  ? formatTimeRange(selectedSlot.startISO, selectedSlot.endISO)
                  : "None"}
              </div>

              {/* Hide full ISO range in compact */}
              {!isCompact && selectedSlot ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatFull(selectedSlot.startISO, selectedSlot.endISO)}
                </div>
              ) : !selectedSlot ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Tap a slot to see details.
                </div>
              ) : null}
            </div>

            <button
              type="button"
              disabled={selectedBlocked}
              onClick={() => selectedSlot && onRequestSelected(selectedSlot)}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-black/10",
                selectedBlocked
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/90"
              )}
            >
              {isCompact ? "Book" : "Request"}
            </button>
          </div>
        </div>

        {msg && <p className="text-sm mt-3">{msg}</p>}
      </CardContent>
    </Card>
  );
}
