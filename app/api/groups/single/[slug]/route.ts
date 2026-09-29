import { NextResponse } from "next/server";
import { db, initDatabase, TStartgroup } from "@/lib/db";
import { touchEvent } from "@/lib/queries";

// Imports write a lot of rows, but must never run unbounded.
export const maxDuration = 60;

const debug = 0;

type SqlArg = string | number | bigint | boolean | Uint8Array | ArrayBuffer | Date | null;

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

// API endpoint for external data import
// Accepts a single startgroup (or a list of startgroups) with categories, forms and participants
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await initDatabase();
    const { slug } = await params;

    // Get API key from Authorization header ("Bearer <token>")
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (debug > 0) console.log("groups/single/POST: ", slug, apiKey, process.env.API_KEY);

    // Basic API key validation (in production, use environment variable)
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await request.json()) as { groups?: TStartgroup[] } & TStartgroup;

    // 1. Event anhand des Slugs finden
    const eventResult = await db.execute({
      sql: "SELECT id FROM a_events WHERE slug = ?",
      args: [slug],
    });

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: `Event not found for slug: ${slug}` }, { status: 404 });
    }

    const eventId = toRequiredInteger(eventResult.rows[0].id, "event id");

    // 2. Gruppe einfügen oder aktualisieren
    const groups = Array.isArray(data.groups) ? data.groups : [data];

    if (debug > 0) console.log("groups/single/POST: ", groups);

    for (const group of groups) {
      const startGroupId = toRequiredInteger(group.id, "group startgroupId");
      const startgroupname = typeof group.startgroupname === "string" ? group.startgroupname.trim() : "";

      if (!startgroupname) {
        throw new TypeError("Missing startgroupname");
      }

      if (debug > 0) console.log("groups/single/startgroup: ", group);

      const startGroupResult = await db.execute({
        sql: `
          INSERT INTO a_startgroups (event_id, startgroup_id, actuallycompleted, areaSensitiveStartingPlace, competitionarea, plannedendtime, simultaneousstarter, startgroupname, starttime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (event_id, startgroup_id) DO UPDATE SET
            actuallycompleted = excluded.actuallycompleted,
            areaSensitiveStartingPlace = excluded.areaSensitiveStartingPlace,
            competitionarea = excluded.competitionarea,
            plannedendtime = excluded.plannedendtime,
            simultaneousstarter = excluded.simultaneousstarter,
            startgroupname = excluded.startgroupname,
            starttime = excluded.starttime
          RETURNING id
        `,
        args: [
          eventId,
          startGroupId,
          toSqlArg(group.actuallycompleted),
          toSqlArg(group.areaSensitiveStartingPlace),
          toSqlArg(group.competitionarea),
          toSqlArg(group.plannedendtime),
          toSqlArg(group.simultaneousstarter),
          toSqlArg(group.startgroupname),
          toSqlArg(group.starttime),
        ],
      });

      if (startGroupResult.rows.length === 0) {
        throw new Error(`Could not resolve startgroup id for event ${eventId}`);
      }

      const lastStartGroupId = toRequiredInteger(startGroupResult.rows[0].id, "startgroup id");

      if (!Array.isArray(group.categories)) {
        continue;
      }

      if (debug > 0) console.log("groups/single/category: ", group.categories[0], lastStartGroupId);

      for (const category of group.categories) {
        const categoryId = toRequiredInteger(category.id, "category id");
        const categoryName = typeof category.categoryname === "string" ? category.categoryname.trim() : "";

        if (!categoryName) {
          throw new TypeError(`Missing category name for category ${categoryId}`);
        }

        const categoryResult = await db.execute({
          sql: `
            INSERT INTO a_categories (startgroup_id, category_id, agegroup, categoryname, gender, timelimit)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (startgroup_id, category_id) DO UPDATE SET
              agegroup = excluded.agegroup,
              categoryname = excluded.categoryname,
              gender = excluded.gender,
              timelimit = excluded.timelimit
            RETURNING id
          `,
          args: [
            lastStartGroupId,
            categoryId,
            toSqlArg(category.agegroup),
            toSqlArg(category.categoryname),
            toSqlArg(category.gender),
            toSqlArg(category.timelimit),
          ],
        });

        if (categoryResult.rows.length === 0) {
          throw new Error(`Could not resolve category id for start group ${startGroupId}`);
        }

        const lastCategoryId = toRequiredInteger(categoryResult.rows[0].id, "category id");

        if (!Array.isArray(category.forms)) {
          continue;
        }

        if (debug > 0) console.log("groups/single/form: ", category.forms[0], lastCategoryId);

        for (const form of category.forms) {
          const formId = toRequiredInteger(form.id, "form id");
          const formName = typeof form.categoryname === "string" ? form.categoryname.trim() : "";

          if (!formName) {
            throw new TypeError(`Missing form name for form ${formId}`);
          }

          const formResult = await db.execute({
            sql: `
              INSERT INTO a_forms (category_id, form_id, agegroup, categoryname, club, depreferee1id, depreferee2id, depreferee3id, depreferee4id, endingtime, finalscore, gender, mainrefereededuction, mainrefereedeductionjustification, name, notshowedup, placement,rating1,rating2,rating3,rating4,rating5,rating6,rating7,rating8,standarddeviation,startingorder,startingtime)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT (category_id, form_id) DO UPDATE SET
                agegroup = excluded.agegroup,
                categoryname = excluded.categoryname,
                club = excluded.club,
                depreferee1id = excluded.depreferee1id,
                depreferee2id = excluded.depreferee2id,
                depreferee3id = excluded.depreferee3id,
                depreferee4id = excluded.depreferee4id,
                endingtime = excluded.endingtime,
                finalscore = excluded.finalscore,
                gender = excluded.gender,
                mainrefereededuction = excluded.mainrefereededuction,
                mainrefereedeductionjustification = excluded.mainrefereedeductionjustification,
                name = excluded.name,
                notshowedup = excluded.notshowedup,
                placement = excluded.placement,
                rating1 = excluded.rating1,
                rating2 = excluded.rating2,
                rating3 = excluded.rating3,
                rating4 = excluded.rating4,
                rating5 = excluded.rating5,
                rating6 = excluded.rating6,
                rating7 = excluded.rating7,
                rating8 = excluded.rating8,
                standarddeviation = excluded.standarddeviation,
                startingorder = excluded.startingorder,
                startingtime = excluded.startingtime
              RETURNING id
            `,
            args: [
              lastCategoryId,
              formId,
              toSqlArg(form.agegroup),
              toSqlArg(form.categoryname),
              toSqlArg(form.club),
              toSqlArg(form.depreferee1id),
              toSqlArg(form.depreferee2id),
              toSqlArg(form.depreferee3id),
              toSqlArg(form.depreferee4id),
              toSqlArg(form.endingtime),
              toSqlArg(form.finalscore),
              toSqlArg(form.gender),
              toSqlArg(form.mainrefereededuction),
              toSqlArg(form.mainrefereedeductionjustification),
              toSqlArg(form.name),
              toSqlArg(form.notshowedup),
              toSqlArg(form.placement),
              toSqlArg(form.rating1),
              toSqlArg(form.rating2),
              toSqlArg(form.rating3),
              toSqlArg(form.rating4),
              toSqlArg(form.rating5),
              toSqlArg(form.rating6),
              toSqlArg(form.rating7),
              toSqlArg(form.rating8),
              toSqlArg(form.standarddeviation),
              toSqlArg(form.startingorder),
              toSqlArg(form.startingtime),
            ],
          });

          if (formResult.rows.length === 0) {
            throw new Error(`Could not resolve form id for category ${categoryId}`);
          }

          const lastFormId = toRequiredInteger(formResult.rows[0].id, "form id");

          if (!Array.isArray(form.participants)) {
            continue;
          }

          if (debug > 0) console.log("groups/single/participants: ", form.participants[0], lastFormId);

          for (const participant of form.participants) {
            const participantId = toRequiredInteger(participant.id, "participant id");
            const participantName = typeof participant.name === "string" ? participant.name.trim() : "";

            if (!participantName) {
              throw new TypeError(`Missing participant name for participant ${participantId}`);
            }

            const participantResult = await db.execute({
              sql: `
                INSERT INTO a_participants (participant_id, forename, surname, name, club, gender)
                VALUES (?,?,?,?,?,?)
                ON CONFLICT (participant_id) DO UPDATE SET
                  forename = excluded.forename,
                  surname = excluded.surname,
                  name = excluded.name,
                  club = excluded.club,
                  gender = excluded.gender
                RETURNING id
              `,
              args: [
                participantId,
                toSqlArg(participant.forename),
                toSqlArg(participant.surname),
                toSqlArg(participant.name),
                toSqlArg(participant.club),
                toSqlArg(participant.gender),
              ],
            });

            if (participantResult.rows.length === 0) {
              throw new Error(`Could not resolve participant id for participant ${participantId}`);
            }

            const lastParticipantId = toRequiredInteger(participantResult.rows[0].id, "participant id");

            await db.execute({
              sql: `
                INSERT INTO a_forms_participants (form_id, participant_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
              `,
              args: [lastFormId, lastParticipantId],
            });
          }
        }
      }
    }

    // Bump the change counter so that polling clients reload the results.
    await touchEvent(slug);

    return NextResponse.json({ success: true, message: "Data imported successfully" });
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
