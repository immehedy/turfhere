import type { ObjectId } from "mongodb";

export type Role = "USER" | "OWNER" | "ADMIN";

export type BookingStatus =
  | "APPROVED"
  | "PENDING"        // created by user, awaiting admin final decision
  | "CONFIRMED"      // admin confirmed
  | "REJECTED"       // admin rejected
  | "CANCELLED";     // user/admin cancel

export type OwnerDecision = "CONFIRMED" | "REJECTED" | "APPROVED" | "CANCELLED" | null;

export type Weekday =
  | "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export type OpeningHours = Record<
  Weekday,
  { open: string; close: string; closed?: boolean }
>;

export type VenueType = "TURF" | "EVENT_SPACE";
export type VenueStatus = "ACTIVE" | "SUSPENDED";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string; // for credentials auth
  role: Role;
  createdAt: Date;
}

export interface VenueDoc {
  _id: ObjectId;
  ownerId: ObjectId;
  type: VenueType;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  area?: string;
  address?: string;

  thumbnailUrl: string;     // required
  images: string[]; 

  slotDurationMinutes: number; // e.g. 60
  openingHours: OpeningHours;

  status: VenueStatus;
  createdAt: Date;
}

export interface BookingDoc {
  _id: ObjectId;
  venueId: ObjectId;
  ownerId?: ObjectId;
  userId?: ObjectId;
  guest?: { name: string; phone: string } | null;
  start: Date;
  end: Date;

  status: BookingStatus;

  ownerDecision: OwnerDecision;
  ownerNote?: string;

  adminNote?: string;
  note?: string;

  userSnapshot?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
