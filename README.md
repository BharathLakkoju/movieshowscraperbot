# CinePing 🎬

CinePing is a Telegram bot that sends **daily movie showtime updates** for selected theatres, with filters for **language** and **time slot**.

It currently focuses on popular theatres in **Hyderabad** and scrapes the latest showtimes from BookMyShow pages, caches them in PostgreSQL, and sends a daily digest to subscribed users.

---

## Features

- 🎭 Select one or more favourite theatres
- 🗣️ Filter by language: `Telugu`, `Hindi`, `English`
- 🕐 Filter by time slot: `morning`, `afternoon`, `evening`, `night`
- 📋 Fetch today's shows on demand with `/today`
- 🔔 Send a daily Telegram digest to all subscribed users
- 🗄️ Cache daily movie data in PostgreSQL

---

## Supported theatres

- Allu Cinemas Kokapet
- AMB Cinemas Gachibowli
- Prasads Large Screen
- Sandhya 70MM RTC X Roads
- Asian Radhika Multiplex

---

## Tech stack

- **Node.js + TypeScript**
- **Telegraf** for the Telegram bot
- **PostgreSQL / Neon** for persistence
- **node-cron** for scheduling
- **curl** for fetching BookMyShow pages reliably

---

## Project structure

```text
bot/         Telegram bot commands and menus
scraper/     BookMyShow scraping logic
db/          DB client, migrations, and queries
jobs/        Daily scraping + notification job
services/    Formatting and Telegram messaging
utils/       Filtering helpers
types/       Shared types and theatre config
```

---

## Environment variables

Create a `.env` file based on `.env.example`:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
ENABLE_BOT=true
ENABLE_SCHEDULER=false
CRON_SCHEDULE=0 8 * * *
CRON_TIMEZONE=Asia/Kolkata
```

---

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and fill in your values.

### 3) Run DB migrations

```bash
npm run migrate
```

### 4) Start the bot in development

```bash
npm run dev
```

### 5) Build for production

```bash
npm run build
npm start
```

---

## Available scripts

| Command             | Purpose                         |
| ------------------- | ------------------------------- |
| `npm run dev`       | Run the bot in development mode |
| `npm run build`     | Compile TypeScript to `dist/`   |
| `npm start`         | Start the compiled app          |
| `npm run start:bot` | Start the compiled bot          |
| `npm run migrate`   | Run database migrations         |
| `npm run job`       | Run the daily job in TypeScript |
| `npm run job:prod`  | Run the compiled daily job      |

---

## Bot commands

- `/start` — open the setup menu
- `/theatres` — choose theatres
- `/filters` — set language and time-slot filters
- `/today` — get today's shows
- `/settings` — view saved preferences
- `/help` — list commands

---

## Deployment

The recommended low-cost flow for this repo is:

1. **Run the bot** on your own PC, Raspberry Pi, or a free VM
2. **Run the daily digest job** using GitHub Actions cron

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full setup.

### PM2 example (Windows)

```bash
npm run build
pm2 start dist/index.js --name cineping-bot
pm2 save
```

---

## Notes

- GitHub Actions cron schedules run in **UTC**
- This project relies on `curl` for fetching showtime data
- Make sure your machine has internet access and valid Telegram/Postgres credentials

---

## Disclaimer

This project is an independent utility and is **not affiliated with BookMyShow**.
