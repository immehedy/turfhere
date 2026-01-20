import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import { ownerDecisionSchema } from "@/lib/zod";
import type { BookingDoc, VenueDoc } from "@/models/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ownerDecisionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = await getDb();
  const bookingId = new ObjectId(params.id);

  const booking = await db.collection<BookingDoc>(collections.bookings).findOne({ _id: bookingId });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Ensure the booking belongs to one of owner's venues
  const venue = await db.collection<VenueDoc>(collections.venues).findOne({ _id: booking.venueId });
  if (!venue) return NextResponse.json({ error: "Venue missing" }, { status: 404 });

  if (role !== "ADMIN" && venue.ownerId.toString() !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.collection<BookingDoc>(collections.bookings).updateOne(
    { _id: bookingId },
    {
      $set: {
        ownerDecision: parsed.data.ownerDecision,
        ownerNote: parsed.data.ownerNote,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true });
}
