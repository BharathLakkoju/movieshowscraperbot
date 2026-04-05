import { pool } from "./client.js";
import type { User, UserFilters, TheatreShowtimes, Movie } from "../types/index.js";

export async function upsertUser(chatId: number): Promise<void> {
  await pool.query(
    `INSERT INTO users (chat_id)
     VALUES ($1)
     ON CONFLICT (chat_id) DO NOTHING`,
    [chatId]
  );
}

export async function getUser(chatId: number): Promise<User | null> {
  const res = await pool.query(`SELECT * FROM users WHERE chat_id = $1`, [chatId]);
  return (res.rows[0] as User | undefined) ?? null;
}

export async function getUsers(): Promise<User[]> {
  const res = await pool.query(`SELECT * FROM users`);
  return res.rows as User[];
}

export async function setTheatres(chatId: number, theatres: string[]): Promise<void> {
  await pool.query(
    `UPDATE users SET theatres = $1 WHERE chat_id = $2`,
    [theatres, chatId]
  );
}

export async function setFilters(chatId: number, filters: UserFilters): Promise<void> {
  await pool.query(
    `UPDATE users SET filters = $1 WHERE chat_id = $2`,
    [JSON.stringify(filters), chatId]
  );
}

export async function getActiveTheatres(): Promise<string[]> {
  const res = await pool.query(
    `SELECT DISTINCT unnest(theatres) AS theatre FROM users WHERE array_length(theatres, 1) > 0`
  );
  return res.rows.map((r: { theatre: string }) => r.theatre);
}

export async function cacheShowtimes(theatre: string, date: string, movies: Movie[]): Promise<void> {
  await pool.query(
    `INSERT INTO movies_cache (theatre, date, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (theatre, date) DO UPDATE SET data = $3, fetched_at = NOW()`,
    [theatre, date, JSON.stringify(movies)]
  );
}

export async function getCachedShowtimes(theatre: string, date: string): Promise<Movie[]> {
  const res = await pool.query(
    `SELECT data FROM movies_cache WHERE theatre = $1 AND date = $2`,
    [theatre, date]
  );
  if (res.rows.length === 0) return [];
  return res.rows[0]!.data as Movie[];
}