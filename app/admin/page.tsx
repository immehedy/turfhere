"use client";

import PageShell from "@/components/PageShell";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <PageShell>
      <h1 className="text-xl font-semibold">Admin dashboard</h1>
      <p className="text-gray-600 mt-1">Monitor venues and confirm booking requests.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/admin/bookings">
          Booking requests
        </Link>
        <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/admin/venues">
          Venues
        </Link>
      </div>
    </PageShell>
  );
}
