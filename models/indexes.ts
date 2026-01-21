import { getDb, collections } from "@/lib/db";

export async function ensureIndexes() {
  const db = await getDb();

  await db.collection(collections.users).createIndex({ email: 1 }, { unique: true });

  await db.collection(collections.venues).createIndex({ slug: 1 }, { unique: true });
  await db.collection(collections.venues).createIndex({ ownerId: 1, createdAt: -1 });

  await db.collection(collections.bookings).createIndex({ venueId: 1, start: 1, end: 1, status: 1 });
  await db.collection(collections.bookings).createIndex({ userId: 1, createdAt: -1 });

}
