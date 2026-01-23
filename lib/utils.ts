import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function time12(date: Date) {
  return date
    .toLocaleTimeString("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(" AM", " AM")
    .replace(" PM", " PM");
}
