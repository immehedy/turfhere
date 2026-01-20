import { NextResponse } from "next/server";
import { getDb, collections } from "@/lib/db";
import { requireSession, getRole, getUserId } from "@/lib/session";
import { venueCreateSchema } from "@/lib/zod";
import { ObjectId } from "mongodb";
import type { VenueDoc } from "@/models/types";

export const runtime = "nodejs";


export async function POST(req: Request) {
  const session = await requireSession();
  const role = getRole(session);
  const userId = getUserId(session);

  if (!session || !userId || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = venueCreateSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const db = await getDb();
  const doc: Omit<VenueDoc, "_id"> = {
    ...payload.data,
    ownerId: new ObjectId(userId),
    status: "ACTIVE",
    createdAt: new Date(),
  };

  try {
    const res = await db.collection(collections.venues).insertOne(doc as any);
    return NextResponse.json({ id: res.insertedId.toString(), slug: doc.slug });
  } catch (e: any) {
    if (String(e?.message).includes("E11000")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const db = await getDb();
  const venues = await db
    .collection<VenueDoc>(collections.venues)
    .find({ status: "ACTIVE" })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    venues: venues.map((v) => ({
      _id: v._id.toString(),
      ownerId: v.ownerId.toString(),
      name: v.name,
      slug: v.slug,
      type: v.type,
      city: v.city,
      area: v.area,
      status: v.status,
      createdAt: v.createdAt,
    })),
  });
}
