import { db, ensureSchema } from "./db";

export type NavigationEntry = {
  eventSlug: string;
  eventName: string;
  year: number;
};

export type ResultRow = {
  rank: number;
  athleteName: string;
  clubName: string;
  score: number | null;
};

export type ResultGroup = {
  groupName: string;
  rows: ResultRow[];
};

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getNavigationEntries(): Promise<NavigationEntry[]> {
  await ensureSchema();

  const response = await db.execute(`
    SELECT DISTINCT event_slug, event_name, year
    FROM results
    ORDER BY year DESC, event_name ASC
  `);

  return response.rows.map((row) => ({
    eventSlug: String(row.event_slug),
    eventName: String(row.event_name),
    year: Number(row.year),
  }));
}

export async function getResultGroups(
  eventSlug: string,
  year: number,
): Promise<{ eventName: string | null; groups: ResultGroup[] }> {
  await ensureSchema();

  const response = await db.execute({
    sql: `
      SELECT event_name, group_name, rank, athlete_name, club_name, score
      FROM results
      WHERE event_slug = ? AND year = ?
      ORDER BY group_name ASC, rank ASC, athlete_name ASC
    `,
    args: [eventSlug, year],
  });

  let eventName: string | null = null;
  const groupsByName = new Map<string, ResultRow[]>();

  for (const row of response.rows) {
    if (!eventName) {
      eventName = String(row.event_name);
    }

    const groupName = String(row.group_name);
    const rows = groupsByName.get(groupName) ?? [];

    rows.push({
      rank: Number(row.rank),
      athleteName: String(row.athlete_name),
      clubName: row.club_name ? String(row.club_name) : "",
      score: row.score === null ? null : Number(row.score),
    });

    groupsByName.set(groupName, rows);
  }

  const groups = [...groupsByName.entries()].map(([groupName, rows]) => ({
    groupName,
    rows,
  }));

  return { eventName, groups };
}
