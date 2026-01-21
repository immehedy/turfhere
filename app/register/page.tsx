"use client";

import PageShell from "@/components/PageShell";
import { clientFetch } from "@/lib/clientFetch";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterRes = { ok: true } | { error: any };

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "OWNER">("USER");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await clientFetch<RegisterRes>("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, phone, email, password, role }),
    });

    if (!res.ok) {
      setLoading(false);
      setErr(typeof res.error === "string" ? res.error : "Registration failed");
      return;
    }

    // auto sign-in
    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (!sign?.ok) {
      router.push("/signin");
      return;
    }

    router.push(role === "OWNER" ? "/owner" : "/");
  }

  return (
    <PageShell>
      <div className="max-w-md border rounded-lg p-5">
        <h1 className="text-xl font-semibold">Register</h1>
        <p className="text-sm text-gray-600 mt-1">Create a free account.</p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm">Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm">Phone number</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <div>
            <label className="text-sm">Account type</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}>
              <option value="USER">User (book venues)</option>
              <option value="OWNER">Owner (register turf/event)</option>
            </select>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            disabled={loading}
            className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
