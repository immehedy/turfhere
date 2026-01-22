"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type VenueType = "TURF" | "EVENT_SPACE";

function toISODateValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function LandingSearch() {
  const router = useRouter();

  const today = useMemo(() => toISODateValue(new Date()), []);

  const [type, setType] = useState<VenueType>("TURF");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<string>(today); // ✅ default date is today

  function goSearch() {
    const params = new URLSearchParams();
    params.set("type", type);
    if (location.trim()) params.set("location", location.trim());
    if (date) params.set("date", date);

    router.push(`/venues?${params.toString()}`);
  }

  return (
    <div className="w-full">
      {/* ✅ Constrain width on desktop + center the whole group */}
      <div className="w-full sm:max-w-3xl mx-auto">
        {/* ✅ Mobile: 2 columns; Desktop: row layout */}
        <div className="grid grid-cols-2 sm:grid-cols-[1.05fr_1.4fr_1.1fr_auto] gap-2 sm:gap-3 sm:items-center">
          {/* TYPE */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VenueType)}
                className="w-full bg-transparent text-white px-3 py-2.5 text-sm outline-none appearance-none"
              >
                <option value="TURF" className="text-black">
                  Turf
                </option>
                <option value="EVENT_SPACE" className="text-black">
                  Event Space
                </option>
              </select>
            </div>
          </div>

          {/* DATE */}
          <div className="min-w-0">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3 py-2.5">
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* LOCATION (full width on mobile) */}
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g., Dhanmondi)"
                className="w-full bg-transparent text-white placeholder:text-white/70 px-3 py-2.5 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") goSearch();
                }}
              />
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={goSearch}
              aria-label="Search"
              className="
                w-full sm:w-12
                h-11 sm:h-12
                rounded-2xl
                border border-white/25
                bg-white/15
                backdrop-blur-md
                text-white
                inline-flex items-center justify-center
                hover:bg-white/20
                transition
              "
            >
              {/* Mobile: text */}
              <span className="sm:hidden text-sm font-medium">Search</span>

              {/* Desktop: icon */}
              <Search className="hidden sm:block h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
