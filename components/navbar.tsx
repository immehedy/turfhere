"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

function BrandLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      {/* Wordmark */}
      <span className="leading-none">
        <span className="block text-[15px] sm:text-2xl font-semibold tracking-tight text-gray-900">
          <span className="font-extrabold">Turf</span>
          <span className="text-gray-500 font-medium">Here</span>
        </span>
        <span className="block text-[11px] sm:text-xs text-gray-500">
          Book • Request • Confirm
        </span>
      </span>
    </Link>
  );
}

export default function NavBar() {
  const { data: session, status } = useSession();
  const role = (session as any)?.role as string | undefined;

  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <BrandLogo />

        <nav className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap justify-end">
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
              className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link className="rounded-lg border px-3 py-1.5 hover:bg-gray-50" href="/signin">
                Sign in
              </Link>
              <Link className="rounded-lg bg-black text-white px-3 py-1.5 hover:opacity-90" href="/register">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
