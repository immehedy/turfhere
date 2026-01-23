"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import VenueDetailsCard from "@/components/venue/VenueDetailsCard";
import OpeningHoursCard from "@/components/venue/OpeningHoursCard";
import LocationCard from "@/components/venue/LocationCard";
import ImagesCard from "@/components/venue/ImagesCard";

import { days, OpeningHours, UploadedImage, VenueType, Weekday } from "@/components/venue/venueTypes";
import { defaultOpeningHours, slugify } from "@/components/venue/venueHelpers";

export default function OwnerCreateVenuePage() {
  const router = useRouter();

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

  // ---- images
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const thumbnailUrl = useMemo(
    () => images[thumbnailIndex]?.url ?? "",
    [images, thumbnailIndex]
  );

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ---- derived
  const allClosed = useMemo(
    () => days.every((d) => !!openingHours[d]?.closed),
    [openingHours]
  );

  // ✅ Auto slug from name until user edits slug manually
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  // ---- helpers
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
      const shouldClose = !allClosed; // if not all closed -> close all, else open all
      days.forEach((d) => {
        next[d] = { ...next[d], closed: shouldClose };
      });
      return next;
    });
  };

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadMsg(null);
    setErr(null);
    setUploading(true);

    try {
      for (const file of files) {
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
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Create a venue
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Fill details, upload photos, and set weekly hours.
            </p>
          </div>

          <button
            disabled={loading || uploading}
            form="create-venue-form"
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create venue"}
          </button>
        </div>

        <form
          id="create-venue-form"
          onSubmit={onSubmit}
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

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
          </div>
        </form>

        {/* bottom action (mobile friendly) */}
        <div className="mt-6 lg:hidden">
          <button
            disabled={loading || uploading}
            form="create-venue-form"
            type="submit"
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create venue"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
