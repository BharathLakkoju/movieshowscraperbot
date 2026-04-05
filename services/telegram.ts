import axios from "axios";

const RATE_LIMIT_DELAY_MS = 35; // ~28 msgs/sec, under Telegram's 30/sec limit

let lastSentAt = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastSentAt;
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS - elapsed));
  }
  lastSentAt = Date.now();
}

export async function sendMessage(chatId: string | number, text: string, retries = 3): Promise<boolean> {
  await rateLimit();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }
      );
      return true;
    } catch (err: unknown) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;

      // Rate limited by Telegram — wait and retry
      if (status === 429) {
        const retryAfter = (axios.isAxiosError(err) ? (err.response?.data as { parameters?: { retry_after?: number } })?.parameters?.retry_after : undefined) ?? 5;
        console.warn(`Rate limited. Waiting ${retryAfter}s before retry ${attempt}/${retries}`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // User blocked bot or chat not found — don't retry
      if (status === 403 || status === 400) {
        console.warn(`Cannot send to ${chatId}: HTTP ${status}`);
        return false;
      }

      if (attempt === retries) {
        console.error(`Failed to send to ${chatId} after ${retries} attempts:`, err);
        return false;
      }

      // Exponential backoff for other errors
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  return false;
}