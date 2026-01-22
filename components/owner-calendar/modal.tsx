"use client";

import React from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4">
        <div
          className={[
            "w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden",
            "h-[78vh] sm:h-[74vh] max-h-[74vh]",
            "flex flex-col",
          ].join(" ")}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{title}</div>
              <div className="text-xs text-gray-500 mt-0.5">Scroll to view more</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
