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
import { VenueType } from "./venueTypes";
import { slugify } from "./venueHelpers";

type Props = {
  type: VenueType;
  setType: (v: VenueType) => void;
  slotDurationMinutes: number;
  setSlotDurationMinutes: (n: number) => void;
  name: string;
  setName: (s: string) => void;
  slug: string;
  setSlug: (s: string) => void;
  slugTouched: boolean;
  setSlugTouched: (b: boolean) => void;
  resetSlug: () => void;
  description: string;
  setDescription: (s: string) => void;
};

export default function VenueDetailsCard({
  type,
  setType,
  slotDurationMinutes,
  setSlotDurationMinutes,
  name,
  setName,
  slug,
  setSlug,
  slugTouched,
  setSlugTouched,
  resetSlug,
  description,
  setDescription,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-muted p-2">
            {VenueIcon.Info}
          </div>

          <div>
            <CardTitle>Venue details</CardTitle>
            <CardDescription>
              Core info shown to customers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <select
              className="h-11 w-full rounded-xl border px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as VenueType)}
            >
              <option value="TURF">Turf</option>
              <option value="EVENT_SPACE">Event Space</option>
            </select>
          </Field>

          <Field label="Slot duration (minutes)" hint="15–240">
            <input
              type="number"
              min={15}
              max={1440}
              className="h-11 w-full rounded-xl border px-3 text-sm"
              value={slotDurationMinutes}
              onChange={(e) =>
                setSlotDurationMinutes(Number(e.target.value))
              }
            />
          </Field>

          <Field label="Name">
            <input
              className="h-11 w-full rounded-xl border px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gulshan Turf Arena"
            />
          </Field>

          <Field label="Slug" hint={slugTouched ? "Custom" : "Auto"}>
            <div className="flex gap-2">
              <input
                className="h-11 w-full rounded-xl border px-3 text-sm font-mono"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
              />
              {slugTouched && (
                <button
                  type="button"
                  onClick={resetSlug}
                  className="rounded-xl border px-3 text-sm"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              /v/{slug || "..."}
            </p>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" hint="Markdown supported">
              <textarea
                rows={5}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
