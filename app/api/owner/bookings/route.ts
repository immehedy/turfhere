import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import type { BookingDoc, VenueDoc } from "@/models/types";

export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const ownerId = new ObjectId(userId);

  const venues = await db.collection<VenueDoc>(collections.venues).find({ ownerId }).toArray();
  const venueIds = venues.map((v) => v._id);

  const bookings = await db
    .collection<BookingDoc>(collections.bookings)
    .find({ venueId: { $in: venueIds } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    venues: venues.map((v) => ({ id: v._id.toString(), name: v.name, slug: v.slug })),
    bookings: bookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      venueId: b.venueId.toString(),
      userId: b.userId.toString(),
    })),
  });
}
