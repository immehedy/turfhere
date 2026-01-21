"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const days: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function defaultOpeningHours() {
  const base = { open: "10:00", close: "22:00", closed: false };
  return Object.fromEntries(days.map((d) => [d, { ...base }])) as any;
}

type UploadedImage = {
  url: string;
  publicId: string;
};

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

  // ✅ Cloudinary images
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const thumbnailUrl = useMemo(() => images[thumbnailIndex]?.url ?? "", [images, thumbnailIndex]);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setDay(d: Weekday, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    setOpeningHours((prev: any) => ({ ...prev, [d]: { ...prev[d], ...patch } }));
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadMsg(null);
    setErr(null);
    setUploading(true);

    try {
      for (const file of files) {
        // basic client checks (optional)
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`Image too large: ${file.name} (max 8MB)`);
        }

        setUploadMsg(`Uploading ${file.name}…`);
        const result = await uploadToCloudinary(file);

        setImages((prev) => [
          ...prev,
          { url: result.secure_url, publicId: result.public_id },
        ]);
      }

      setUploadMsg("Upload complete.");
    } catch (e: any) {
      setUploadMsg(null);
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      // reset input so selecting same file again triggers change
      e.target.value = "";
    }
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setThumbnailIndex((prev) => {
      if (i === prev) return 0;
      if (i < prev) return prev - 1;
      return prev;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setUploadMsg(null);

    if (images.length === 0) {
      setErr("Please upload at least 1 image (thumbnail required).");
      return;
    }
    if (!thumbnailUrl) {
      setErr("Please select a thumbnail image.");
      return;
    }

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

        thumbnailUrl,
        images: images.map((x) => x.url),
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
            <input className="mt-1 w-full border rounded px-3 py-2" type="number" value={slotDurationMinutes} onChange={(e) => setSlotDurationMinutes(Number(e.target.value))} min={15} max={240} required />
          </div>

          <div>
            <label className="text-sm">Name</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm">Slug (unique)</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. gulshan-turf-1" required />
          </div>
        </div>

        <div>
          <label className="text-sm">Description</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {/* ✅ Cloudinary images */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Images</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload multiple images. Select one as thumbnail.
              </p>
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

          {images.length === 0 ? (
            <p className="text-sm text-gray-600">No images uploaded yet.</p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img, i) => (
                <div key={img.publicId} className="border rounded-lg overflow-hidden">
                  <div className="relative">
                    <img src={img.url} alt="uploaded" className="w-full h-28 object-cover" />
                  </div>

                  <div className="p-2 flex items-center justify-between gap-2">
                    <label className="text-xs flex items-center gap-2">
                      <input
                        type="radio"
                        name="thumbnail"
                        checked={thumbnailIndex === i}
                        onChange={() => setThumbnailIndex(i)}
                      />
                      Thumbnail
                    </label>

                    <button
                      type="button"
                      className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
                      onClick={() => removeImage(i)}
                      disabled={uploading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <p className="text-xs text-gray-500">
              Thumbnail URL saved as: <span className="font-mono">{thumbnailUrl}</span>
            </p>
          )}
        </div>

        {/* Opening hours */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold">Opening hours (weekly)</h2>
          <p className="text-sm text-gray-600 mt-1">Times are in HH:MM format (simple MVP).</p>

          <div className="mt-3 space-y-2">
            {days.map((d) => (
              <div key={d} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center border-b pb-2">
                <div className="font-medium">{d}</div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!openingHours[d]?.closed} onChange={(e) => setDay(d, { closed: e.target.checked })} />
                  Closed
                </label>

                <input className="w-full border rounded px-3 py-2" value={openingHours[d]?.open ?? "10:00"} onChange={(e) => setDay(d, { open: e.target.value })} disabled={openingHours[d]?.closed} />
                <input className="w-full border rounded px-3 py-2" value={openingHours[d]?.close ?? "22:00"} onChange={(e) => setDay(d, { close: e.target.value })} disabled={openingHours[d]?.closed} />

                <div className="text-xs text-gray-600">open → close</div>
              </div>
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button disabled={loading || uploading} className="rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {loading ? "Creating…" : "Create venue"}
        </button>
      </form>
    </PageShell>
  );
}
