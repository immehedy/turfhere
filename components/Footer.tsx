import Link from 'next/link'

const Footer = () => {
  return (
    <>
    {/* FOOTER */}
<footer className="mt-16 border-t bg-gray-50">
  <div className="mx-auto max-w-6xl px-2 py-10">
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {/* Brand */}
      <div className="space-y-3">
      <span className="block text-[15px] sm:text-2xl font-semibold tracking-tight text-gray-900">
          <span className="font-extrabold">Turf</span>
          <span className="text-gray-500 font-medium">Here</span>
        </span>
        <p className="text-sm text-gray-600">
          A request-based booking platform for turfs and event spaces.
          Free for owners. Simple for users.
        </p>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} TurfHere. All rights reserved.
        </p>
      </div>

      {/* Explore */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Explore</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <Link className="hover:underline" href="/venues">
              Browse venues
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/venues?type=TURF">
              Turfs
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/venues?type=EVENT_SPACE">
              Event spaces
            </Link>
          </li>
        </ul>
      </div>

      {/* Owners */}
      <div>
        <h4 className="font-semibold text-sm mb-3">For owners</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <Link className="hover:underline" href="/register">
              Register your venue
            </Link>
          </li>
          <li>
            <Link className="hover:underline" href="/owner">
              Owner dashboard
            </Link>
          </li>
          <li>
            <span className="text-gray-500">
              Manage bookings & availability
            </span>
          </li>
        </ul>
      </div>

      {/* Platform */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Platform</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <span>Request-based booking</span>
          </li>
          <li>
            <span>Admin moderation</span>
          </li>
          <li>
            <span>Secure authentication</span>
          </li>
          <li>
            <span className="text-gray-500">More features coming soon</span>
          </li>
        </ul>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
      <p>
        Developed by fourbit.io
      </p>
      <div className="flex gap-4">
        <Link className="hover:underline" href="#">
          Privacy
        </Link>
        <Link className="hover:underline" href="#">
          Terms
        </Link>
        <Link className="hover:underline" href="#">
          Contact
        </Link>
      </div>
    </div>
  </div>
</footer>

    </>
  )
}

export default Footer