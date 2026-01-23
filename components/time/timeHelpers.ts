export type Time12 = { hour: number; minute: number; ampm: "AM" | "PM" };

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function parse24To12(hhmm: string): Time12 {
  const [hStr, mStr] = (hhmm || "10:00").split(":");
  const h24 = Math.min(23, Math.max(0, Number(hStr)));
  const minute = Math.min(59, Math.max(0, Number(mStr)));

  const ampm: Time12["ampm"] = h24 >= 12 ? "PM" : "AM";
  const h12raw = h24 % 12;
  const hour = h12raw === 0 ? 12 : h12raw;

  return { hour, minute, ampm };
}

export function to24From12(t: Time12): string {
  let h = t.hour % 12;
  if (t.ampm === "PM") h += 12;
  if (t.ampm === "AM" && t.hour === 12) h = 0;
  return `${pad2(h)}:${pad2(t.minute)}`;
}
