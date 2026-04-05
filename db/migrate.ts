import { pool } from "./client.js";

async function migrate() {
  console.log("Running migrations...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT UNIQUE NOT NULL,
      theatres TEXT[] DEFAULT '{}',
      filters JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movies_cache (
      id SERIAL PRIMARY KEY,
      theatre TEXT NOT NULL,
      date DATE NOT NULL,
      data JSONB NOT NULL,
      fetched_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(theatre, date)
    );
  `);

  // Migrate existing users: if theatre column exists (old schema), move to theatres array
  try {
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'theatre'
    `);
    if (colCheck.rows.length > 0) {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS theatres TEXT[] DEFAULT '{}';
      `);
      await pool.query(`
        UPDATE users SET theatres = ARRAY[theatre] WHERE theatre IS NOT NULL AND theatre != '';
      `);
      await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS theatre;`);
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT '{}';
      `);
      console.log("Migrated old schema to new schema.");
    }
  } catch {
    // Columns already in new format
  }

  console.log("Migrations complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
