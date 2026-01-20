"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();
  const role = (session as any)?.role as string | undefined;

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Booking Platform
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href="/venues" className="hover:underline">
            Venues
          </Link>

          {status === "authenticated" && (
            <Link href="/account/bookings" className="hover:underline">
              My Bookings
            </Link>
          )}

          {(role === "OWNER" || role === "ADMIN") && (
            <Link href="/owner" className="hover:underline">
              Owner
            </Link>
          )}

          {role === "ADMIN" && (
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          )}

          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded border px-3 py-1 hover:bg-gray-50"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link className="rounded border px-3 py-1 hover:bg-gray-50" href="/signin">
                Sign in
              </Link>
              <Link className="rounded border px-3 py-1 hover:bg-gray-50" href="/register">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
