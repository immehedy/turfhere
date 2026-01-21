import PageShell from "@/components/PageShell";
import VenueBookingClient from "./venuBookingClient";

async function getVenue(slug: string) {
  // IMPORTANT: if you moved slug route to /api/venues/slug/[slug], use that here:
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? ""}/api/venues/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function VenuePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ unwrap params promise
  const data = await getVenue(slug);

  const venue = data?.venue;
  if (!venue) {
    return (
      <PageShell>
        <p className="text-gray-700">Venue not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{venue.name}</h1>
            <p className="text-sm text-gray-600">
              {venue.area ?? ""} {venue.city ?? ""}
            </p>
          </div>
          <span className="text-xs border rounded px-2 py-1">{venue.type}</span>
        </div>

        <div className="border rounded-lg p-4 mt-4">
          <h2 className="font-semibold">Request a booking</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your booking request will be reviewed. <b>Owner confirms</b> the final status.
          </p>

          <div className="mt-4">
            <VenueBookingClient
              venueId={venue._id}
              thumbnailUrl={venue.thumbnailUrl}
              images={venue.images}
              slotDurationMinutes={venue.slotDurationMinutes}
              description={venue?.description}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
