import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Link from "next/link";
import Image from "next/image";
import FullBleed from "@/components/FullBleed";
import CategoryCard from "@/components/CategoryCard";
import LandingSearch from "@/components/LandingSearch";
import InfoCard from "@/components/InfoCard";
import MiniFeature from "@/components/MiniFeature";

export const metadata: Metadata = {
  title: "Book Turfs & Event Spaces | TurfHere",
  description:
    "Book turfs and event spaces easily. Request-based booking, free venue listings, owner approval, and admin monitoring.",
  keywords: [
    "turf booking",
    "event space booking",
    "sports turf",
    "venue booking system",
    "football turf",
    "wedding hall",
  ],
  openGraph: {
    title: "TurfHere – Book Turfs & Event Spaces",
    description:
      "Search, request, and book turfs or event spaces. Free for owners, simple for users.",
    images: ["/images/og-cover.jpg"],
    type: "website",
  },
};

export default function HomePage() {
  return (
    <PageShell>
      <div className="space-y-10">
        {/* HERO */}
        <section className="grid gap-8 lg:grid-cols-2 items-center overflow-hidden">
          {/* Left */}
          <div className="space-y-5 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm w-fit max-w-full">
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">
                Free to list • Request-based booking
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight break-words">
              Book Sports Turfs & Event Spaces Instantly Near You
            </h1>

            <p className="text-gray-700 text-base md:text-lg break-words">
              Anyone can register a venue for free. Users request bookings.
              Venue owners confirm — and admins can monitor everything.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
                href="/venues">
                Browse venues
              </Link>
              <Link
                className="rounded border px-4 py-2 hover:bg-gray-50"
                href="/owner/venues/new">
                Register venue
              </Link>
            </div>
          </div>

          {/* Right (hero image + centered glass search overlay) */}
          <div className="relative rounded-2xl overflow-hidden border bg-white shadow-sm">
            <div className="relative">
              <Image
                src="/images/hero.jpg"
                alt="Turf and event booking"
                width={1600}
                height={900}
                className="w-full h-80 object-cover"
                priority
              />

              {/* Contrast overlay */}
              <div className="absolute inset-0 bg-black/35" />

              {/* Overlay: bottom on mobile, center on desktop */}
              <div className="absolute inset-0 flex items-center justify-center px-3 sm:px-6">
                <div
                  className="
          w-full max-w-md sm:max-w-2xl
          rounded-3xl
          border border-white/20
          bg-white/10
          backdrop-blur-xl
          shadow-2xl
          p-3 sm:p-6
        ">
                  <div className="text-center mb-3 sm:mb-5">
                    <h2 className="text-white text-base sm:text-2xl font-semibold">
                      Find your venue
                    </h2>
                    <p className="text-white/80 text-[11px] sm:text-sm mt-1">
                      Type, location & date — then search
                    </p>
                  </div>

                  <LandingSearch />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR */}
        <FullBleed>
          <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold">Popular picks</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Explore common venue types.
                  </p>
                </div>
                <Link className="text-sm underline" href="/venues">
                  View all →
                </Link>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CategoryCard
                  title="Football Turf"
                  subtitle="Evening prime slots"
                  img="/images/football-turf.jpg"
                  href="/venues?type=TURF&q=football"
                />
                <CategoryCard
                  title="Cricket Ground"
                  subtitle="Weekend bookings"
                  img="/images/cricket-ground.jpg"
                  href="/venues?type=TURF&q=cricket"
                />
                <CategoryCard
                  title="Wedding Hall"
                  subtitle="Decor-ready spaces"
                  img="/images/wedding-hall.jpg"
                  href="/venues?type=EVENT_SPACE&q=wedding"
                />
                <CategoryCard
                  title="Conference Room"
                  subtitle="Corporate events"
                  img="/images/conference-room.jpg"
                  href="/venues?type=EVENT_SPACE&q=conference"
                />
              </div>
            </div>
          </section>
        </FullBleed>

        {/* HOW IT WORKS */}
        <FullBleed>
          <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <InfoCard
                  title="1) Search & request"
                  body="Choose a venue, pick a date/time, and send a booking request in seconds."
                  icon="🔎"
                />
                <InfoCard
                  title="2) Owner confirms"
                  body="Venue owners confirm or reject requests from their dashboard (final approval)."
                  icon="✅"
                />
                <InfoCard
                  title="3) Admin monitoring"
                  body="Admins can monitor activity, manage users/venues, and handle disputes (superuser)."
                  icon="🛡️"
                />
              </div>
            </div>
          </section>
        </FullBleed>

        {/* FOR OWNERS */}
        <FullBleed>
          <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid gap-6 lg:grid-cols-2 items-center">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">For venue owners</h2>
                  <p className="text-gray-700">
                    List your turf or event space for free. Upload images, set
                    availability rules, and confirm requests.
                  </p>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span>⚡</span> Create venue pages with gallery +
                      thumbnail
                    </li>
                    <li className="flex gap-2">
                      <span>📅</span> Weekly opening hours + time-slot booking
                    </li>
                    <li className="flex gap-2">
                      <span>📥</span> Manage requests: confirm / reject in one
                      click
                    </li>
                  </ul>

                  <div className="pt-2">
                    <Link
                      className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
                      href="/owner">
                      Become an owner
                    </Link>
                  </div>
                </div>

                <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
                  <Image
                    src="/images/owner-dashboard.jpg"
                    alt="Owner dashboard"
                    width={1600}
                    height={900}
                    className="w-full h-55 sm:h-65 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-sm text-gray-600">
                      Owners get a dashboard to manage venues, images,
                      availability, and booking approvals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FullBleed>

        {/* TRUST */}
        <FullBleed>
          <section className="bg-linear-to-r from-indigo-50 via-pink-50 to-yellow-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    Built for reliability
                  </h2>
                  <p className="text-sm text-gray-700">
                    Request-based booking helps avoid double bookings and keeps
                    approvals in your control.
                  </p>
                </div>

                <MiniFeature
                  title="Request-based booking"
                  body="Users request slots; owners confirm final status."
                />
                <MiniFeature
                  title="Slot blocking"
                  body="Pending + confirmed bookings can block slots to prevent conflicts."
                />
                <MiniFeature
                  title="Admin oversight"
                  body="Superuser dashboard for monitoring, moderation, and support."
                />
              </div>
            </div>
          </section>
        </FullBleed>

        {/* CTA */}
        <FullBleed>
          <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Ready to book or list your place?
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Start browsing venues or register as an owner in minutes.
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Link
                      className="rounded bg-black text-white px-4 py-2 hover:opacity-90"
                      href="/venues">
                      Browse venues
                    </Link>
                    <Link
                      className="rounded border px-4 py-2 hover:bg-gray-50"
                      href="/register">
                      Register venue
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FullBleed>
      </div>
    </PageShell>
  );
}
