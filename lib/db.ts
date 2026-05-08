import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
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
      start_group_id INTEGER NOT NULL,
      start_group_title TEXT NOT NULL,
      actually_completed DATETIME,
      start_time DATETIME,
      area_sensitive_starting_place TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS group_participants (
      group_id INTEGER NOT NULL,
      athlete_id INTEGER NOT NULL,
      PRIMARY KEY (group_id, athlete_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (athlete_id) REFERENCES athletes(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS athletes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      club TEXT,
      gender TEXT,
      agegroup TEXT,
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
      rating1 REAL,
      rating2 REAL,
      rating3 REAL,
      rating4 REAL,
      rating5 REAL,
      rating6 REAL,
      rating7 REAL,
      rating8 REAL,
      standarddeviation REAL,
      mainrefereededuction REAL,
      mainrefereedeductionjustification TEXT,
      notshowedup INTEGER,
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
  start_group_id: number;
  start_group_title: string;
  actually_completed?: string;
}

export interface Athlete {
  id: number;
  name: string;
  club?: string;
  gender?: string;
  agegroup?: string;
}

export interface Result {
  id: number;
  group_id: number;
  athlete_id: number;
  rank?: number;
  score?: number;
  mainrefereededuction?: number;
  mainrefereedeductionjustification?: string;
  notshowedup?: boolean;
}
