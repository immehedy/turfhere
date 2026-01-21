import PageShell from "@/components/PageShell";
import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <PageShell>
      <Suspense fallback={<p className="text-gray-600">Loading…</p>}>
        <SignInClient />
      </Suspense>
    </PageShell>
  );
}
