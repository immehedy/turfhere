import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import { bookingCreateSchema } from "@/lib/zod";
import type { BookingDoc, VenueDoc } from "@/models/types";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function POST(req: Request) {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bookingCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { venueId, startISO, endISO, note } = parsed.data;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (!(start < end)) return NextResponse.json({ error: "Invalid time range" }, { status: 400 });

  const db = await getDb();
  const vId = new ObjectId(venueId);

  const venue = await db.collection<VenueDoc>(collections.venues).findOne({ _id: vId, status: "ACTIVE" });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  // Conflict check: prevent double booking even in PENDING
  const conflicting = await db.collection<BookingDoc>(collections.bookings).findOne({
    venueId: vId,
    status: { $in: ["PENDING", "CONFIRMED"] },
    start: { $lt: end },
    end: { $gt: start },
  });

  if (conflicting) {
    return NextResponse.json({ error: "Slot already requested/booked" }, { status: 409 });
  }

  const doc: Omit<BookingDoc, "_id"> = {
    venueId: vId,
    userId: new ObjectId(userId),
    start,
    end,
    status: "PENDING",
    ownerDecision: null,
    ownerNote: note,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection(collections.bookings).insertOne(doc as any);
  return NextResponse.json({ id: res.insertedId.toString(), status: "PENDING" });
}
