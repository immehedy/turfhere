"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import Switch from "@/components/ui/Switch";
import TimePicker12 from "@/components/time/TimePicker12";
import { VenueIcon } from "./venueIcons";
import { days, OpeningHours, Weekday } from "./venueTypes";

type Props = {
  openingHours: OpeningHours;
  allClosed: boolean;
  toggleAllClosed: () => void;
  setDay: (
    d: Weekday,
    patch: Partial<{ open: string; close: string; closed: boolean }>
  ) => void;
};

export default function OpeningHoursCard({
  openingHours,
  allClosed,
  toggleAllClosed,
  setDay,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-muted p-2">
            {VenueIcon.Clock}
          </div>
          <div>
            <CardTitle>Opening hours</CardTitle>
            <CardDescription>
              12-hour format (AM / PM)
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <button
            type="button"
            onClick={toggleAllClosed}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            {allClosed ? VenueIcon.Sun : VenueIcon.Moon}
            {allClosed ? "Open all" : "Close all"}
          </button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {days.map((d) => {
          const closed = openingHours[d].closed;

          return (
            <div
              key={d}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border bg-muted/40 p-3"
            >
              <div className="sm:col-span-1 font-semibold">{d}</div>

              <div className="sm:col-span-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {closed ? VenueIcon.Moon : VenueIcon.Sun}
                  {closed ? "Closed" : "Open"}
                </div>
                <Switch
                  checked={closed}
                  onCheckedChange={(v) => setDay(d, { closed: v })}
                />
              </div>

              <div className="sm:col-span-4">
                <TimePicker12
                  value24={openingHours[d].open}
                  onChange24={(v) => setDay(d, { open: v })}
                  disabled={closed}
                />
              </div>

              <div className="sm:col-span-4">
                <TimePicker12
                  value24={openingHours[d].close}
                  onChange24={(v) => setDay(d, { close: v })}
                  disabled={closed}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
