import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database schema
export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS a_events (
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
    CREATE TABLE IF NOT EXISTS a_startgroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      startgroup_id INTEGER NOT NULL,
      actuallycompleted DATETIME,
      areaSensitiveStartingPlace TEXT,
      competitionarea INTEGER,
      plannedendtime DATETIME,
      simultaneousstarter TEXT,
      startgroupname TEXT NOT NULL,
      starttime DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES a_events(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS a_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      startgroup_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      agegroup TEXT,
      categoryname TEXT,
      gender TEXT,
      timelimit INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (startgroup_id) REFERENCES a_startgroups(id)
    
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS a_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      form_id INTEGER NOT NULL,
      agegroup TEXT,
      categoryname TEXT,
      club TEXT,
      depreferee1id TEXT,
      depreferee2id TEXT,
      depreferee3id TEXT,
      depreferee4id TEXT,
      endingtime DATETIME,
      finalscore REAL,
      gender TEXT,
      mainrefereededuction REAL,
      mainrefereedeductionjustification TEXT,
      name TEXT,
      notshowedup INTEGER,
      placement INTEGER,
      rating1 REAL,
      rating2 REAL,
      rating3 REAL,
      rating4 REAL,
      rating5 REAL,
      rating6 REAL,
      rating7 REAL,
      rating8 REAL,
      standarddeviation REAL,
      startingorder INTEGER,
      startingtime DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES a_categories(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS a_participants (
      id INTEGER PRIMARY KEY,
      participant_id INTEGER NOT NULL,
      forename TEXT NOT NULL,
      surname TEXT NOT NULL,
      name TEXT NOT NULL,
      club TEXT,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS a_forms_participants (
      form_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      PRIMARY KEY (form_id, participant_id),
      FOREIGN KEY (form_id) REFERENCES a_forms(id),
      FOREIGN KEY (participant_id) REFERENCES a_participants(id)
    )
  `);
}

export type TEvent = {
  id: number;
  name: string;
  year: number;
  slug: string;
  date: string | null;
  location: string | null;
  created_at?: string;
};

export type TStartgroup = {
  id: number;
  event_id?: number;
  startgroup_id?: number;
  actuallycompleted: string | null;
  areaSensitiveStartingPlace: string | null;
  competitionarea: number | null;
  plannedendtime: string | null;
  simultaneousstarter: string | null;
  startgroupname: string;
  starttime: string | null;
  created_at?: string;
  categories?: TCategory[];
};

export type TCategory = {
  id: number;
  startgroup_id?: number;
  category_id?: number;
  agegroup: string | null;
  categoryname: string | null;
  gender: string | null;
  timelimit: number | null;
  created_at?: string;
  forms?: TForm[];
};

export type TForm = {
  id: number;
  category_id?: number;
  form_id?: number;
  agegroup: string | null;
  categoryname: string | null;
  club: string | null;
  depreferee1id: string | null;
  depreferee2id: string | null;
  depreferee3id: string | null;
  depreferee4id: string | null;
  endingtime: string | null;
  finalscore: number | null;
  gender: string | null;
  mainrefereededuction: number | null;
  mainrefereedeductionjustification: string | null;
  name: string | null;
  notshowedup: number | null;
  placement: number | null;
  rating1: number | null;
  rating2: number | null;
  rating3: number | null;
  rating4: number | null;
  rating5: number | null;
  rating6: number | null;
  rating7: number | null;
  rating8: number | null;
  standarddeviation: number | null;
  startingorder: number | null;
  startingtime: string | null;
  created_at?: string;
  participants?: TParticipant[];
};

export type TParticipant = {
  id: number;
  participant_id?: number;
  forename: string;
  surname: string;
  name: string;
  club: string | null;
  gender: string | null;
  created_at?: string;
};
