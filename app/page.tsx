import PageShell from "@/components/PageShell";
import Link from "next/link";

export default function HomePage() {
  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Book turfs & event spaces</h1>
        <p className="text-gray-700">
          Anyone can register a venue for free. Users can request bookings. Admin confirms bookings.
        </p>

        <div className="flex gap-3">
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/venues">
            Browse venues
          </Link>
          <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/register">
            Register as owner
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
