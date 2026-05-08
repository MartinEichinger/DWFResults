import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

const debug = 1;

type SqlArg = string | number | bigint | boolean | Uint8Array | ArrayBuffer | Date | null;

type CompleteResultPayload = {
  athlete_id?: number | string;
  id?: number | string;
  name?: string;
  club?: string | null;
  gender?: string | null;
  agegroup?: string | null;
  rank?: number | string | null;
  placement?: number | string | null;
  finalscore?: number | string | null;
  rating1?: number | string | null;
  rating2?: number | string | null;
  rating3?: number | string | null;
  rating4?: number | string | null;
  rating5?: number | string | null;
  rating6?: number | string | null;
  rating7?: number | string | null;
  rating8?: number | string | null;
  standarddeviation?: number | string | null;
  notshowedup?: boolean | null;
  mainrefereededuction?: number | string | null;
  mainrefereedeductionjustification?: string | null;
};

type CompleteGroupPayload = {
  groupTitle?: string;
  startgroupId?: number | string;
  actuallycompleted?: string | Date | null;
  results?: CompleteResultPayload[];
};

function toSqlArg(value: unknown): SqlArg {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean" ||
    value instanceof Uint8Array ||
    value instanceof ArrayBuffer ||
    value instanceof Date
  ) {
    return value;
  }

  return String(value);
}

function toRequiredInteger(value: unknown, label: string): number {
  const numericValue = typeof value === "bigint" ? Number(value) : typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isSafeInteger(numericValue)) {
    throw new TypeError(`Invalid ${label}`);
  }

  return numericValue;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = typeof value === "bigint" ? Number(value) : typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    throw new TypeError("Invalid numeric value in group result payload");
  }

  return numericValue;
}

// API endpoint for external data import
// Accepts JSON data with events, groups, athletes, and results
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await initDatabase();
    const { slug } = await params;

    // Get API key from Authorization header ("Bearer <token>")
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (debug > 0) console.log("groups/complete/POST: ", slug, apiKey, process.env.API_KEY);

    // Basic API key validation (in production, use environment variable)
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await request.json()) as { groups?: CompleteGroupPayload[] } & CompleteGroupPayload;

    // 1. Event anhand des Slugs finden
    const eventResult = await db.execute({
      sql: "SELECT id FROM events WHERE slug = ?",
      args: [slug],
    });

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: `Event not found for slug: ${slug}` }, { status: 404 });
    }

    const eventId = toRequiredInteger(eventResult.rows[0].id, "event id");

    // 2. Gruppe einfügen oder aktualisieren
    const groups = Array.isArray(data.groups) ? data.groups : [data];

    for (const group of groups) {
      const startGroupId = toRequiredInteger(group.startgroupId, "group startgroupId");
      const groupTitle = typeof group.groupTitle === "string" ? group.groupTitle.trim() : "";

      if (!groupTitle) {
        throw new TypeError("Missing groupTitle");
      }

      if (debug > 0) console.log("groups/complete/POST-group: ", group);

      const groupResult = await db.execute({
        sql: `
				INSERT INTO groups (event_id, start_group_id, start_group_title, actually_completed)
				VALUES (?, ?, ?, ?)
				ON CONFLICT DO NOTHING
			`,
        args: [eventId, startGroupId, groupTitle, toSqlArg(group.actuallycompleted ?? null)],
      });

      let groupId = groupResult.lastInsertRowid ? toRequiredInteger(groupResult.lastInsertRowid, "group id") : null;

      if (groupId === null) {
        const existingGroup = await db.execute({
          sql: `
				SELECT id
				FROM groups
				WHERE event_id = ? AND start_group_id = ?
				ORDER BY id DESC
				LIMIT 1
			`,
          args: [eventId, startGroupId],
        });

        if (existingGroup.rows.length === 0) {
          throw new Error(`Could not resolve group id for start group ${startGroupId}`);
        }

        groupId = toRequiredInteger(existingGroup.rows[0].id, "group id");
      }

      if (!Array.isArray(group.results)) {
        continue;
      }

      for (const participant of group.results) {
        const athleteId = toRequiredInteger(participant.athlete_id ?? participant.id, "participant athlete_id");
        const athleteName = typeof participant.name === "string" ? participant.name.trim() : "";

        if (!athleteName) {
          throw new TypeError(`Missing athlete name for athlete ${athleteId}`);
        }

        await db.execute({
          sql: `
            INSERT INTO athletes (id, name, club, gender, agegroup)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              club = excluded.club,
              gender = excluded.gender,
              agegroup = excluded.agegroup
          `,
          args: [athleteId, athleteName, toSqlArg(participant.club ?? null), toSqlArg(participant.gender ?? null), toSqlArg(participant.agegroup ?? null)],
        });

        await db.execute({
          sql: `
            INSERT INTO group_participants (group_id, athlete_id)
            VALUES (?, ?)
            ON CONFLICT DO NOTHING
          `,
          args: [groupId, athleteId],
        });

        await db.execute({
          sql: `
            INSERT INTO results (group_id, athlete_id, rank, score, rating1, rating2, rating3, rating4, rating5, rating6, rating7, rating8, standarddeviation, notshowedup, mainrefereededuction, mainrefereedeductionjustification)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT DO NOTHING
          `,
          args: [
            groupId,
            athleteId,
            toOptionalNumber(participant.rank ?? participant.placement),
            toOptionalNumber(participant.finalscore),
            toOptionalNumber(participant.rating1),
            toOptionalNumber(participant.rating2),
            toOptionalNumber(participant.rating3),
            toOptionalNumber(participant.rating4),
            toOptionalNumber(participant.rating5),
            toOptionalNumber(participant.rating6),
            toOptionalNumber(participant.rating7),
            toOptionalNumber(participant.rating8),
            toOptionalNumber(participant.standarddeviation),
            participant.notshowedup ?? false,
            toOptionalNumber(participant.mainrefereededuction),
            toSqlArg(participant.mainrefereedeductionjustification ?? null),
          ],
        });
      }
    }

    return NextResponse.json({ success: true, message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json({ error: "Failed to import data", details: String(error) }, { status: 500 });
  }
}
