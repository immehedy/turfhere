"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const days: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Time12 = { hour: number; minute: number; ampm: "AM" | "PM" };
const pad2 = (n: number) => String(n).padStart(2, "0");

function parse24To12(hhmm: string): Time12 {
  const [hStr, mStr] = (hhmm || "10:00").split(":");
  const h24 = Math.min(23, Math.max(0, Number(hStr)));
  const minute = Math.min(59, Math.max(0, Number(mStr)));

  const ampm: Time12["ampm"] = h24 >= 12 ? "PM" : "AM";
  const h12raw = h24 % 12;
  const hour = h12raw === 0 ? 12 : h12raw;

  return { hour, minute, ampm };
}

function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onCheckedChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border shadow-sm transition",
        checked ? "bg-black border-black" : "bg-white border-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function to24From12(t: Time12): string {
  let h = t.hour % 12;
  if (t.ampm === "PM") h += 12;
  if (t.ampm === "AM" && t.hour === 12) h = 0;
  return `${pad2(h)}:${pad2(t.minute)}`;
}

function TimePicker12({
  value24,
  onChange24,
  disabled,
  minuteStep = 15,
}: {
  value24: string;
  onChange24: (next: string) => void;
  disabled?: boolean;
  minuteStep?: 5 | 10 | 15 | 30;
}) {
  const t = parse24To12(value24);
  const minutes = Array.from(
    { length: 60 / minuteStep },
    (_, i) => i * minuteStep
  );
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  const setPatch = (patch: Partial<Time12>) => {
    const next: Time12 = { ...t, ...patch };
    onChange24(to24From12(next));
  };

  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-60")}>
      {/* Watch-like selects (nice on mobile too) */}
      <select
        className="h-11 w-[86px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.hour}
        onChange={(e) => setPatch({ hour: Number(e.target.value) })}
        disabled={disabled}>
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-gray-400">:</span>

      <select
        className="h-11 w-[92px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.minute}
        onChange={(e) => setPatch({ minute: Number(e.target.value) })}
        disabled={disabled}>
        {minutes.map((m) => (
          <option key={m} value={m}>
            {pad2(m)}
          </option>
        ))}
      </select>

      <select
        className="h-11 w-[86px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.ampm}
        onChange={(e) => setPatch({ ampm: e.target.value as "AM" | "PM" })}
        disabled={disabled}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function defaultOpeningHours() {
  const base = { open: "10:00", close: "22:00", closed: false };
  return Object.fromEntries(days.map((d) => [d, { ...base }])) as any;
}

type UploadedImage = {
  url: string;
  publicId: string;
};

/** ---------- UI helpers (no deps) ---------- */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkdownLite(md: string) {
  // escape first so user can't inject HTML
  let s = escapeHtml(md);

  // headings
  s = s.replace(
    /^###\s(.+)$/gim,
    "<h3 class='mt-3 text-base font-semibold'>$1</h3>"
  );
  s = s.replace(
    /^##\s(.+)$/gim,
    "<h2 class='mt-4 text-lg font-semibold'>$1</h2>"
  );
  s = s.replace(
    /^#\s(.+)$/gim,
    "<h1 class='mt-4 text-xl font-semibold'>$1</h1>"
  );

  // bold/italic/code
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(
    /`(.+?)`/g,
    "<code class='rounded bg-gray-100 px-1 py-0.5'>$1</code>"
  );

  // unordered lists (- item)
  s = s.replace(/^\-\s(.+)$/gim, "<li>$1</li>");
  s = s.replace(
    /(<li>.*<\/li>\s*)+/gim,
    (m) => `<ul class="list-disc pl-5 mt-2 space-y-1">${m}</ul>`
  );

  // line breaks
  s = s.replace(/\n/g, "<br />");

  return s;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function Card({
  title,
  subtitle,
  icon,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 rounded-xl border border-gray-200 bg-gray-50 p-2">
              {icon}
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {right}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

/** tiny inline icons */
const Icon = {
  Plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Photo: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7a2 2 0 0 1 2-2h3l2 2h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 14l2-2 3 3 2-2 3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 17v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Pin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Help: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 18h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.3-1.5 1.1-1.5 2.0V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Tag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 13l-7 7-11-11V2h7l11 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 7.5h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  Building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 21V3h16v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V9h6v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 6h.01M12 6h.01M16 6h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  Sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 9h10v10H9V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function OwnerCreateVenuePage() {
  const router = useRouter();

  const [type, setType] = useState<"TURF" | "EVENT_SPACE">("TURF");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [description, setDescription] = useState("");
  const [descMode, setDescMode] = useState<"write" | "preview">("write");

  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);
  const [openingHours, setOpeningHours] = useState<any>(defaultOpeningHours());

  // ✅ Cloudinary images
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

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Auto slug from name until user edits slug manually
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  function setDay(
    d: Weekday,
    patch: Partial<{ open: string; close: string; closed: boolean }>
  ) {
    setOpeningHours((prev: any) => ({
      ...prev,
      [d]: { ...prev[d], ...patch },
    }));
  }

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
      setErr(
        typeof res.error === "string" ? res.error : "Failed to create venue"
      );
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
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white shadow-sm disabled:opacity-50">
            {loading ? "Creating…" : "Create venue"}
          </button>
        </div>

        <form
          id="create-venue-form"
          onSubmit={onSubmit}
          className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* LEFT column (desktop) */}
          <div className="grid gap-6 lg:col-span-8">
            <Card
              title="Venue details"
              subtitle="Core info shown to customers."
              icon={Icon.Info}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type">
                  <select
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}>
                    <option value="TURF">Turf</option>
                    <option value="EVENT_SPACE">Event Space</option>
                  </select>
                </Field>

                <Field label="Slot duration (minutes)" hint="15–240">
                  <input
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm"
                    type="number"
                    value={slotDurationMinutes}
                    onChange={(e) =>
                      setSlotDurationMinutes(Number(e.target.value))
                    }
                    min={15}
                    max={240}
                    required
                  />
                </Field>

                <Field label="Name" hint="Required">
                  <input
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gulshan Turf Arena"
                    required
                  />
                </Field>

                <Field
                  label="Slug (unique)"
                  hint={slugTouched ? "Custom" : "Auto"}>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm font-mono"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(slugify(e.target.value));
                      }}
                      placeholder="auto from name"
                      required
                    />
                    {slugTouched && (
                      <button
                        type="button"
                        className="h-11 shrink-0 rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm hover:bg-gray-50"
                        onClick={() => {
                          setSlugTouched(false);
                          setSlug(slugify(name));
                        }}>
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Preview:{" "}
                    <span className="font-mono">/v/{slug || "..."}</span>
                  </p>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Description" hint="Markdown supported">
                    <div className="mt-1">
                      <textarea
                        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm shadow-sm"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={`Short summary of the venue...
- Supports Markdown (saved as text)
- Example: **bold**, *italic*, # heading
`}
                      />
                      <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                          {Icon.Help}
                        </span>
                        Markdown is saved as plain text. Rendering happens on
                        the venue page.
                      </p>
                    </div>
                  </Field>
                </div>
              </div>
            </Card>

            <Card
              title="Opening hours"
              subtitle="Pick open & close time in 12-hour format (AM/PM)."
              icon={Icon.Clock}
              right={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
                  onClick={() => {
                    setOpeningHours((prev: any) => {
                      const next = { ...prev };
                      const shouldClose = !allClosed; // if not all closed -> close all, else open all
                      days.forEach(
                        (d) => (next[d] = { ...next[d], closed: shouldClose })
                      );
                      return next;
                    });
                  }}>
                  <span className="text-gray-700">
                    {allClosed ? Icon.Sun : Icon.Moon}
                  </span>
                  {allClosed ? "Open all" : "Close all"}
                </button>
              }>
              {/* Header row (desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-1 pb-2 text-xs font-medium text-gray-500">
                <div className="col-span-1">Day</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-4">Open</div>
                <div className="col-span-4">Close</div>
              </div>

              <div className="space-y-2">
                {days.map((d) => {
                  const closed = !!openingHours[d]?.closed;

                  return (
                    <div
                      key={d}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                      {/* Day */}
                      <div className="sm:col-span-1 flex items-center">
                        <div className="font-semibold text-gray-900">{d}</div>
                      </div>

                      {/* Status (compact) */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-start sm:gap-3">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-gray-700">
                            {closed ? Icon.Moon : Icon.Sun}
                          </span>
                          <span className="text-sm text-gray-800">
                            {closed ? "Closed" : "Open"}
                          </span>
                        </div>

                        <Switch
                          checked={closed}
                          onCheckedChange={(v) => setDay(d, { closed: v })}
                          label={`${d} closed`}
                        />
                      </div>

                      {/* Open */}
                      <div className="sm:col-span-4">
                        <div className="sm:hidden mb-1 text-xs font-medium text-gray-500">
                          Open
                        </div>
                        <TimePicker12
                          value24={openingHours[d]?.open ?? "10:00"}
                          onChange24={(next) => setDay(d, { open: next })}
                          disabled={closed}
                          minuteStep={15}
                        />
                      </div>

                      {/* Close */}
                      <div className="sm:col-span-4">
                        <div className="sm:hidden mb-1 text-xs font-medium text-gray-500">
                          Close
                        </div>
                        <TimePicker12
                          value24={openingHours[d]?.close ?? "22:00"}
                          onChange24={(next) => setDay(d, { close: next })}
                          disabled={closed}
                          minuteStep={15}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Display is 12-hour (AM/PM). Saved internally as{" "}
                <span className="font-mono">HH:MM</span>.
              </p>
            </Card>
          </div>

          {/* RIGHT column (desktop) */}
          <div className="grid gap-6 lg:col-span-4 lg:self-start lg:sticky lg:top-6">
            <Card
              title="Location"
              subtitle="Helps users find you."
              icon={Icon.Pin}>
              <div className="grid gap-4">
                <Field label="City">
                  <input
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dhaka"
                  />
                </Field>

                <Field label="Area">
                  <input
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Gulshan"
                  />
                </Field>

                <Field label="Address">
                  <input
                    className="mt-1 h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm shadow-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street / building / landmark"
                  />
                </Field>
              </div>
            </Card>

            <Card
              title="Images"
              subtitle="Upload multiple images and select a thumbnail."
              icon={Icon.Photo}
              right={
                <label
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm shadow-sm cursor-pointer",
                    uploading ? "opacity-60" : "hover:bg-gray-50"
                  )}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickFiles}
                    disabled={uploading}
                  />
                  <span className="mr-2">{Icon.Plus}</span>
                  {uploading ? "Uploading…" : "Upload"}
                </label>
              }>
              {uploadMsg && (
                <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {uploadMsg}
                </div>
              )}

              {images.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600">
                  No images uploaded yet.
                  <div className="mt-2 text-xs text-gray-500">
                    Add at least one image to create the venue.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={img.publicId}
                      className={cn(
                        "overflow-hidden rounded-2xl border bg-white shadow-sm",
                        thumbnailIndex === i
                          ? "border-gray-900 ring-2 ring-gray-900"
                          : "border-gray-200"
                      )}>
                      <img
                        src={img.url}
                        alt="uploaded"
                        className="h-28 w-full object-cover"
                      />

                      <div className="p-2 space-y-2">
                        <label className="text-xs flex items-center gap-2 text-gray-700">
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
                          className="w-full rounded-xl border border-gray-200 px-2 py-1.5 text-xs hover:bg-gray-50"
                          onClick={() => removeImage(i)}
                          disabled={uploading}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Thumbnail URL:{" "}
                  <span className="font-mono">{thumbnailUrl}</span>
                </p>
              )}
            </Card>

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
          </div>
        </form>

        {/* bottom action (mobile friendly if you want it) */}
        <div className="mt-6 lg:hidden">
          <button
            disabled={loading || uploading}
            form="create-venue-form"
            type="submit"
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white shadow-sm disabled:opacity-50">
            {loading ? "Creating…" : "Create venue"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
