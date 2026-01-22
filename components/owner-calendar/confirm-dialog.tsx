"use client";

import React from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmTone = "danger",
  onConfirm,
  onClose,
  busy,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  confirmTone?: "danger" | "success";
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button aria-label="Close modal" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="text-lg font-semibold">{title}</div>
            {description ? <div className="text-sm text-gray-600 mt-1">{description}</div> : null}
          </div>
          <div className="p-4 pt-0 flex gap-2 justify-end">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
                confirmTone === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700",
              ].join(" ")}
            >
              {busy ? "Working..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
