export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import type { BookingDoc, VenueDoc } from "@/models/types";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { ownerDecisionSchema } from "@/lib/zod";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ownerDecisionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const bookingId = new ObjectId(id);

  const booking = await db
    .collection<BookingDoc>(collections.bookings)
    .findOne({ _id: bookingId });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const venue = await db
    .collection<VenueDoc>(collections.venues)
    .findOne({ _id: booking.venueId });

  if (!venue) return NextResponse.json({ error: "Venue missing" }, { status: 404 });

  // Owner can only finalize for their own venue (Admin can override any)
  if (role !== "ADMIN" && venue.ownerId.toString() !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow final decision if still pending
  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "Only PENDING bookings can be updated" }, { status: 409 });
  }

  // If confirming, do conflict check for safety
  if (parsed.data.status === "CONFIRMED") {
    const conflict = await db.collection<BookingDoc>(collections.bookings).findOne({
      _id: { $ne: bookingId },
      venueId: booking.venueId,
      status: { $in: ["PENDING", "CONFIRMED"] }, // PENDING blocks too
      start: { $lt: booking.end },
      end: { $gt: booking.start },
    });

    if (conflict) {
      return NextResponse.json({ error: "Conflict: slot already requested/booked" }, { status: 409 });
    }
  }

  await db.collection<BookingDoc>(collections.bookings).updateOne(
    { _id: bookingId },
    {
      $set: {
        status: parsed.data.status, // ✅ FINAL
        ownerNote: parsed.data.ownerNote,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
