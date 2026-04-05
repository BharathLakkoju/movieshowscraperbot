import type { Movie, UserFilters, TimeSlot } from "../types/index.js";

function classifyTimeSlot(time: string): TimeSlot | null {
  // Parse times like "10:30 AM", "6:00 PM", "21:30"
  const match12 = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const match24 = time.match(/^(\d{1,2}):(\d{2})$/);

  let hour: number;
  if (match12) {
    hour = parseInt(match12[1]!, 10);
    const period = match12[3]!.toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
  } else if (match24) {
    hour = parseInt(match24[1]!, 10);
  } else {
    return null;
  }

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 20) return "evening";
  return "night";
}

export function applyFilters(movies: Movie[], filters: UserFilters | undefined): Movie[] {
  if (!filters) return movies;

  return movies
    .map((movie) => {
      // Filter by language
      if (filters.languages && filters.languages.length > 0 && movie.language) {
        const matchesLang = filters.languages.some(
          (lang) => movie.language.toLowerCase().includes(lang.toLowerCase())
        );
        if (!matchesLang) return null;
      }

      // Filter by time slot
      if (filters.timeSlots && filters.timeSlots.length > 0) {
        const filteredTimes = movie.showtimes.filter((t) => {
          const slot = classifyTimeSlot(t);
          return slot !== null && filters.timeSlots!.includes(slot);
        });
        if (filteredTimes.length === 0) return null;
        return { ...movie, showtimes: filteredTimes };
      }

      return movie;
    })
    .filter((m): m is Movie => m !== null);
}