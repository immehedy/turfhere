export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import type { BookingDoc, VenueDoc } from "@/models/types";
import { getOptionalSession, getUserId } from "@/lib/session";
import { z } from "zod";

type UserDoc = {
  _id: ObjectId;
  name?: string;
  email?: string;
  phone?: string;
};

const createBookingSchema = z.object({
  venueId: z.string().min(1),
  startISO: z.string().min(1),
  endISO: z.string().min(1),
  note: z.string().optional(),

  // guest booking
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
});

function normalizePhone(raw: string) {
  return raw.trim().replace(/[^\d+]/g, "");
}

function isValidPhone(raw: string) {
  const v = normalizePhone(raw);
  if (/^(\+?8801)\d{9}$/.test(v)) return true;
  if (/^01\d{9}$/.test(v)) return true;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { venueId, startISO, endISO, note, guestName, guestPhone } = parsed.data;

  const session = await getOptionalSession();
  const userId = session ? getUserId(session) : null;

  // ✅ If no user session, require guest fields
  let guest: BookingDoc["guest"] | null = null;

  if (!userId) {
    if (!guestName?.trim()) {
      return NextResponse.json({ error: "guestName is required" }, { status: 400 });
    }
    if (!guestPhone || !isValidPhone(guestPhone)) {
      return NextResponse.json({ error: "Valid guestPhone is required" }, { status: 400 });
    }

    guest = { name: guestName.trim(), phone: normalizePhone(guestPhone) };
  }

  const db = await getDb();

  const venue = await db.collection<VenueDoc>(collections.venues).findOne({
    _id: new ObjectId(venueId),
    status: "ACTIVE",
  });

  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  let userSnapshot: BookingDoc["userSnapshot"] | undefined = undefined;

if (userId) {
  const u = await db.collection<UserDoc>(collections.users).findOne(
    { _id: new ObjectId(userId) },
    { projection: { name: 1, email: 1, phone: 1 } }
  );

  userSnapshot = {
    name: u?.name,
    email: u?.email,
    phone: u?.phone,
  };
}


  // TODO (MVP): validate time is within opening hours + slot length
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }
  if (end <= start) return NextResponse.json({ error: "Invalid time range" }, { status: 400 });

  // Prevent double booking (block if any existing booking overlaps)
  const overlap = await db.collection<BookingDoc>(collections.bookings).findOne({
    venueId: venue._id,
    status: { $in: ["PENDING", "CONFIRMED"] },
    start: { $lt: end },
    end: { $gt: start },
  });

  if (overlap) return NextResponse.json({ error: "Slot already requested/booked" }, { status: 409 });

  const doc: BookingDoc = {
    _id: new ObjectId(),
    venueId: venue._id,
    ownerId: venue.ownerId, // store for quick owner queries
    userId: userId ? new ObjectId(userId) : undefined,

    guest,
    userSnapshot,

    start,
    end,
    note: note?.trim() || undefined,

    status: "PENDING",
    ownerDecision: null,
    ownerNote: undefined,

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<BookingDoc>(collections.bookings).insertOne(doc);

  return NextResponse.json({ id: doc._id.toString(), status: doc.status });
}
