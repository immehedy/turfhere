"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { clientFetch } from "@/lib/clientFetch";

import type { Img, Toast, Slot } from "./bookingTypes";
import { normalizePhone, isValidPhone, uniqUrls } from "./bookingUtils";
import { useAvailability } from "./useAvailability";

import ToastStack from "./ToastStack";
import SlotsPanel from "./SlotsPanel";
import VenueGallery from "./VenueGallery";
import VenueDescription from "./VenueDescription";
import GuestBookingFields from "./GuestBookingFields";
import BookingNote from "./BookingNote";

export default function VenueBookingClient({
  venueId,
  slotDurationMinutes,
  thumbnailUrl,
  images,
  venueName,
  description,
  slotsVariant = "default",
}: {
  venueId: string;
  slotDurationMinutes: number;
  thumbnailUrl?: string;
  images?: string[];
  venueName?: string;
  description?: string;
  slotsVariant?: "default" | "compact";
}) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, slots, loading, msg, setMsg, reload } = useAvailability(
    venueId,
    date
  );

  const [note, setNote] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // ✅ selection
  const [selectedStartISO, setSelectedStartISO] = useState<string | null>(null);

  // if server response changed and selected slot vanished => reset
  useMemo(() => {
    if (!selectedStartISO) return;
    const found = (data?.slots ?? []).some((s) => s.startISO === selectedStartISO);
    if (!found) setSelectedStartISO(null);
  }, [data, selectedStartISO]);

  // ✅ toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  function pushToast(t: Omit<Toast, "id">) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: Toast = { id, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }

  const gallery: Img[] = useMemo(() => {
    const all = uniqUrls([thumbnailUrl ?? "", ...(images ?? [])]);
    return all.map((url) => ({ url, isThumb: url === (thumbnailUrl ?? "") }));
  }, [thumbnailUrl, images]);

  const prettyDate = useMemo(() => {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  async function requestBooking(slot: Slot) {
    setMsg(null);

    if (!isAuthed) {
      if (!guestName.trim()) {
        setMsg("Please enter your name.");
        pushToast({
          type: "info",
          title: "Name required",
          description: "Please enter your name to book as guest.",
        });
        return;
      }
      if (!isValidPhone(guestPhone)) {
        setMsg("Please enter a valid phone number.");
        pushToast({
          type: "info",
          title: "Phone required",
          description: "Enter a valid number (01XXXXXXXXX or +8801XXXXXXXXX).",
        });
        return;
      }
    }

    const payload = {
      venueId,
      startISO: slot.startISO,
      endISO: slot.endISO,
      note: note || undefined,
      guestName: isAuthed ? undefined : guestName.trim(),
      guestPhone: isAuthed ? undefined : normalizePhone(guestPhone),
    };

    const res = await clientFetch<{ id: string; status: string }>(
      "/api/bookings",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err =
        typeof res.error === "string" ? res.error : "Booking request failed";
      setMsg(err);
      pushToast({ type: "error", title: "Booking failed", description: err });
      return;
    }

    setNote("");
    pushToast({
      type: "success",
      title: "Booking requested",
      description: `Status: ${res.data.status}. Owner will confirm.`,
    });
    setMsg("Booking requested. Status: PENDING (Owner will confirm).");

    const r = await reload();
    if (!r.ok) {
      pushToast({
        type: "error",
        title: "Could not reload slots",
        description: "Please refresh.",
      });
    }
  }

  return (
    <div className="relative">
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))}
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Slots panel (mobile first, desktop right) */}
        <aside className="lg:col-span-5 order-1 lg:order-2">
          <div className="lg:sticky lg:top-2">
          <SlotsPanel
              variant={slotsVariant}
              date={date}
              setDate={setDate}
              prettyDate={prettyDate}
              slotDurationMinutes={slotDurationMinutes}
              loading={loading}
              slots={slots}
              selectedStartISO={selectedStartISO}
              setSelectedStartISO={setSelectedStartISO}
              onRequestSelected={requestBooking}
              msg={msg}
            />
          </div>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-7 order-2 lg:order-1 space-y-4">
          <VenueGallery
            gallery={gallery}
            thumbnailUrl={thumbnailUrl}
            venueName={venueName}
          />

          <VenueDescription
            description={description}
            expanded={descExpanded}
            setExpanded={setDescExpanded}
          />

          {!isAuthed && (
            <GuestBookingFields
              guestName={guestName}
              setGuestName={setGuestName}
              guestPhone={guestPhone}
              setGuestPhone={setGuestPhone}
            />
          )}

          <BookingNote note={note} setNote={setNote} isAuthed={isAuthed} />

          {isAuthed ? (
            <p className="text-sm text-gray-600">
              You’re signed in. Your request will be <b>confirmed by Owner</b>.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Booking requests are reviewed by the <b>Owner</b>. You can sign in
              anytime for faster management.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
