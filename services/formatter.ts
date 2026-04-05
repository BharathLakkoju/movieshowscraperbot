import type { Movie } from "../types/index.js";

export function formatMessage(theatre: string, movies: Movie[]): string {
  if (!movies.length) return `📍 *${theatre}*\n\n❌ No shows match your filters.`;

  const header = `📍 *${theatre}*\n📅 ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}\n`;

  const movieLines = movies.map((m) => {
    const meta = [m.language, m.format].filter(Boolean).join(" • ");
    const metaLine = meta ? `   _${meta}_` : "";
    const times = m.showtimes.join("  |  ");
    return `🍿 *${escapeMarkdown(m.name)}*${metaLine}\n   🕒 ${times}`;
  });

  return `${header}\n${movieLines.join("\n\n")}`;
}

export function formatDailyDigest(theatre: string, movies: Movie[]): string {
  if (!movies.length) return `📍 *${theatre}*\n❌ No shows today.`;

  const header = `📍 *${theatre}*`;
  const count = `🎬 ${movies.length} movie${movies.length > 1 ? "s" : ""} today`;

  const movieLines = movies.map((m) => {
    const meta = [m.language, m.format].filter(Boolean).join(" • ");
    const metaLine = meta ? ` _(${meta})_` : "";
    return `🍿 *${escapeMarkdown(m.name)}*${metaLine}\n   ${m.showtimes.join(" | ")}`;
  });

  return `${header}\n${count}\n\n${movieLines.join("\n\n")}`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}