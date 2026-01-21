export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc } from "@/models/types";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { venueUpdateSchema } from "@/lib/zod";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const venueId = new ObjectId(id);

  const venue = await db.collection<VenueDoc>(collections.venues).findOne({ _id: venueId });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  // owner access check
  if (role !== "ADMIN" && venue.ownerId.toString() !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    venue: {
      ...venue,
      _id: venue._id.toString(),
      ownerId: venue.ownerId.toString(),
    },
  });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = venueUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const venueId = new ObjectId(id);

  const existing = await db.collection<VenueDoc>(collections.venues).findOne({ _id: venueId });
  if (!existing) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  if (role !== "ADMIN" && existing.ownerId.toString() !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // enforce: thumbnail must be in images (recommended)
  if (!parsed.data.images.includes(parsed.data.thumbnailUrl)) {
    return NextResponse.json({ error: "images must include thumbnailUrl" }, { status: 400 });
  }

  try {
    await db.collection<VenueDoc>(collections.venues).updateOne(
      { _id: venueId },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true, slug: parsed.data.slug });
  } catch (e: any) {
    if (String(e?.message).includes("E11000")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
