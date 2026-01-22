"use client";

import React from "react";

export type Toast = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
};

function toastTone(type: Toast["type"]) {
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

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[70] space-y-2 w-[92vw] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`border rounded-2xl p-3 shadow-sm backdrop-blur ${toastTone(t.type)}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{t.title}</div>
              {t.description ? <div className="text-xs mt-1 opacity-90">{t.description}</div> : null}
            </div>
            <button
              className="text-xs opacity-70 hover:opacity-100"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
