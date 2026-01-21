export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb, collections } from "@/lib/db";
import type { BookingDoc, VenueDoc } from "@/models/types";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  // OWNER: only their venues
  // ADMIN: can see all (optional, keep same endpoint)
  let ownerObjectId: ObjectId | null = null;
  if (role !== "ADMIN") ownerObjectId = new ObjectId(userId);

  // Load venues for owner (or all if admin)
  const venues = await db
    .collection<VenueDoc>(collections.venues)
    .find(ownerObjectId ? { ownerId: ownerObjectId } : {})
    .project({ name: 1, slug: 1 })
    .sort({ createdAt: -1 })
    .toArray();

  const venueIds = venues.map((v) => v._id);

  // If owner has no venues, return empty
  if (role !== "ADMIN" && venueIds.length === 0) {
    return NextResponse.json({
      venues: [],
      bookings: [],
    });
  }

  // Load bookings
  const bookings = await db
    .collection<BookingDoc>(collections.bookings)
    .find(role === "ADMIN" ? {} : { venueId: { $in: venueIds } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    venues: venues.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      slug: v.slug,
    })),
    bookings: bookings.map((b) => ({
      _id: b._id.toString(),
      venueId: b.venueId.toString(),
      userId: b.userId ? b.userId.toString() : null,
      guest: b.guest ?? null,
      userSnapshot: b.userSnapshot ?? null,
      start: b.start.toISOString(),
      end: b.end.toISOString(),
      status: b.status,
      ownerDecision: b.ownerDecision ?? null,
      ownerNote: b.ownerNote ?? null,
      adminNote: (b as any).adminNote ?? null,
    })),
  });
}
