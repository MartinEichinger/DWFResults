import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database schema
export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      date TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      age_group TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS athletes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      club TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      athlete_id INTEGER NOT NULL,
      rank INTEGER,
      score REAL,
      judge_scores TEXT,
      difficulty REAL,
      execution REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (athlete_id) REFERENCES athletes(id)
    )
  `);
}

export interface Event {
  id: number;
  name: string;
  year: number;
  slug: string;
  date?: string;
  location?: string;
}

export interface Group {
  id: number;
  event_id: number;
  name: string;
  category?: string;
  age_group?: string;
}

export interface Athlete {
  id: number;
  name: string;
  club?: string;
}

export interface Result {
  id: number;
  group_id: number;
  athlete_id: number;
  rank?: number;
  score?: number;
  judge_scores?: string;
  difficulty?: number;
  execution?: number;
  athlete_name?: string;
  athlete_club?: string;
}
