"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientFetch } from "@/lib/clientFetch";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const days: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Venue = {
  _id: string;
  name: string;
  slug: string;
  type: "TURF" | "EVENT_SPACE";
  description?: string;
  city?: string;
  area?: string;
  address?: string;
  slotDurationMinutes: number;
  openingHours: Record<Weekday, { open: string; close: string; closed: boolean }>;
  thumbnailUrl: string;
  images: string[];
};

type UploadedImage = { url: string; publicId: string };

function uniqUrls(urls: string[]) {
  return Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean)));
}

export default function OwnerEditVenuePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const venueId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // form state
  const [type, setType] = useState<"TURF" | "EVENT_SPACE">("TURF");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [openingHours, setOpeningHours] = useState<Venue["openingHours"]>({
    SUN: { open: "10:00", close: "22:00", closed: false },
    MON: { open: "10:00", close: "22:00", closed: false },
    TUE: { open: "10:00", close: "22:00", closed: false },
    WED: { open: "10:00", close: "22:00", closed: false },
    THU: { open: "10:00", close: "22:00", closed: false },
    FRI: { open: "10:00", close: "22:00", closed: false },
    SAT: { open: "10:00", close: "22:00", closed: false },
  });

  // images state
  const [images, setImages] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const gallery = useMemo(() => uniqUrls([thumbnailUrl, ...images]), [thumbnailUrl, images]);

  function setDay(d: Weekday, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    setOpeningHours((prev) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  async function load() {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const res = await clientFetch<{ venue: Venue }>(`/api/owner/venues/${venueId}`);
    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : "Failed to load venue");
      setLoading(false);
      return;
    }

    const v = res.data.venue;
    setType(v.type);
    setName(v.name);
    setSlug(v.slug);
    setDescription(v.description ?? "");
    setCity(v.city ?? "");
    setArea(v.area ?? "");
    setAddress(v.address ?? "");
    setSlotDurationMinutes(v.slotDurationMinutes);
    setOpeningHours(v.openingHours);
    setThumbnailUrl(v.thumbnailUrl);
    setImages(v.images ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setErr(null);
    setUploadMsg(null);
    setUploading(true);

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) throw new Error(`Image too large: ${file.name} (max 8MB)`);

        setUploadMsg(`Uploading ${file.name}…`);
        const r = await uploadToCloudinary(file);

        setImages((prev) => {
          const next = uniqUrls([...prev, r.secure_url]);
          // if no thumbnail set yet, set first upload as thumb
          if (!thumbnailUrl) setThumbnailUrl(r.secure_url);
          return next;
        });
      }
      setUploadMsg("Upload complete.");
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
    if (thumbnailUrl === url) {
      const remaining = images.filter((u) => u !== url);
      setThumbnailUrl(remaining[0] ?? "");
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const all = uniqUrls([thumbnailUrl, ...images]);
    if (!thumbnailUrl) {
      setErr("Please select a thumbnail image.");
      return;
    }
    if (!all.includes(thumbnailUrl)) {
      setErr("Thumbnail must be included in images.");
      return;
    }

    setSaving(true);

    const res = await clientFetch<{ ok: true; slug: string }>(`/api/owner/venues/${venueId}`, {
      method: "PATCH",
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
        thumbnailUrl,
        images: all,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : "Failed to save venue");
      return;
    }

    setMsg("Saved successfully.");
    // if slug changed, public page changes
    router.refresh();
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-gray-600">Loading…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Edit venue</h1>
          <p className="text-sm text-gray-600 mt-1">Update details, images, and availability rules.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner">
            Back
          </Link>
          {slug && (
            <Link className="rounded border px-4 py-2 hover:bg-gray-50" href={`/v/${slug}`} target="_blank">
              View public
            </Link>
          )}
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}

      <form onSubmit={onSave} className="mt-4 space-y-4 max-w-4xl">
        {/* Basic fields */}
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
            <label className="text-sm">Slug</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} required />
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

        {/* Images */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Images</h2>
              <p className="text-sm text-gray-600 mt-1">Upload new images and pick the thumbnail.</p>
            </div>

            <label className="rounded border px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
                disabled={uploading}
              />
              {uploading ? "Uploading…" : "Upload images"}
            </label>
          </div>

          {uploadMsg && <p className="text-sm text-gray-700">{uploadMsg}</p>}

          {gallery.length === 0 ? (
            <p className="text-sm text-gray-600">No images yet. Upload at least 1 image.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((url) => (
                <div key={url} className="border rounded-lg overflow-hidden">
                  <img src={url} alt="venue" className="w-full h-28 object-cover" />

                  <div className="p-2 flex items-center justify-between gap-2">
                    <label className="text-xs flex items-center gap-2">
                      <input
                        type="radio"
                        name="thumbnail"
                        checked={thumbnailUrl === url}
                        onChange={() => setThumbnailUrl(url)}
                      />
                      Thumbnail
                    </label>

                    <button
                      type="button"
                      className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
                      onClick={() => removeImage(url)}
                      disabled={uploading}
                      title="Remove image"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {thumbnailUrl && (
            <p className="text-xs text-gray-500">
              Current thumbnail: <span className="font-mono break-all">{thumbnailUrl}</span>
            </p>
          )}
        </div>

        {/* Opening hours */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">Opening hours (weekly)</h2>
          <p className="text-sm text-gray-600 mt-1">Times are in HH:MM format.</p>

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

                <input
                  className="w-full border rounded px-3 py-2"
                  value={openingHours[d]?.open ?? "10:00"}
                  onChange={(e) => setDay(d, { open: e.target.value })}
                  disabled={openingHours[d]?.closed}
                />

                <input
                  className="w-full border rounded px-3 py-2"
                  value={openingHours[d]?.close ?? "22:00"}
                  onChange={(e) => setDay(d, { close: e.target.value })}
                  disabled={openingHours[d]?.closed}
                />

                <div className="text-xs text-gray-600">open → close</div>
              </div>
            ))}
          </div>
        </div>

        <button disabled={saving || uploading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </PageShell>
  );
}
