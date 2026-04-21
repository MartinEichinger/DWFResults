import { createClient } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:dwfresults.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url: databaseUrl,
  authToken,
});

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_slug TEXT NOT NULL,
      event_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      group_name TEXT NOT NULL,
      rank INTEGER NOT NULL,
      athlete_name TEXT NOT NULL,
      club_name TEXT,
      score REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(
    "CREATE INDEX IF NOT EXISTS idx_results_event_year ON results (event_slug, year)",
  );

  schemaReady = true;
}
