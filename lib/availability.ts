import type { VenueDoc, BookingDoc, Weekday } from "@/models/types";

function weekdayKey(d: Date): Weekday {
  const map: Weekday[] = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  return map[d.getUTCDay()];
}

function parseHHMM(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return { h, m };
}

function setTimeUTC(date: Date, hhmm: string) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const { h, m } = parseHHMM(hhmm);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export function buildSlotsForDate(venue: VenueDoc, dateUTC: Date) {
  const day = weekdayKey(dateUTC);
  const rule = venue.openingHours[day];

  if (!rule || rule.closed) return [];

  const start = setTimeUTC(dateUTC, rule.open);
  const end = setTimeUTC(dateUTC, rule.close);

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
  const blocking = bookings.filter((b) => ["PENDING", "CONFIRMED"].includes(b.status));
  return slots.filter((s) => !blocking.some((b) => overlaps(s.start, s.end, b.start, b.end)));
}
