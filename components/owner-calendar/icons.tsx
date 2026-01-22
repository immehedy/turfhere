import React from "react";

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name:
    | "chevL"
    | "chevR"
    | "clock"
    | "calendar"
    | "check"
    | "x"
    | "user"
    | "phone"
    | "note";
  className?: string;
}) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;

  switch (name) {
    case "chevL":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case "chevR":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 8v5l3 2" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 2v4M16 2v4" />
          <path d="M3 10h18" />
          <path d="M5 6h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 21a8 8 0 1 0-16 0" />
          <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 10.8 19.86 19.86 0 0 1 .08 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L6 7.5a16 16 0 0 0 10.5 10.5l1.17-1.15a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case "note":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="M8 8h8M8 12h8M8 16h6" />
        </svg>
      );
    default:
      return null;
  }
}
