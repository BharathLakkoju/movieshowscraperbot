import { execFileSync } from "node:child_process";
import type { Movie, TheatreConfig } from "../types/index.js";
import { THEATRES } from "../types/index.js";

function getTheatreConfig(theatreName: string): TheatreConfig | undefined {
  return THEATRES.find((t) => t.name === theatreName);
}

function todayDateStr(): string {
  const timeZone = process.env.APP_TIMEZONE ?? process.env.CRON_TIMEZONE ?? "Asia/Kolkata";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}${month}${day}`;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface BmsShowTime {
  ShowTime?: string;
  ShowDateCode?: string;
}

interface BmsChildEvent {
  EventLanguage?: string;
  EventDimension?: string;
  ShowTimes?: BmsShowTime[];
}

interface BmsEvent {
  EventTitle?: string;
  ChildEvents?: BmsChildEvent[];
}

function fetchPageHtml(url: string): string {
  // Cloudflare blocks Node.js HTTP clients via TLS fingerprinting.
  // curl has a valid TLS fingerprint that passes Cloudflare checks.
  const result = execFileSync("curl", [
    "-sL",
    "--compressed",
    "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "-H", "Accept: text/html,application/xhtml+xml",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "--max-time", "30",
    url,
  ], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
  return result;
}

function extractEventArray(html: string): BmsEvent[] {
  // The BMS cinema page embeds Redux state in the HTML.
  // The Event array lives inside showDetailsTransformed.Event
  const marker = `"showDetailsTransformed"`;
  const idx = html.indexOf(marker);
  if (idx === -1) return [];

  // Find "Event":[ after the marker
  const eventKey = `"Event":[`;
  const eventIdx = html.indexOf(eventKey, idx);
  if (eventIdx === -1) return [];

  const arrayStart = eventIdx + eventKey.length - 1; // position of '['

  // Bracket-match to find the end of the array
  let depth = 0;
  let arrayEnd = -1;
  for (let i = arrayStart; i < html.length; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  if (arrayEnd === -1) return [];

  const jsonStr = html.substring(arrayStart, arrayEnd + 1);
  try {
    return JSON.parse(jsonStr) as BmsEvent[];
  } catch {
    console.error("Failed to parse Event array JSON");
    return [];
  }
}

export async function fetchShows(theatreName?: string): Promise<Movie[]> {
  const config = theatreName ? getTheatreConfig(theatreName) : THEATRES[0];
  if (!config) return [];

  const dateStr = todayDateStr();
  const slug = config.slug ?? toSlug(config.name);
  const citySlug = config.city.toLowerCase();
  const regionLower = config.region.toLowerCase();

  // Some theatres need an explicit BMS booking path override.
  const url = config.bookingPath
    ? `https://in.bookmyshow.com${config.bookingPath}/${dateStr}`
    : `https://in.bookmyshow.com/buytickets/${slug}-${citySlug}/cinema-${regionLower}-${config.code}-MT/${dateStr}`;

  try {
    console.log(`Fetching: ${url}`);
    const html = fetchPageHtml(url);

    if (html.length < 1000) {
      console.error(`Received short response (${html.length} chars) for ${config.name}`);
      return [];
    }

    const events = extractEventArray(html);
    if (events.length === 0) {
      console.log(`No events found for ${config.name} on ${dateStr}`);
      return [];
    }

    console.log(`Found ${events.length} event(s) for ${config.name}`);
    return parseEvents(events, dateStr);
  } catch (err) {
    console.error(`Scraper failed for ${config.name}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

function parseEvents(events: BmsEvent[], dateStr: string): Movie[] {
  const movies: Movie[] = [];

  for (const event of events) {
    const title = event.EventTitle ?? "";
    if (!title) continue;

    const children = event.ChildEvents ?? [];
    for (const child of children) {
      const language = child.EventLanguage ?? "";
      const format = child.EventDimension ?? "2D";

      const showtimes: string[] = [];
      for (const st of child.ShowTimes ?? []) {
        if (st.ShowTime && (!st.ShowDateCode || st.ShowDateCode === dateStr)) {
          showtimes.push(st.ShowTime);
        }
      }

      if (showtimes.length > 0) {
        movies.push({ name: title, language, format, showtimes });
      }
    }
  }

  return movies;
}