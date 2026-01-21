export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc } from "@/models/types";
import { requireSession, getRole, getUserId } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const query: any =
    role === "ADMIN"
      ? {} // admin can see all venues
      : { ownerId: new ObjectId(userId) };

  const venues = await db
    .collection<VenueDoc>(collections.venues)
    .find(query)
    .sort({ createdAt: -1 })
    .project({
      name: 1,
      slug: 1,
      type: 1,
      city: 1,
      area: 1,
      thumbnailUrl: 1,
      status: 1,
    })
    .toArray();

  return NextResponse.json({
    venues: venues.map((v) => ({
      _id: v._id.toString(),
      name: v.name,
      slug: v.slug,
      type: v.type,
      city: v.city,
      area: v.area,
      thumbnailUrl: v.thumbnailUrl,
      status: v.status,
    })),
  });
}
