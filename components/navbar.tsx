"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/clientFetch";
import {
  CalendarDays,
  Home,
  Shield,
  Ticket,
  ClipboardList,
  LogIn,
} from "lucide-react";

function BrandLogo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <span className="leading-none">
        <span className="block text-[15px] sm:text-xl font-semibold tracking-tight text-gray-900">
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

function PendingBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
      </span>
      <span className="rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-2 py-0.5 text-[11px] font-semibold">
        {count}
      </span>
    </span>
  );
}

function TopActionLink({
  href,
  children,
  variant = "outline",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "outline" | "solid";
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition",
        variant === "solid"
          ? "bg-black text-white hover:bg-black/90"
          : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function TabLink({
  href,
  children,
  emphasize,
}: {
  href: string;
  children: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition border",
        emphasize
          ? "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100"
          : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function NavItem({
  href,
  icon,
  children,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-2xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 inline-flex items-center gap-2",
        className ?? "",
      ].join(" ")}
    >
      <span className="text-gray-500">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

export default function NavBar() {
  const { data: session, status } = useSession();
  const role = (session as any)?.role as string | undefined;

  const isAuthed = status === "authenticated";
  const isOwner = role === "OWNER" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;

    async function loadPendingCount() {
      if (!isOwner) return;
      const res = await clientFetch<{ count: number }>(
        "/api/owner/bookings/pending-count"
      );
      if (!alive) return;
      setPendingCount(res.ok ? res.data.count ?? 0 : 0);
    }

    loadPendingCount();
    const id = isOwner ? window.setInterval(loadPendingCount, 30_000) : undefined;

    return () => {
      alive = false;
      if (id) window.clearInterval(id);
    };
  }, [isOwner]);

  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      {/* Top row */}
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <BrandLogo />

        <div className="flex items-center gap-2">
          {/* Desktop inline links */}
          <nav className="hidden md:flex items-center gap-2">
            {isAuthed && (
              <NavItem
                href="/account/bookings"
                icon={<Ticket className="h-4 w-4" />}
              >
                My Bookings
              </NavItem>
            )}

            {isOwner && (
              <>
                <NavItem
                  href="/owner/calender"
                  icon={<CalendarDays className="h-4 w-4" />}
                >
                  Calender
                </NavItem>

                <NavItem href="/owner" icon={<Home className="h-4 w-4" />}>
                  Owner
                </NavItem>

                <Link
                  href="/owner/bookings"
                  className={[
                    "rounded-2xl px-3 py-2 text-sm font-medium transition inline-flex items-center gap-2",
                    pendingCount > 0
                      ? "bg-rose-50 text-rose-900 ring-1 ring-rose-200 hover:bg-rose-100"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                  ].join(" ")}
                >
                  <span className="text-gray-500">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <span>Booking Requests</span>
                  {pendingCount > 0 ? <PendingBadge count={pendingCount} /> : null}
                </Link>
              </>
            )}

            {isAdmin && (
              <NavItem href="/admin" icon={<Shield className="h-4 w-4" />}>
                Admin
              </NavItem>
            )}
          </nav>

          {/* Auth actions */}
          {isAuthed ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Sign out
            </button>
          ) : (
            <>
              <TopActionLink href="/signin" variant="outline">
                Sign in
              </TopActionLink>
              <TopActionLink href="/register" variant="solid">
                Register
              </TopActionLink>
            </>
          )}
        </div>
      </div>

      {/* Mobile/Tablet tab row (no hamburger) */}
      <div className="md:hidden border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            

            {isOwner && (
              <>
                <TabLink href="/owner/calender">
                  <CalendarDays className="h-4 w-4" />
                </TabLink>

                <TabLink href="/owner">
                  <Home className="h-4 w-4" />
                  {/* Owner */}
                </TabLink>

                <TabLink href="/owner/bookings" emphasize={pendingCount > 0}>
                  <ClipboardList className="h-4 w-4" />
                  <span>Requests</span>
                  {pendingCount > 0 ? <PendingBadge count={pendingCount} /> : null}
                </TabLink>
              </>
            )}

            {isAdmin && (
              <TabLink href="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </TabLink>
            )}

            {isAuthed && (
              <TabLink href="/account/bookings">
                <Ticket className="h-4 w-4" />
                My Bookings
              </TabLink>
            )}

            {!isAuthed && (
              <TabLink href="/signin">
                <LogIn className="h-4 w-4" />
                Sign in
              </TabLink>
            )}
          </div>
        </div>
      </div>

      {/* Hide scrollbar (Tailwind utility) */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
}
