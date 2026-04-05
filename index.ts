import dotenv from "dotenv";
dotenv.config();

import cron from "node-cron";
import { bot } from "./bot/index.js";
import { runJob } from "./jobs/dailyJob.js";

const enableBot = process.env.ENABLE_BOT !== "false";
const enableScheduler = process.env.ENABLE_SCHEDULER !== "false";
const cronSchedule = process.env.CRON_SCHEDULE ?? "0 8 * * *";
const cronTimezone = process.env.CRON_TIMEZONE ?? "Asia/Kolkata";

if (enableBot) {
  bot.launch();
  console.log("🤖 CinePing bot running...");
}

if (enableScheduler) {
  cron.schedule(
    cronSchedule,
    () => {
      console.log("⏰ Running scheduled daily job...");
      runJob().catch((err) => console.error("Scheduled job failed:", err));
    },
    { timezone: cronTimezone }
  );

  console.log(`⏰ Scheduler enabled: ${cronSchedule} (${cronTimezone})`);
}

if (!enableBot && !enableScheduler) {
  console.warn("Nothing to run: set ENABLE_BOT or ENABLE_SCHEDULER to true.");
}

if (enableBot) {
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}