"use client";

import { cn } from "@/lib/utils";
import { parse24To12, to24From12, pad2, Time12 } from "./timeHelpers";

export default function TimePicker12({
  value24,
  onChange24,
  disabled,
  minuteStep = 15,
}: {
  value24: string;
  onChange24: (next: string) => void;
  disabled?: boolean;
  minuteStep?: 5 | 10 | 15 | 30;
}) {
  const t = parse24To12(value24);

  const minutes = Array.from(
    { length: 60 / minuteStep },
    (_, i) => i * minuteStep
  );
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  const setPatch = (patch: Partial<Time12>) => {
    const next: Time12 = { ...t, ...patch };
    onChange24(to24From12(next));
  };

  return (
    <div className={cn("flex items-center gap-2", disabled && "opacity-60")}>
      <select
        className="h-11 w-[86px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.hour}
        onChange={(e) => setPatch({ hour: Number(e.target.value) })}
        disabled={disabled}
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-gray-400">:</span>

      <select
        className="h-11 w-[92px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.minute}
        onChange={(e) => setPatch({ minute: Number(e.target.value) })}
        disabled={disabled}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {pad2(m)}
          </option>
        ))}
      </select>

      <select
        className="h-11 w-[86px] rounded-2xl border border-gray-200 bg-white px-3 text-sm shadow-sm"
        value={t.ampm}
        onChange={(e) => setPatch({ ampm: e.target.value as "AM" | "PM" })}
        disabled={disabled}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
