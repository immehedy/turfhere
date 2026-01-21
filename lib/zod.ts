import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["USER", "OWNER"]).default("USER"), // no self-register admin
});

export const venueCreateSchema = z.object({
  type: z.enum(["TURF", "EVENT_SPACE"]),
  name: z.string().min(2).max(120),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),

  city: z.string().max(80).optional(),
  area: z.string().max(80).optional(),
  address: z.string().max(180).optional(),

  slotDurationMinutes: z.number().int().min(15).max(240),
  openingHours: z.record(
    z.enum(["SUN","MON","TUE","WED","THU","FRI","SAT"]),
    z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/),
      close: z.string().regex(/^\d{2}:\d{2}$/),
      closed: z.boolean().optional(),
    })
  ),
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
