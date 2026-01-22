import { time12 } from "@/lib/utils";

export function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// dynamic weeks (no forced 6th row)
export function buildCalendarDays(month: Date) {
  const s = startOfMonth(month);
  const e = endOfMonth(month);

  const startDow = s.getDay(); // 0..6 (Sunday start)
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

export function formatMonthTitle(d: Date) {
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

export function formatDayHeader(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  return `${time12(s)} – ${time12(e)}`;
}
