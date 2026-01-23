"use client";

import { cn } from "@/lib/utils";
import type { Toast } from "./bookingTypes";
import { toastTone } from "./bookingUtils";

export default function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-[92vw] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "border rounded-xl p-3 shadow-sm backdrop-blur",
            toastTone(t.type)
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{t.title}</div>
              {t.description ? (
                <div className="text-xs mt-1 opacity-90">{t.description}</div>
              ) : null}
            </div>
            <button
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
