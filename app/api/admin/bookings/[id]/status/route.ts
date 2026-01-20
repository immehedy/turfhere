import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import { adminStatusSchema } from "@/lib/zod";
import type { BookingDoc } from "@/models/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = adminStatusSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = await getDb();
  const bookingId = new ObjectId(params.id);

  const booking = await db.collection<BookingDoc>(collections.bookings).findOne({ _id: bookingId });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // If confirming, ensure still no overlap (race safety)
  if (parsed.data.status === "CONFIRMED") {
    const conflict = await db.collection<BookingDoc>(collections.bookings).findOne({
      _id: { $ne: bookingId },
      venueId: booking.venueId,
      status: { $in: ["PENDING", "CONFIRMED"] },
      start: { $lt: booking.end },
      end: { $gt: booking.start },
    });
    if (conflict) {
      return NextResponse.json({ error: "Conflict: slot already taken" }, { status: 409 });
    }
  }

  await db.collection<BookingDoc>(collections.bookings).updateOne(
    { _id: bookingId },
    {
      $set: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
