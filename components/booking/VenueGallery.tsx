"use client";

import type { Img } from "./bookingTypes";

export default function VenueGallery({
  gallery,
  thumbnailUrl,
  venueName,
}: {
  gallery: Img[];
  thumbnailUrl?: string;
  venueName?: string;
}) {
  if (!gallery.length) return null;

  return (
    <div className="space-y-2">
      {thumbnailUrl ? (
        <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
          <img
            src={thumbnailUrl}
            alt={venueName ? `${venueName} thumbnail` : "thumbnail"}
            className="w-full max-h-[360px] object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      {gallery.length > 1 && (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
          {gallery
            .filter((g) => !g.isThumb)
            .slice(0, 6)
            .map((g) => (
              <a
                key={g.url}
                href={g.url}
                target="_blank"
                rel="noreferrer"
                className="group border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition"
                title="Open image"
              >
                <img
                  src={g.url}
                  alt="venue image"
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
                <div className="px-3 py-2 text-xs text-gray-600 group-hover:text-gray-900 transition">
                  View
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
