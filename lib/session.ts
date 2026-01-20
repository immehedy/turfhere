import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  return session; // can be null
}

export function getRole(session: any): string | undefined {
  return session?.role;
}

export function getUserId(session: any): string | undefined {
  return session?.user?.id;
}
