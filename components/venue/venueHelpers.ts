import { days, OpeningHours } from "./venueTypes";

export function defaultOpeningHours(): OpeningHours {
  const base = { open: "10:00", close: "22:00", closed: false };
  return Object.fromEntries(days.map((d) => [d, { ...base }])) as OpeningHours;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
