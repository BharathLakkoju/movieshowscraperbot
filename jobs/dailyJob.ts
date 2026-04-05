import dotenv from "dotenv";
dotenv.config();

import { getUsers, getActiveTheatres, cacheShowtimes, getCachedShowtimes } from "../db/queries.js";
import { fetchShows } from "../scraper/bookmyshow.js";
import { applyFilters } from "../utils/filter.js";
import { formatDailyDigest } from "../services/formatter.js";
import { sendMessage } from "../services/telegram.js";
import { pool } from "../db/client.js";

const APP_TIMEZONE = process.env.APP_TIMEZONE ?? process.env.CRON_TIMEZONE ?? "Asia/Kolkata";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
};

async function scrapeAndCache(): Promise<void> {
  const theatres = await getActiveTheatres();
  console.log(`Scraping ${theatres.length} active theatre(s)...`);

  for (const theatre of theatres) {
    console.log(`  Scraping: ${theatre}`);
    try {
      const movies = await fetchShows(theatre);
      if (movies.length > 0) {
        await cacheShowtimes(theatre, today(), movies);
        console.log(`  ✅ Cached ${movies.length} movies for ${theatre}`);
      } else {
        console.warn(`  ⚠️ No movies found for ${theatre}, keeping old cache`);
      }
    } catch (err) {
      console.error(`  ❌ Scrape failed for ${theatre}:`, err);
    }
  }
}

async function sendNotifications(): Promise<void> {
  const users = await getUsers();
  let sent = 0;
  let failed = 0;

  console.log(`Sending notifications to ${users.length} user(s)...`);

  for (const user of users) {
    if (!user.theatres || user.theatres.length === 0) continue;

    const messages: string[] = [];

    for (const theatre of user.theatres) {
      const movies = await getCachedShowtimes(theatre, today());
      const filtered = applyFilters(movies, user.filters);
      messages.push(formatDailyDigest(theatre, filtered));
    }

    const fullMessage = `🎬 *Good Morning! Here are today's shows:*\n\n${messages.join("\n\n━━━━━━━━━━━━━━━\n\n")}`;

    const success = await sendMessage(user.chat_id, fullMessage);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log(`Notifications sent: ${sent}, failed: ${failed}`);
}

export async function runJob(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Daily job started for ${today()} (${APP_TIMEZONE})`);

  await scrapeAndCache();
  await sendNotifications();

  console.log(`[${new Date().toISOString()}] Daily job completed for ${today()} (${APP_TIMEZONE})`);
}

// When run directly (e.g., from GitHub Actions cron)
const isDirectRun = process.argv[1]?.includes("dailyJob");
if (isDirectRun) {
  runJob()
    .catch((err) => {
      console.error("Daily job failed:", err);
      process.exit(1);
    })
    .finally(() => pool.end());
}