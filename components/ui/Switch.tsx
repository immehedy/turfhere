"use client";

import { cn } from "@/lib/utils";

export default function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onCheckedChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border shadow-sm transition",
        checked ? "bg-black border-black" : "bg-white border-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
