"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMemo, useState } from "react";

export default function SignInClient() {
  const sp = useSearchParams();

  const callbackUrl = useMemo(() => sp.get("callbackUrl") ?? "/owner/calender", [sp]);
  const error = sp.get("error");

  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl });
    setLoading(false);
  }

  return (
    <div className="mx-auto border rounded-lg p-5 max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600 mt-1">
          Sign in to request bookings and manage your account.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Sign in failed. Please try again.
        </p>
      )}

      {/* Credentials sign-in */}
      <form onSubmit={handleCredentials} className="space-y-3">
        <div>
          <label className="text-sm">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input
            name="password"
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link className="underline" href="/register">
          Register
        </Link>
      </p>
    </div>
  );
}
