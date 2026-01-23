"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientFetch } from "@/lib/clientFetch";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

import VenueDetailsCard from "@/components/venue/VenueDetailsCard";
import OpeningHoursCard from "@/components/venue/OpeningHoursCard";
import LocationCard from "@/components/venue/LocationCard";
import ImagesCard from "@/components/venue/ImagesCard";

import { days, OpeningHours, UploadedImage, VenueType, Weekday } from "@/components/venue/venueTypes";
import { defaultOpeningHours, slugify } from "@/components/venue/venueHelpers";

type Venue = {
  _id: string;
  name: string;
  slug: string;
  type: VenueType;
  description?: string;
  city?: string;
  area?: string;
  address?: string;
  slotDurationMinutes: number;
  openingHours: OpeningHours;
  thumbnailUrl: string;
  images: string[];
};

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

  // ---- form state
  const [type, setType] = useState<VenueType>("TURF");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [description, setDescription] = useState("");

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");

  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultOpeningHours());

  // ---- images (keep the same data shape as create page cards)
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const thumbnailUrl = useMemo(
    () => images[thumbnailIndex]?.url ?? "",
    [images, thumbnailIndex]
  );

  const allClosed = useMemo(
    () => days.every((d) => !!openingHours[d]?.closed),
    [openingHours]
  );

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // ✅ Auto slug from name until user edits slug manually
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  const resetSlug = () => {
    setSlugTouched(false);
    setSlug(slugify(name));
  };

  const setDay = (
    d: Weekday,
    patch: Partial<{ open: string; close: string; closed: boolean }>
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [d]: { ...prev[d], ...patch },
    }));
  };

  const toggleAllClosed = () => {
    setOpeningHours((prev) => {
      const next = { ...prev };
      const shouldClose = !allClosed;
      days.forEach((d) => {
        next[d] = { ...next[d], closed: shouldClose };
      });
      return next;
    });
  };

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
    setSlugTouched(true); // ✅ existing slug is a "manual" value until user hits reset
    setDescription(v.description ?? "");

    setCity(v.city ?? "");
    setArea(v.area ?? "");
    setAddress(v.address ?? "");

    setSlotDurationMinutes(v.slotDurationMinutes);
    setOpeningHours(v.openingHours ?? defaultOpeningHours());

    // Convert backend urls -> UploadedImage[]
    const merged = uniqUrls([v.thumbnailUrl, ...(v.images ?? [])]);
    const mapped: UploadedImage[] = merged.map((url, idx) => ({
      url,
      publicId: `existing-${idx}`, // stable client key; Cloudinary publicId not available for old items
    }));

    setImages(mapped);

    const thumbIdx = Math.max(
      0,
      mapped.findIndex((x) => x.url === v.thumbnailUrl)
    );
    setThumbnailIndex(thumbIdx === -1 ? 0 : thumbIdx);

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
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`Image too large: ${file.name} (max 8MB)`);
        }

        setUploadMsg(`Uploading ${file.name}…`);
        const r = await uploadToCloudinary(file);

        setImages((prev) => {
          const nextUrls = uniqUrls([...prev.map((x) => x.url), r.secure_url]);
          const next: UploadedImage[] = nextUrls.map((url) => {
            const found = prev.find((p) => p.url === url);
            if (found) return found;
            // new upload has a real publicId
            if (url === r.secure_url) return { url, publicId: r.public_id };
            // fallback key
            return { url, publicId: `existing-${url}` };
          });

          // if user had no images, make first upload thumbnail
          if (prev.length === 0) setThumbnailIndex(0);

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

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setThumbnailIndex((prevIdx) => {
      if (i === prevIdx) return 0;
      if (i < prevIdx) return prevIdx - 1;
      return prevIdx;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (images.length === 0) {
      setErr("Please upload at least 1 image (thumbnail required).");
      return;
    }
    if (!thumbnailUrl) {
      setErr("Please select a thumbnail image.");
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
        images: images.map((x) => x.url), // ✅ matches create page behavior
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setErr(typeof res.error === "string" ? res.error : "Failed to save venue");
      return;
    }

    setMsg("Saved successfully.");
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
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Edit venue
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update details, images, and weekly hours.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-sm font-medium shadow-sm hover:bg-gray-50"
              href="/owner"
            >
              Back
            </Link>

            {slug && (
              <Link
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-sm font-medium shadow-sm hover:bg-gray-50"
                href={`/v/${slug}`}
                target="_blank"
              >
                View public
              </Link>
            )}

            <button
              disabled={saving || uploading}
              form="edit-venue-form"
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {(err || msg) && (
          <div className="mt-4 space-y-2">
            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {msg}
              </div>
            )}
          </div>
        )}

        <form
          id="edit-venue-form"
          onSubmit={onSave}
          className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start"
        >
          {/* LEFT column (desktop) */}
          <div className="grid gap-6 lg:col-span-8">
            <VenueDetailsCard
              type={type}
              setType={setType}
              slotDurationMinutes={slotDurationMinutes}
              setSlotDurationMinutes={setSlotDurationMinutes}
              name={name}
              setName={setName}
              slug={slug}
              setSlug={setSlug}
              slugTouched={slugTouched}
              setSlugTouched={setSlugTouched}
              resetSlug={resetSlug}
              description={description}
              setDescription={setDescription}
            />

            <OpeningHoursCard
              openingHours={openingHours}
              allClosed={allClosed}
              toggleAllClosed={toggleAllClosed}
              setDay={setDay}
            />
          </div>

          {/* RIGHT column (desktop) */}
          <div className="grid gap-6 lg:col-span-4 lg:self-start lg:sticky lg:top-6">
            <LocationCard
              city={city}
              setCity={setCity}
              area={area}
              setArea={setArea}
              address={address}
              setAddress={setAddress}
            />

            <ImagesCard
              images={images}
              thumbnailIndex={thumbnailIndex}
              setThumbnailIndex={setThumbnailIndex}
              uploading={uploading}
              uploadMsg={uploadMsg}
              onPickFiles={onPickFiles}
              removeImage={removeImage}
              thumbnailUrl={thumbnailUrl}
            />
          </div>
        </form>

        {/* bottom action (mobile friendly) */}
        <div className="mt-6 lg:hidden">
          <button
            disabled={saving || uploading}
            form="edit-venue-form"
            type="submit"
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
