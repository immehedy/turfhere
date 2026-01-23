"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Field from "@/components/ui/Field";
import { VenueIcon } from "./venueIcons";

export default function LocationCard({
  city,
  setCity,
  area,
  setArea,
  address,
  setAddress,
}: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-muted p-2">
            {VenueIcon.Pin}
          </div>
          <div>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Helps users find you
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field label="City">
          <input
            className="h-11 w-full rounded-xl border px-3 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>

        <Field label="Area">
          <input
            className="h-11 w-full rounded-xl border px-3 text-sm"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </Field>

        <Field label="Address">
          <input
            className="h-11 w-full rounded-xl border px-3 text-sm"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
