"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const days: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function defaultOpeningHours() {
  const base = { open: "10:00", close: "22:00", closed: false };
  return Object.fromEntries(days.map((d) => [d, { ...base }])) as any;
}

export default function OwnerCreateVenuePage() {
  const router = useRouter();

  const [type, setType] = useState<"TURF" | "EVENT_SPACE">("TURF");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [openingHours, setOpeningHours] = useState<any>(defaultOpeningHours());

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setDay(d: Weekday, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    setOpeningHours((prev: any) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await clientFetch<{ id: string; slug: string }>("/api/venues", {
      method: "POST",
      body: JSON.stringify({
        type,
        name,
        slug,
        description: description || undefined,
        city: city || undefined,
        area: area || undefined,
        address: address || undefined,
        slotDurationMinutes,
        openingHours,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : "Failed to create venue");
      return;
    }

    router.push(`/v/${res.data.slug}`);
  }

  return (
    <PageShell>
      <h1 className="text-xl font-semibold">Create a venue</h1>
      <p className="text-gray-600 mt-1">This creates a public venue page users can book from.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Type</label>
            <select className="mt-1 w-full border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="TURF">Turf</option>
              <option value="EVENT_SPACE">Event Space</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Slot duration (minutes)</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="number"
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
              min={15}
              max={240}
              required
            />
          </div>

          <div>
            <label className="text-sm">Name</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm">Slug (unique)</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. gulshan-turf-1"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm">Description</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">City</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Area</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Address</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">Opening hours (weekly)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Times are in HH:MM format (simple MVP).
          </p>

          <div className="mt-3 space-y-2">
            {days.map((d) => (
              <div key={d} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center border-b pb-2">
                <div className="font-medium">{d}</div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!openingHours[d]?.closed}
                    onChange={(e) => setDay(d, { closed: e.target.checked })}
                  />
                  Closed
                </label>

                <div>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={openingHours[d]?.open ?? "10:00"}
                    onChange={(e) => setDay(d, { open: e.target.value })}
                    disabled={openingHours[d]?.closed}
                  />
                </div>

                <div>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={openingHours[d]?.close ?? "22:00"}
                    onChange={(e) => setDay(d, { close: e.target.value })}
                    disabled={openingHours[d]?.closed}
                  />
                </div>

                <div className="text-xs text-gray-600">open → close</div>
              </div>
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button disabled={loading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {loading ? "Creating…" : "Create venue"}
        </button>
      </form>
    </PageShell>
  );
}
