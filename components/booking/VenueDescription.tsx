"use client";

import { splitDescription } from "./bookingUtils";

export default function VenueDescription({
  description,
  expanded,
  setExpanded,
}: {
  description?: string;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}) {
  if (!description) return null;

  const { lines, looksLikeList } = splitDescription(description);
  const displayLines = expanded ? lines : lines.slice(0, 6);
  const hasMore = lines.length > 6;

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">About this venue</h3>
          <p className="text-sm text-gray-500 mt-1">Details, rules, and notes</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      </div>

      <div className="mt-3 text-gray-700 text-sm leading-relaxed">
        {looksLikeList ? (
          <ul className="list-disc pl-5 space-y-1">
            {displayLines.map((l, idx) => (
              <li key={idx}>{l.replace(/^[-•]\s*/, "")}</li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            {displayLines.map((l, idx) => (
              <p key={idx}>{l}</p>
            ))}
          </div>
        )}

        {!expanded && hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-sm font-medium text-black hover:underline"
          >
            Continue reading →
          </button>
        ) : null}
      </div>
    </div>
  );
}
