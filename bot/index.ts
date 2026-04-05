import { Telegraf, Markup } from "telegraf";
import { upsertUser, getUser, setTheatres, setFilters, getCachedShowtimes, cacheShowtimes } from "../db/queries.js";
import { fetchShows } from "../scraper/bookmyshow.js";
import { THEATRES, LANGUAGES, TIME_SLOTS } from "../types/index.js";
import type { UserFilters, TimeSlot } from "../types/index.js";
import { applyFilters } from "../utils/filter.js";
import { formatMessage } from "../services/formatter.js";

export const bot = new Telegraf(process.env.BOT_TOKEN!);

// --- /start ---
bot.start(async (ctx) => {
  await upsertUser(ctx.chat.id);
  await ctx.reply(
    "🎬 *Welcome to CinePing\\!*\n\nI send you daily movie showtimes for your favourite theatres\\.\n\nLet's set you up:",
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🎭 Select Theatres", "theatres")],
        [Markup.button.callback("🔍 Filters (Language/Time)", "filters")],
        [Markup.button.callback("📋 Today's Shows", "today")],
        [Markup.button.callback("⚙️ Settings", "settings")],
      ]),
    }
  );
});

// --- /help ---
bot.help(async (ctx) => {
  await ctx.reply(
    "🎬 *CinePing Commands*\n\n" +
      "/start — Setup & main menu\n" +
      "/theatres — Select your theatres\n" +
      "/filters — Set language & time preferences\n" +
      "/today — Get today's showtimes\n" +
      "/settings — View your settings\n" +
      "/help — Show this help",
    { parse_mode: "Markdown" }
  );
});

// --- /theatres command ---
bot.command("theatres", (ctx) => showTheatreSelection(ctx));
bot.action("theatres", (ctx) => {
  ctx.answerCbQuery();
  showTheatreSelection(ctx);
});

async function showTheatreSelection(ctx: any) {
  const user = await getUser(ctx.chat!.id);
  const selected = user?.theatres ?? [];

  const buttons = THEATRES.map((t) => {
    const check = selected.includes(t.name) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${t.name}`, `t_${t.code}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "t_done")]);

  await ctx.reply("🎭 *Select your theatres:*\n(Tap to toggle, then tap Done)", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
}

// Toggle theatre selection
bot.action(/^t_([A-Z0-9]+)$/, async (ctx) => {
  const code = ctx.match[1]!;
  if (code === "done") return; // handled separately

  const theatre = THEATRES.find((t) => t.code === code);
  if (!theatre) {
    await ctx.answerCbQuery("Unknown theatre");
    return;
  }

  const user = await getUser(ctx.chat!.id);
  const current = user?.theatres ?? [];
  const updated = current.includes(theatre.name)
    ? current.filter((t) => t !== theatre.name)
    : [...current, theatre.name];

  await setTheatres(ctx.chat!.id, updated);

  // Re-render buttons
  const buttons = THEATRES.map((t) => {
    const check = updated.includes(t.name) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${t.name}`, `t_${t.code}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "t_done")]);

  await ctx.editMessageText("🎭 *Select your theatres:*\n(Tap to toggle, then tap Done)", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
  await ctx.answerCbQuery(`${updated.includes(theatre.name) ? "Added" : "Removed"} ${theatre.name}`);
});

bot.action("t_done", async (ctx) => {
  const user = await getUser(ctx.chat!.id);
  const theatres = user?.theatres ?? [];
  await ctx.answerCbQuery();
  if (theatres.length === 0) {
    await ctx.editMessageText("⚠️ No theatres selected. Use /theatres to pick some.");
  } else {
    await ctx.editMessageText(`✅ Theatres saved:\n${theatres.map((t) => `• ${t}`).join("\n")}\n\nUse /filters to set preferences, or /today for shows.`);
  }
});

// --- /filters command ---
bot.command("filters", (ctx) => showFilterMenu(ctx));
bot.action("filters", (ctx) => {
  ctx.answerCbQuery();
  showFilterMenu(ctx);
});

async function showFilterMenu(ctx: any) {
  await ctx.reply("🔍 *Set your filters:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🗣️ Language", "fl_menu")],
      [Markup.button.callback("🕐 Time Slot", "ft_menu")],
      [Markup.button.callback("🗑️ Clear All Filters", "f_clear")],
    ]),
  });
}

// Language filter menu
bot.action("fl_menu", async (ctx) => {
  const user = await getUser(ctx.chat!.id);
  const filters: UserFilters = user?.filters ?? {};
  const selected = filters.languages ?? [];

  const buttons = LANGUAGES.map((lang) => {
    const check = selected.includes(lang) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${lang}`, `fl_${lang}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "fl_done")]);

  await ctx.editMessageText("🗣️ *Select languages:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
  await ctx.answerCbQuery();
});

