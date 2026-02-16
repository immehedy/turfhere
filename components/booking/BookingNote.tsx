"use client";

export default function BookingNote({
  note,
  setNote,
  isAuthed,
}: {
  note: string;
  setNote: (v: string) => void;
  isAuthed: boolean;
}) {
  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-sm text-gray-700">Note (optional)</label>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. team name / details"
          />
        </div>
        <div className="text-sm text-gray-600">
          You’re {isAuthed ? "signed in" : "booking as guest"}.
        </div>
      </div>
    </div>
  );
}
