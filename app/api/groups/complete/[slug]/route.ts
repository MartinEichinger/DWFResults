import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

// API endpoint for external data import
// Accepts JSON data with events, groups, athletes, and results
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		await initDatabase();
		const { slug } = await params;

		// Get API key from Authorization header ("Bearer <token>")
		const authHeader = request.headers.get("Authorization");
		const apiKey = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		// Basic API key validation (in production, use environment variable)
		if (apiKey !== process.env.API_KEY) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const data = await request.json();

		// 1. Event anhand des Slugs finden
		const eventResult = await db.execute({
			sql: "SELECT id FROM events WHERE slug = ?",
			args: [slug],
		});

		if (eventResult.rows.length === 0) {
			return NextResponse.json(
				{ error: `Event not found for slug: ${slug}` },
				{ status: 404 },
			);
		}

		const eventId = eventResult.rows[0].id;

		// 2. Gruppe einfügen oder aktualisieren
		const groupResult = await db.execute({
			sql: `
				INSERT INTO groups (event_id, start_group_id, start_group_title, actually_completed)
				VALUES (?, ?, ?, ?)
				ON CONFLICT DO NOTHING
			`,
			args: [
				eventId,
				data.startgroupId,
				data.groupTitle,
				data.actuallycompleted ?? null,
			],
		});

		// Gruppen-ID ermitteln (neu eingefügt oder bereits vorhanden)
		let groupId = groupResult.lastInsertRowid ?? undefined;
		if (!groupId) {
			const existingGroup = await db.execute({
				sql: "SELECT id FROM groups WHERE event_id = ? AND start_group_id = ?",
				args: [eventId, data.startgroupId],
			});
			groupId = existingGroup.rows[0].id as bigint;
		}

		// 3. Athleten + Teilnahmen einfügen
		if (Array.isArray(data.participants)) {
			for (const p of data.participants) {
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
					args: [
						p.id,
						p.name,
						p.club ?? null,
						p.gender ?? null,
						p.agegroup ?? null,
					],
				});

				// Teilnahme in group_participants einfügen (Duplikate ignorieren)
				await db.execute({
					sql: `
						INSERT INTO group_participants (group_id, athlete_id)
						VALUES (?, ?)
						ON CONFLICT DO NOTHING
					`,
					args: [groupId, p.id],
				});

				// Ergebnis einfügen oder aktualisieren
				await db.execute({
					sql: `
						INSERT INTO results (group_id, athlete_id, rank, score, notshowedup, mainrefereededuction, mainrefereedeductionjustification)
						VALUES (?, ?, ?, ?, ?, ?, ?)
						ON CONFLICT DO NOTHING
					`,
					args: [
						groupId,
						p.id,
						p.placement ?? null,
						p.finalscore ?? null,
						p.notshowedup ?? false,
						p.mainrefereededuction ?? null,
						p.mainrefereedeductionjustification ??
							null,
					],
				});
			}
		}

		return NextResponse.json({
			success: true,
			groupId: groupId?.toString(),
		});
	} catch (error) {
		console.error("Error importing data:", error);
		return NextResponse.json(
			{ error: "Invalid request" },
			{ status: 400 },
		);
	}
}
