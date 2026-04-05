# Railway Deployment

## 1) Create a Railway service

- Deploy this repo to Railway
- Railway will use `railway.json`
- Build command: `npm run build`
- Start command: `npm start`

## 2) Add environment variables

Set these in Railway:

- `BOT_TOKEN`
- `DATABASE_URL`
- `ENABLE_BOT=true`
- `ENABLE_SCHEDULER=true`
- `CRON_SCHEDULE=0 8 * * *`
- `CRON_TIMEZONE=Asia/Kolkata`

## 3) Run database migration once

Use the Railway shell or a one-off command:

```bash
npm run migrate
```

## 4) Recommended production setup

### Single service

Use one always-on Railway service:

- bot polling runs continuously
- in-process cron runs daily

### Optional split services

If you want separate services:

#### Bot service

- `ENABLE_BOT=true`
- `ENABLE_SCHEDULER=false`
- start command: `npm start`

#### Scheduler service

- `ENABLE_BOT=false`
- `ENABLE_SCHEDULER=true`
- start command: `npm start`

## 5) Manual job run

To run the digest job manually:

```bash
npm run job
```

Or after build:

```bash
npm run job:prod
```
