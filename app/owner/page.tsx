"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function OwnerHomePage() {
  const { data } = useSession();
  const role = (data as any)?.role as string | undefined;

  return (
    <PageShell>
      <h1 className="text-xl font-semibold">Owner dashboard</h1>
      <p className="text-gray-600 mt-1">
        Create venues, view booking requests, and give your recommendation.
      </p>

      <div className="mt-4 flex gap-3 flex-wrap">
        <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner/venues/new">
          Create venue
        </Link>
        <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/owner/bookings">
          Booking requests
        </Link>
        {role === "ADMIN" && (
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/admin">
            Admin dashboard
          </Link>
        )}
      </div>
    </PageShell>
  );
}
