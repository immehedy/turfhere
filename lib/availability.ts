import type { VenueDoc, BookingDoc, Weekday } from "@/models/types";

const BD_OFFSET_MIN = 6 * 60; // Bangladesh is UTC+6 (no DST)

function weekdayKeyBD(dateUTC: Date): Weekday {
  const map: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  // shift into BD local, then use UTC getters on shifted date
  const bd = new Date(dateUTC.getTime() + BD_OFFSET_MIN * 60_000);
  return map[bd.getUTCDay()];
}

function parseHHMM(hhmm: string) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return {
    h: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 0,
    m: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
  };
}

/**
 * Make a UTC Date that represents BD-local YYYY-MM-DD hh:mm
 * Example: BD 10:00 => UTC 04:00 (same local day)
 */
function setTimeFromBDLocal(dateUTC: Date, hhmm: string) {
  const { h, m } = parseHHMM(hhmm);

  // get BD-local calendar day (Y/M/D) by shifting into BD time
  const bd = new Date(dateUTC.getTime() + BD_OFFSET_MIN * 60_000);
  const y = bd.getUTCFullYear();
  const mo = bd.getUTCMonth();
  const d = bd.getUTCDate();

  // construct BD-local time as UTC, then subtract offset => real UTC instant
  const utcMs = Date.UTC(y, mo, d, h, m, 0, 0) - BD_OFFSET_MIN * 60_000;
  return new Date(utcMs);
}

export function buildSlotsForDate(venue: VenueDoc, dateUTC: Date) {
  const day = weekdayKeyBD(dateUTC);
  const rule = venue.openingHours?.[day];

  if (!rule || rule.closed) return [];

  const start = setTimeFromBDLocal(dateUTC, rule.open);
  let end = setTimeFromBDLocal(dateUTC, rule.close);

  // support overnight ranges (e.g. 22:00 -> 02:00)
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60_000);

  const slots: { start: Date; end: Date }[] = [];
  const durMs = venue.slotDurationMinutes * 60_000;

  for (let t = start.getTime(); t + durMs <= end.getTime(); t += durMs) {
    slots.push({ start: new Date(t), end: new Date(t + durMs) });
  }

  return slots;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function filterSlotsByBookings(
  slots: { start: Date; end: Date }[],
  bookings: BookingDoc[]
) {
  const blocking = bookings.filter((b) =>
    ["PENDING", "CONFIRMED"].includes(b.status)
  );
  return slots.filter(
    (s) => !blocking.some((b) => overlaps(s.start, s.end, b.start, b.end))
  );
}
