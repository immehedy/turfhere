export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getDb, collections } from "@/lib/db";
import { hashPassword } from "@/lib/security";
import { registerSchema } from "@/lib/zod";
import type { UserDoc } from "@/models/types";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;
  const db = await getDb();

  const exists = await db.collection<UserDoc>(collections.users).findOne({ email: email.toLowerCase().trim() });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const doc: UserDoc = {
    _id: new ObjectId(),
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    createdAt: new Date(),
  };

  await db.collection<UserDoc>(collections.users).insertOne(doc as any);
  return NextResponse.json({ ok: true });
}
