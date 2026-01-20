export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc } from "@/models/types";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params; // ✅ unwrap params promise

  const db = await getDb();
  const venue = await db
    .collection<VenueDoc>(collections.venues)
    .findOne({ slug, status: "ACTIVE" });

  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    venue: {
      ...venue,
      _id: venue._id.toString(),
      ownerId: venue.ownerId.toString(),
    },
  });
}
