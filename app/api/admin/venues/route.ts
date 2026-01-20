import { NextResponse } from "next/server";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { getDb, collections } from "@/lib/db";
import type { VenueDoc } from "@/models/types";

export async function GET() {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = await getDb();
  const venues = await db.collection<VenueDoc>(collections.venues).find({}).sort({ createdAt: -1 }).limit(200).toArray();

  return NextResponse.json({
    venues: venues.map((v) => ({ ...v, _id: v._id.toString(), ownerId: v.ownerId.toString() })),
  });
}
