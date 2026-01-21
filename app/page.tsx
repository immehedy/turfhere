import PageShell from "@/components/PageShell";
import Link from "next/link";

export default function HomePage() {
  return (
    <PageShell>
      <div className="space-y-10">
        {/* HERO */}
        <section className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Free to list • Request-based booking
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              Book turfs & event spaces — fast, simple, and verified.
            </h1>

            <p className="text-gray-700 text-base md:text-lg">
              Anyone can register a venue for free. Users request bookings. Venue owners confirm — and admins can
              monitor everything.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link className="rounded bg-black text-white px-4 py-2 hover:opacity-90" href="/venues">
                Browse venues
              </Link>
              <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/register">
                Register as owner
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <Stat label="Venues listed" value="1,200+" />
              <Stat label="Cities covered" value="25+" />
              <Stat label="Requests/day" value="500+" />
            </div>
          </div>

          <div className="relative">
            {/* Decorative gradient */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-200 via-pink-200 to-yellow-200 rounded-2xl blur-2xl opacity-70" />
            <div className="relative border rounded-2xl overflow-hidden shadow-sm bg-white">
              {/* Dummy hero image */}
              <img
                src="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1600&auto=format&fit=crop"
                alt="Dummy turf/event"
                className="w-full h-[320px] object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600">
                  “Search, request, and confirm — all in one dashboard.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="border rounded-2xl p-4 md:p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Find a place</h2>
          <p className="text-sm text-gray-600 mt-1">
            Search by type, location, and date. You’ll be taken to the venues page with your results.
          </p>

          <div className="mt-4">
            <LandingSearch />
          </div>
        </section>

        {/* POPULAR */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Popular picks</h2>
              <p className="text-sm text-gray-600 mt-1">Explore common venue types (dummy images for now).</p>
            </div>
            <Link className="text-sm underline" href="/venues">
              View all →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard
              title="Football Turf"
              subtitle="Evening prime slots"
              img="https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop"
              href="/venues?type=TURF&q=football"
            />
            <CategoryCard
              title="Cricket Ground"
              subtitle="Weekend bookings"
              img="https://images.unsplash.com/photo-1593341646782-9514c50b4f3b?q=80&w=1200&auto=format&fit=crop"
              href="/venues?type=TURF&q=cricket"
            />
            <CategoryCard
              title="Wedding Hall"
              subtitle="Decor-ready spaces"
              img="https://images.unsplash.com/photo-1525268771113-32d9e9021a97?q=80&w=1200&auto=format&fit=crop"
              href="/venues?type=EVENT_SPACE&q=wedding"
            />
            <CategoryCard
              title="Conference Room"
              subtitle="Corporate events"
              img="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop"
              href="/venues?type=EVENT_SPACE&q=conference"
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="grid gap-6 lg:grid-cols-3">
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
        </section>

        {/* FOR OWNERS */}
        <section className="grid gap-6 lg:grid-cols-2 items-center">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">For venue owners</h2>
            <p className="text-gray-700">
              List your turf or event space for free. Upload images, set availability rules, and confirm requests.
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span>⚡</span> Create venue pages with gallery + thumbnail
              </li>
              <li className="flex gap-2">
                <span>📅</span> Weekly opening hours + time-slot booking
              </li>
              <li className="flex gap-2">
                <span>📥</span> Manage requests: confirm / reject in one click
              </li>
            </ul>

            <div className="pt-2">
              <Link className="rounded bg-black text-white px-4 py-2 hover:opacity-90" href="/register">
                Become an owner
              </Link>
            </div>
          </div>

          <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1526481280695-3c687fd643ed?q=80&w=1600&auto=format&fit=crop"
              alt="Owner dashboard dummy"
              className="w-full h-[260px] object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <p className="text-sm text-gray-600">
                Owners get a dashboard to manage venues, images, availability, and booking approvals.
              </p>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="border rounded-2xl p-6 bg-gradient-to-r from-indigo-50 via-pink-50 to-yellow-50">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Built for reliability</h2>
              <p className="text-sm text-gray-700">
                Request-based booking helps avoid double bookings and keeps approvals in your control.
              </p>
            </div>

            <MiniFeature title="Request-based booking" body="Users request slots; owners confirm final status." />
            <MiniFeature title="Slot blocking" body="Pending + confirmed bookings can block slots to prevent conflicts." />
            <MiniFeature title="Admin oversight" body="Superuser dashboard for monitoring, moderation, and support." />
          </div>
        </section>

        {/* CTA */}
        <section className="border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Ready to book or list your place?</h2>
              <p className="text-sm text-gray-600 mt-1">
                Start browsing venues or register as an owner in minutes.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link className="rounded bg-black text-white px-4 py-2 hover:opacity-90" href="/venues">
                Browse venues
              </Link>
              <Link className="rounded border px-4 py-2 hover:bg-gray-50" href="/register">
                Register venue
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

/* -------------------- components -------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function InfoCard({ title, body, icon }: { title: string; body: string; icon: string }) {
  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <div className="text-2xl">{icon}</div>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{body}</p>
    </div>
  );
}

function MiniFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="border rounded-xl p-4 bg-white/60">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-700 mt-1">{body}</div>
    </div>
  );
}

function CategoryCard({
  title,
  subtitle,
  img,
  href,
}: {
  title: string;
  subtitle: string;
  img: string;
  href: string;
}) {
  return (
    <Link href={href} className="border rounded-2xl overflow-hidden bg-white hover:shadow-sm transition">
      <div className="aspect-[4/3] bg-gray-100">
        <img src={img} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
      </div>
    </Link>
  );
}

/**
 * Airbnb-like search bar:
 * - Type: TURF/EVENT_SPACE/ALL
 * - Location text (city/area)
 * - Date
 * Redirects to /venues with query params
 */
function LandingSearch() {
  // NOTE: this component must be client; we keep it inline to avoid extra files
  // Next.js allows mixed components, but because this file is a server component,
  // we implement a tiny client-like behavior using a <form action> pattern:
  // We'll still do a normal GET redirect with query params.
  // If you prefer JS router push, tell me and I'll convert this page to "use client".
  return (
    <form action="/venues" method="GET" className="grid gap-3 lg:grid-cols-4 items-end">
      <div>
        <label className="text-sm">Type</label>
        <select name="type" className="mt-1 w-full border rounded px-3 py-2">
          <option value="">All</option>
          <option value="TURF">Turf</option>
          <option value="EVENT_SPACE">Event space</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Location</label>
        <input
          name="q"
          className="mt-1 w-full border rounded px-3 py-2"
          placeholder="City / Area (e.g. Gulshan, Dhaka)"
        />
      </div>

      <div>
        <label className="text-sm">Date</label>
        <input name="date" type="date" className="mt-1 w-full border rounded px-3 py-2" />
      </div>

      <button className="rounded bg-black text-white px-4 py-2 hover:opacity-90">
        Search
      </button>

      <p className="text-xs text-gray-500 lg:col-span-4">
        Tip: Search sends you to <span className="font-mono">/venues</span> with filters applied.
      </p>
    </form>
  );
}
