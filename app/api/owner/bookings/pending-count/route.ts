export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc, BookingDoc } from "@/models/types";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { ObjectId } from "mongodb";
import type { Filter } from "mongodb";


export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  // OWNER: only their venues
  let ownerObjectId: ObjectId | null = null;
  if (role !== "ADMIN") ownerObjectId = new ObjectId(userId);

  // Get venue ids for owner (or all if admin)
  const venues = await db
    .collection<VenueDoc>(collections.venues)
    .find(ownerObjectId ? { ownerId: ownerObjectId } : {})
    .project({ _id: 1 })
    .toArray();

  const venueIds = venues.map((v) => v._id);

  // If owner has no venues, count is 0
  if (role !== "ADMIN" && venueIds.length === 0) {
    return NextResponse.json({ count: 0 });
  }

  const pendingQuery: Filter<BookingDoc> =
  role === "ADMIN"
    ? { status: "PENDING" as BookingDoc["status"] }
    : {
        venueId: { $in: venueIds },
        status: "PENDING" as BookingDoc["status"],
      };

const count = await db
  .collection<BookingDoc>(collections.bookings)
  .countDocuments(pendingQuery);

  return NextResponse.json({ count });
}
