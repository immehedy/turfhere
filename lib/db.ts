import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) throw new Error("Missing MONGODB_URI");
if (!dbName) throw new Error("Missing MONGODB_DB");

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getDb() {
  const c = await getMongoClient();
  return c.db(dbName);
}

export const collections = {
  users: "users",
  venues: "venues",
  bookings: "bookings",
} as const;
