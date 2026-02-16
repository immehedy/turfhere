"use client";

export default function GuestBookingFields({
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
}: {
  guestName: string;
  setGuestName: (v: string) => void;
  guestPhone: string;
  setGuestPhone: (v: string) => void;
}) {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Book as guest</h3>
          <p className="text-sm text-gray-600 mt-1">
            No account needed. Provide your name & phone so the owner can
            contact you.
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">
          Guest
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm text-gray-700">Your name</label>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Mehedy Hassan"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700">Phone number</label>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="e.g. 01XXXXXXXXX"
            inputMode="tel"
            autoComplete="tel"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used only for booking communication.
          </p>
        </div>
      </div>
    </div>
  );
}
