import { time12 } from "@/lib/utils";
import type { Slot, Toast } from "./bookingTypes";

export function uniqUrls(urls: string[]) {
  return Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)));
}

export function normalizePhone(raw: string) {
  return raw.trim().replace(/[^\d+]/g, "");
}

export function isValidPhone(raw: string) {
  const v = normalizePhone(raw);
  if (!v) return false;
  if (/^(\+?8801)\d{9}$/.test(v)) return true;
  if (/^01\d{9}$/.test(v)) return true;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  return `${time12(start)} – ${time12(end)}`;
}

export function formatFull(startISO: string, endISO: string) {
  return `${new Date(startISO).toLocaleString()} → ${new Date(
    endISO
  ).toLocaleString()}`;
}

export function slotAvailability(s: Slot) {
  if (typeof s.isAvailable === "boolean") {
    return s.isAvailable ? "AVAILABLE" : "UNAVAILABLE";
  }
  return s.status ?? "AVAILABLE";
}

export function badgeForStatus(status: string) {
  switch (status) {
    case "AVAILABLE":
      return {
        label: "Available",
        cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      };
    case "PENDING":
      return {
        label: "Pending",
        cls: "bg-amber-50 text-amber-700 ring-amber-200",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        cls: "bg-rose-50 text-rose-700 ring-rose-200",
      };
    case "UNAVAILABLE":
    default:
      return {
        label: "Unavailable",
        cls: "bg-gray-50 text-gray-700 ring-gray-200",
      };
  }
}

export function toastTone(type: Toast["type"]) {
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

export function splitDescription(desc: string) {
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
  const looksLikeList = lines.some((l) => /^[-•]/.test(l));
  return { lines, looksLikeList };
}
