export type TimeSlot = "morning" | "afternoon" | "evening" | "night";

export interface Movie {
  name: string;
  language: string;
  format: string;
  showtimes: string[];
}

export interface TheatreShowtimes {
  theatre: string;
  date: string;
  movies: Movie[];
}

export interface UserFilters {
  languages?: string[];
  timeSlots?: TimeSlot[];
}

export interface User {
  id: number;
  chat_id: number;
  theatres: string[];
  filters: UserFilters;
  created_at: Date;
}

export interface TheatreConfig {
  name: string;
  code: string;
  region: string;
  city: string;
  slug?: string;
  bookingPath?: string;
}

export const THEATRES: TheatreConfig[] = [
  { name: "Allu Cinemas Kokapet", code: "ALUC", region: "HYD", city: "Hyderabad" },
  { name: "AMB Cinemas Gachibowli", code: "AMBH", region: "HYD", city: "Hyderabad" },
  {
    name: "Prasads Large Screen",
    code: "PRHN",
    region: "HYD",
    city: "Hyderabad",
    slug: "prasads-multiplex",
    bookingPath: "/cinemas/hyderabad/prasads-multiplex-hyderabad/buytickets/PRHN",
  },
  { name: "Sandhya 70MM RTC X Roads", code: "SN70", region: "HYD", city: "Hyderabad" },
  { name: "Asian Radhika Multiplex", code: "ARML", region: "HYD", city: "Hyderabad" },
];

export const LANGUAGES = ["Telugu", "Hindi", "English"] as const;

export const TIME_SLOTS: { label: string; value: TimeSlot }[] = [
  { label: "🌅 Morning (6AM–12PM)", value: "morning" },
  { label: "☀️ Afternoon (12PM–4PM)", value: "afternoon" },
  { label: "🌇 Evening (4PM–8PM)", value: "evening" },
  { label: "🌙 Night (8PM–12AM)", value: "night" },
];
