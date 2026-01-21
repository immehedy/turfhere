import { NextResponse } from "next/server";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import type { BookingDoc } from "@/models/types";
import { ObjectId } from "mongodb";

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
    .find({})
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      ...b,
      _id: b._id.toString(),
      venueId: b.venueId.toString(),
      userId: userId ? new ObjectId(userId) : undefined,
    })),
  });
}
