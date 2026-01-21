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

  const parsed = venueCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = await getDb();

  const doc: Omit<VenueDoc, "_id"> = {
    ...parsed.data,
    ownerId: new ObjectId(userId),

    // normalize
    slug: parsed.data.slug.trim(),
    name: parsed.data.name.trim(),

    status: "ACTIVE",
    createdAt: new Date(),
  };

  try {
    const res = await db.collection<VenueDoc>(collections.venues).insertOne(doc as any);
    return NextResponse.json({ id: res.insertedId.toString(), slug: doc.slug });
  } catch (e: any) {
    if (String(e?.message).includes("E11000")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type"); // TURF | EVENT_SPACE
  const city = searchParams.get("city");
  const area = searchParams.get("area");

  const db = await getDb();

  const filter: any = {
    status: "ACTIVE",
  };

  // type filter
  if (type) {
    filter.type = type;
  }

  // location filter
  if (city || area) {
    filter.$and = [];
    if (city) filter.$and.push({ city: new RegExp(city, "i") });
    if (area) filter.$and.push({ area: new RegExp(area, "i") });
  }

  // keyword search
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { city: new RegExp(q, "i") },
      { area: new RegExp(q, "i") },
    ];
  }

  const venues = await db
    .collection(collections.venues)
    .find(filter)
    .project({
      name: 1,
      slug: 1,
      type: 1,
      city: 1,
      area: 1,
      thumbnailUrl: 1,
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({ venues });
}