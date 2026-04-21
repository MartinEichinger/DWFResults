import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { toSlug } from "@/lib/results";

type IncomingResult = {
  eventName: string;
  eventSlug?: string;
  year: number;
  groupName: string;
  rank: number;
  athleteName: string;
  clubName?: string;
  score?: number | null;
};

function isAuthorized(request: Request) {
  const configuredKey = process.env.INGEST_API_KEY;
  if (!configuredKey) {
    return true;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${configuredKey}`;
}

function parseRows(body: unknown): IncomingResult[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  if (Array.isArray(body)) {
    return body as IncomingResult[];
  }

  if (
    "results" in body &&
    Array.isArray((body as { results?: unknown[] }).results)
  ) {
    return (body as { results: IncomingResult[] }).results;
  }

  return [body as IncomingResult];
}

function hasValidShape(row: IncomingResult) {
  return (
    typeof row.eventName === "string" &&
    row.eventName.length > 0 &&
    Number.isInteger(row.year) &&
    typeof row.groupName === "string" &&
    row.groupName.length > 0 &&
    Number.isInteger(row.rank) &&
    typeof row.athleteName === "string" &&
    row.athleteName.length > 0
  );
}

export async function GET(request: Request) {
  await ensureSchema();

  const url = new URL(request.url);
  const event = url.searchParams.get("event");
  const year = url.searchParams.get("year");

  if (event && year) {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear)) {
      return NextResponse.json({ error: "year must be an integer" }, { status: 400 });
    }

    const response = await db.execute({
      sql: `
        SELECT event_name, event_slug, year, group_name, rank, athlete_name, club_name, score
        FROM results
        WHERE event_slug = ? AND year = ?
        ORDER BY group_name ASC, rank ASC, athlete_name ASC
      `,
      args: [event, parsedYear],
    });

    return NextResponse.json({
      results: response.rows,
    });
  }

  const response = await db.execute(`
    SELECT DISTINCT event_name, event_slug, year
    FROM results
    ORDER BY year DESC, event_name ASC
  `);

  return NextResponse.json({ events: response.rows });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureSchema();

  const body = await request.json().catch(() => null);
  const rows = parseRows(body);

  if (rows.length === 0) {
    return NextResponse.json({ error: "no results supplied" }, { status: 400 });
  }

  if (!rows.every(hasValidShape)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const eventName = rows[0].eventName;
  const year = rows[0].year;

  if (!rows.every((row) => row.eventName === eventName && row.year === year)) {
    return NextResponse.json(
      { error: "all rows must belong to the same eventName and year" },
      { status: 400 },
    );
  }

  const eventSlug = rows[0].eventSlug && rows[0].eventSlug.length > 0
    ? toSlug(rows[0].eventSlug)
    : toSlug(eventName);

  await db.batch(
    [
      {
        sql: "DELETE FROM results WHERE event_slug = ? AND year = ?",
        args: [eventSlug, year],
      },
      ...rows.map((row) => ({
        sql: `
          INSERT INTO results (
            event_slug,
            event_name,
            year,
            group_name,
            rank,
            athlete_name,
            club_name,
            score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          eventSlug,
          row.eventName.trim(),
          row.year,
          row.groupName.trim(),
          row.rank,
          row.athleteName.trim(),
          row.clubName?.trim() ?? null,
          row.score ?? null,
        ],
      })),
    ],
    "write",
  );

  return NextResponse.json({
    message: "results stored",
    eventSlug,
    year,
    count: rows.length,
  });
}