bot.action(/^fl_(Telugu|Hindi|English)$/, async (ctx) => {
  const lang = ctx.match[1]!;
  const user = await getUser(ctx.chat!.id);
  const filters: UserFilters = user?.filters ?? {};
  const current = filters.languages ?? [];
  const updated = current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang];

  await setFilters(ctx.chat!.id, { ...filters, languages: updated });

  const buttons = LANGUAGES.map((l) => {
    const check = updated.includes(l) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${l}`, `fl_${l}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "fl_done")]);

  await ctx.editMessageText("🗣️ *Select languages:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
  await ctx.answerCbQuery(`${updated.includes(lang) ? "Added" : "Removed"} ${lang}`);
});

bot.action("fl_done", async (ctx) => {
  await ctx.answerCbQuery("Languages saved!");
  await ctx.editMessageText("✅ Language filters saved. Use /filters for more options.");
});

// Time slot filter menu
bot.action("ft_menu", async (ctx) => {
  const user = await getUser(ctx.chat!.id);
  const filters: UserFilters = user?.filters ?? {};
  const selected = filters.timeSlots ?? [];

  const buttons = TIME_SLOTS.map((slot) => {
    const check = selected.includes(slot.value) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${slot.label}`, `ft_${slot.value}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "ft_done")]);

  await ctx.editMessageText("🕐 *Select time slots:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
  await ctx.answerCbQuery();
});

bot.action(/^ft_(morning|afternoon|evening|night)$/, async (ctx) => {
  const slot = ctx.match[1]! as TimeSlot;
  const user = await getUser(ctx.chat!.id);
  const filters: UserFilters = user?.filters ?? {};
  const current = filters.timeSlots ?? [];
  const updated = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];

  await setFilters(ctx.chat!.id, { ...filters, timeSlots: updated });

  const buttons = TIME_SLOTS.map((s) => {
    const check = updated.includes(s.value) ? "✅" : "⬜";
    return [Markup.button.callback(`${check} ${s.label}`, `ft_${s.value}`)];
  });
  buttons.push([Markup.button.callback("✔️ Done", "ft_done")]);

  await ctx.editMessageText("🕐 *Select time slots:*", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard(buttons),
  });
  await ctx.answerCbQuery(`${updated.includes(slot) ? "Added" : "Removed"} ${slot}`);
});

bot.action("ft_done", async (ctx) => {
  await ctx.answerCbQuery("Time slots saved!");
  await ctx.editMessageText("✅ Time slot filters saved. Use /filters for more options.");
});

bot.action("f_clear", async (ctx) => {
  await setFilters(ctx.chat!.id, {});
  await ctx.answerCbQuery("Filters cleared!");
  await ctx.editMessageText("🗑️ All filters cleared. Use /filters to set new ones.");
});

// --- /today command ---
bot.command("today", (ctx) => showToday(ctx));
bot.action("today", (ctx) => {
  ctx.answerCbQuery();
  showToday(ctx);
});

async function showToday(ctx: any) {
  const user = await getUser(ctx.chat!.id);
  if (!user || !user.theatres || user.theatres.length === 0) {
    await ctx.reply("⚠️ No theatres selected. Use /theatres first.");
    return;
  }

  const today = new Date().toISOString().split("T")[0]!;
  await ctx.reply("⏳ Fetching today's shows...");

  for (const theatre of user.theatres) {
    let movies = await getCachedShowtimes(theatre, today);

    // On-demand scrape if today's cache is empty
    if (movies.length === 0) {
      try {
        movies = await fetchShows(theatre);
        if (movies.length > 0) {
          await cacheShowtimes(theatre, today, movies);
        }
      } catch (err) {
        console.error(`On-demand scrape failed for ${theatre}:`, err);
      }
    }

    if (movies.length === 0) {
      await ctx.reply(`📍 *${theatre}*\n\n❌ No shows found for today.`, {
        parse_mode: "Markdown",
      });
      continue;
    }

    const filtered = applyFilters(movies, user.filters);
    const msg = formatMessage(theatre, filtered);
    await ctx.reply(msg, { parse_mode: "Markdown" });
  }
}

// --- /settings command ---
bot.command("settings", (ctx) => showSettings(ctx));
bot.action("settings", (ctx) => {
  ctx.answerCbQuery();
  showSettings(ctx);
});

async function showSettings(ctx: any) {
  const user = await getUser(ctx.chat!.id);
  if (!user) {
    await ctx.reply("Please /start first.");
    return;
  }

  const theatres = user.theatres.length > 0 ? user.theatres.map((t) => `• ${t}`).join("\n") : "None selected";
  const filters: UserFilters = user.filters ?? {};
  const langs = filters.languages?.length ? filters.languages.join(", ") : "All";
  const times = filters.timeSlots?.length ? filters.timeSlots.join(", ") : "All";

  await ctx.reply(
    `⚙️ *Your Settings*\n\n🎭 *Theatres:*\n${theatres}\n\n🗣️ *Languages:* ${langs}\n🕐 *Time Slots:* ${times}`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🎭 Change Theatres", "theatres")],
        [Markup.button.callback("🔍 Change Filters", "filters")],
      ]),
    }
  );
}