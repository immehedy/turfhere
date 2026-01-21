import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["USER", "OWNER"]).default("USER"), // no self-register admin
});

const Weekday = z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]);

const timeHHMM = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM");

const openingHoursSchema = z.record(
  Weekday,
  z.object({
    open: timeHHMM,
    close: timeHHMM,
    closed: z.boolean(),
  })
);

const urlSchema = z.string().url("Must be a valid URL");

export const venueCreateSchema = z
  .object({
    type: z.enum(["TURF", "EVENT_SPACE"]),
    name: z.string().min(2).max(120),
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),

    description: z.string().max(2000).optional(),
    city: z.string().max(80).optional(),
    area: z.string().max(80).optional(),
    address: z.string().max(200).optional(),

    slotDurationMinutes: z.number().int().min(15).max(240),
    openingHours: openingHoursSchema,

    thumbnailUrl: urlSchema,
    images: z.array(urlSchema).max(20).default([]),
  })
  .superRefine((val, ctx) => {
    // Optional rule: ensure thumbnail is also in images (nice UX)
    // If you don't want this, remove this block.
    if (val.images.length > 0 && !val.images.includes(val.thumbnailUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["images"],
        message: "Images must include the thumbnail URL (or keep images empty).",
      });
    }
  });

  export const venueUpdateSchema = z.object({
    type: z.enum(["TURF", "EVENT_SPACE"]),
    name: z.string().min(2).max(120),
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  
    description: z.string().max(2000).optional(),
    city: z.string().max(80).optional(),
    area: z.string().max(80).optional(),
    address: z.string().max(200).optional(),
  
    slotDurationMinutes: z.number().int().min(15).max(240),
    openingHours: openingHoursSchema,
  
    thumbnailUrl: urlSchema,
    images: z.array(urlSchema).max(20),
  });


export const bookingCreateSchema = z.object({
  venueId: z.string().min(1),
  startISO: z.string().datetime(),
  endISO: z.string().datetime(),
  note: z.string().max(500).optional(),
});

export const ownerDecisionSchema = z.object({
  status: z.enum(["APPROVED", "CONFIRMED", "REJECTED", "CANCELLED"]),
  ownerNote: z.string().max(500).optional(),
});

export const adminStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "REJECTED", "CANCELLED"]),
  adminNote: z.string().max(500).optional(),
});
