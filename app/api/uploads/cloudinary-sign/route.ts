export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireSession, getRole } from "@/lib/session";

function signCloudinary(paramsToSign: Record<string, string>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(sorted + apiSecret)
    .digest("hex");

  return signature;
}

export async function POST(req: Request) {
  // Only OWNER/ADMIN can upload images
  const session = await requireSession();
  const role = getRole(session);
  if (!session || (role !== "OWNER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { folder?: string }
    | null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = body?.folder ?? process.env.CLOUDINARY_FOLDER ?? "turfhere/venues";

  const paramsToSign: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };

  const signature = signCloudinary(paramsToSign);

  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  });
}
