import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

const debug = 1;

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

    const data = await request.json();

    // 1. Event anhand des Slugs finden
    const eventResult = await db.execute({
      sql: "SELECT id FROM events WHERE slug = ?",
      args: [slug],
    });

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: `Event not found for slug: ${slug}` }, { status: 404 });
    }

    const eventId = eventResult.rows[0].id;

    // 2. Gruppe einfügen oder aktualisieren
    if (data.groups && Array.isArray(data.groups)) {
      for (const group of data.groups) {
        // Insert group
        const groupResult = await db.execute({
          sql: `
				    INSERT INTO groups (event_id, start_group_id, start_group_title, actually_completed)
				    VALUES (?, ?, ?, ?)
				    ON CONFLICT DO NOTHING
			    `,
          args: [eventId, data.startgroupId, data.groupTitle, data.actuallycompleted ?? null],
        });

        const groupId = groupResult.lastInsertRowid;

        // 3. Athleten + Teilnahmen einfügen
        if (Array.isArray(group.results)) {
          for (const p of group.results) {
            // Athlet einfügen oder vorhandenen aktualisieren
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
              args: [p.athlete_id, p.name, p.club ?? null, p.gender ?? null, p.agegroup ?? null],
            });

            // Teilnahme in group_participants einfügen (Duplikate ignorieren)
            await db.execute({
              sql: `
                INSERT INTO group_participants (group_id, athlete_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                `,
              args: [groupId, p.athlete_id],
            });

            // Ergebnis einfügen oder aktualisieren
            await db.execute({
              sql: `
                INSERT INTO results (group_id, athlete_id, rank, score, rating1, rating2, rating3, rating4, rating5, rating6, rating7, rating8, standarddeviation, notshowedup, mainrefereededuction, mainrefereedeductionjustification)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT DO NOTHING
              `,
              args: [
                groupId,
                p.id,
                p.placement ?? null,
                p.finalscore ?? null,
                p.rating1 ?? null,
                p.rating2 ?? null,
                p.rating3 ?? null,
                p.rating4 ?? null,
                p.rating5 ?? null,
                p.rating6 ?? null,
                p.rating7 ?? null,
                p.rating8 ?? null,
                p.standarddeviation ?? null,
                p.notshowedup ?? false,
                p.mainrefereededuction ?? null,
                p.mainrefereedeductionjustification ?? null,
              ],
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json({ error: "Failed to import data", details: String(error) }, { status: 500 });
  }
}
