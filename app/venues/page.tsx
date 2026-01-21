import PageShell from "@/components/PageShell";
import { Suspense } from "react";
import VenuesClient from "./VenuesClient";

export default function VenuesPage() {
  return (
    <PageShell>
      <Suspense fallback={<p className="text-gray-600">Loading venues…</p>}>
        <VenuesClient />
      </Suspense>
    </PageShell>
  );
}
