export type AvailabilityRes = {
    date: string;
    slotDurationMinutes: number;
    slots: {
      startISO: string;
      endISO: string;
      status?: "AVAILABLE" | "PENDING" | "CONFIRMED" | "UNAVAILABLE";
      isAvailable?: boolean;
      bookingId?: string;
    }[];
  };
  
  export type Slot = AvailabilityRes["slots"][number];
  
  export type Img = { url: string; isThumb?: boolean };
  
  export type Toast = {
    id: string;
    type: "success" | "error" | "info";
    title: string;
    description?: string;
  };
  