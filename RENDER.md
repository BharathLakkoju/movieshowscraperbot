# Render Deployment

This project is set up for **Render Background Worker + Render Cron Job**.

## Why this setup

- The Telegram bot uses long-running polling, so it should run as a **Background Worker**.
- The daily digest should run as a **Cron Job**.
- A normal web service is not required for this app.

## Option A: Deploy with `render.yaml`

1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repository.
4. Render will read `render.yaml` and create:
   - `cineping-bot` worker
   - `cineping-daily-job` cron job

## Required environment variables

Set these values when prompted:

- `BOT_TOKEN`
- `DATABASE_URL`

## Schedule

The cron schedule in `render.yaml` is:

```cron
30 2 * * *
```

This is **2:30 AM UTC = 8:00 AM IST**.

## Manual setup in Render

If you don't want to use Blueprints:

### 1) Background Worker

- Runtime: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:worker`
- Environment variables:
  - `BOT_TOKEN`
  - `DATABASE_URL`
  - `ENABLE_BOT=true`
  - `ENABLE_SCHEDULER=false`

### 2) Cron Job

- Runtime: `Node`
- Build Command: `npm install && npm run build`
- Command: `npm run job:prod`
- Schedule: `30 2 * * *`
- Environment variables:
  - `BOT_TOKEN`
  - `DATABASE_URL`

## Database migration

Run this once after the first deploy:

```bash
npm run migrate
```

## Notes

- Render cron schedules use **UTC**.
- Keep `ENABLE_SCHEDULER=false` on the worker so the daily job only runs from the Render cron service.
