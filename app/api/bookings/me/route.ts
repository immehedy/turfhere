export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { BookingDoc, VenueDoc } from "@/models/types";

export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();

  const bookings = await db
    .collection<BookingDoc>(collections.bookings)
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  const venueIds = Array.from(new Set(bookings.map((b) => b.venueId.toString()))).map((id) => new ObjectId(id));
  const venues = await db.collection<VenueDoc>(collections.venues).find({ _id: { $in: venueIds } }).toArray();
  const map = new Map(venues.map((v) => [v._id.toString(), v]));

  return NextResponse.json({
    bookings: bookings.map((b) => {
      const v = map.get(b.venueId.toString());
      return {
        _id: b._id.toString(),
        venueId: b.venueId.toString(),
        venueSlug: v?.slug ?? "",
        venueName: v?.name ?? "Venue",
        start: b.start.toISOString(),
        end: b.end.toISOString(),
        status: b.status,
        ownerDecision: b.ownerDecision,
        adminNote: b.adminNote,
      };
    }),
  });
}
