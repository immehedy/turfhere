export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
export const days: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type OpeningHour = { open: string; close: string; closed: boolean };
export type OpeningHours = Record<Weekday, OpeningHour>;

export type UploadedImage = { url: string; publicId: string };
export type VenueType = "TURF" | "EVENT_SPACE";
