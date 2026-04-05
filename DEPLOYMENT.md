# Free Deployment Flow

This project no longer uses Render.

## Recommended setup

Use this **free/low-cost split deployment**:

1. **Telegram bot** on an always-on machine
   - Oracle Cloud Always Free VM
   - your own PC
   - Raspberry Pi

2. **Daily cron job** from **GitHub Actions**
   - runs `npm run job` on a schedule
   - no need to keep the scheduler running inside the bot process

---

## Option A: Self-host the bot

### 1) Prepare the machine

Install:

- Node.js 20+
- Git

Clone the repo and install dependencies:

```bash
npm ci
npm run build
```

### 2) Configure environment

Create a `.env` file with:

```env
BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=your_database_url
ENABLE_BOT=true
ENABLE_SCHEDULER=false
```

### 3) Run migrations once

```bash
npm run migrate
```

### 4) Start the bot

```bash
npm run start:bot
```

If you want it to stay alive after reboot, use **PM2**.

### Windows / simplest fix

```bash
npm install -g pm2
pm2 start dist/index.js --name cineping-bot
pm2 save
```

### Using the included PM2 config

```bash
npx pm2 start ecosystem.config.cjs
npx pm2 save
```

If you previously started a broken PM2 process, clear it first:

```bash
npx pm2 delete cineping-bot
```

---

## Option B: Free daily cron with GitHub Actions

A workflow is included at:

```text
.github/workflows/daily-job.yml
```

### Setup steps

1. Push the repo to GitHub.
2. Open **GitHub -> Settings -> Secrets and variables -> Actions**.
3. Add these repository secrets:
   - `BOT_TOKEN`
   - `DATABASE_URL`
4. The workflow will run daily at:

```cron
30 2 * * *
```

That is **8:00 AM IST**.

You can also trigger it manually from the **Actions** tab.

---

## Simplest zero-cost approach

If you do not want any cloud platform at all:

- run the bot continuously on your own PC or a Raspberry Pi
- keep `ENABLE_SCHEDULER=true` if you want the app itself to handle the daily cron

---

## Notes

- GitHub Actions cron uses **UTC**.
- For private repos, scheduled jobs use your GitHub Actions minutes quota.
- If you later want a cloud VM, **Oracle Cloud Always Free** is usually the best no-cost option for this kind of long-running bot.
