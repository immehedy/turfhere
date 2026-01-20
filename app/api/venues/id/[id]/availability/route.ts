export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc, BookingDoc } from "@/models/types";
import { buildSlotsForDate, filterSlotsByBookings } from "@/lib/availability";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const db = await getDb();
  const venueId = new ObjectId(id);

  const venue = await db.collection<VenueDoc>(collections.venues).findOne({ _id: venueId, status: "ACTIVE" });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));

  const bookings = await db
    .collection<BookingDoc>(collections.bookings)
    .find({
      venueId,
      start: { $lt: dayEnd },
      end: { $gt: dayStart },
      status: { $in: ["PENDING", "CONFIRMED"] },
    })
    .toArray();

  const dateUTC = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const slots = buildSlotsForDate(venue, dateUTC);
  const free = filterSlotsByBookings(slots, bookings);

  return NextResponse.json({
    date,
    slotDurationMinutes: venue.slotDurationMinutes,
    slots: free.map((s) => ({ startISO: s.start.toISOString(), endISO: s.end.toISOString() })),
  });
}
