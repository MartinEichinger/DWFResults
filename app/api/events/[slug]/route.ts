import { NextResponse } from "next/server";
import { db, initDatabase, TEvent, TStartgroup } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await initDatabase();
    const { slug } = await params;

    // Get event including all startgroups -> categories -> forms -> participants in one query
    const eventResult = await db.execute({
      sql: `
        SELECT
          e.*,
          (
            SELECT json_group_array(json_object(
              'id', s.id,
              'event_id', s.event_id,
              'startgroup_id', s.startgroup_id,
              'actuallycompleted', s.actuallycompleted,
              'areaSensitiveStartingPlace', s.areaSensitiveStartingPlace,
              'competitionarea', s.competitionarea,
              'plannedendtime', s.plannedendtime,
              'simultaneousstarter', s.simultaneousstarter,
              'startgroupname', s.startgroupname,
              'starttime', s.starttime,
              'categories', json(COALESCE((
                SELECT json_group_array(json_object(
                  'id', c.id,
                  'startgroup_id', c.startgroup_id,
                  'category_id', c.category_id,
                  'agegroup', c.agegroup,
                  'categoryname', c.categoryname,
                  'gender', c.gender,
                  'timelimit', c.timelimit,
                  'forms', json(COALESCE((
                    SELECT json_group_array(json_object(
                      'id', f.id,
                      'category_id', f.category_id,
                      'form_id', f.form_id,
                      'agegroup', f.agegroup,
                      'categoryname', f.categoryname,
                      'club', f.club,
                      'depreferee1id', f.depreferee1id,
                      'depreferee2id', f.depreferee2id,
                      'depreferee3id', f.depreferee3id,
                      'depreferee4id', f.depreferee4id,
                      'endingtime', f.endingtime,
                      'finalscore', f.finalscore,
                      'gender', f.gender,
                      'mainrefereededuction', f.mainrefereededuction,
                      'mainrefereedeductionjustification', f.mainrefereedeductionjustification,
                      'name', f.name,
                      'notshowedup', f.notshowedup,
                      'placement', f.placement,
                      'rating1', f.rating1,
                      'rating2', f.rating2,
                      'rating3', f.rating3,
                      'rating4', f.rating4,
                      'rating5', f.rating5,
                      'rating6', f.rating6,
                      'rating7', f.rating7,
                      'rating8', f.rating8,
                      'standarddeviation', f.standarddeviation,
                      'startingorder', f.startingorder,
                      'startingtime', f.startingtime,
                      'participants', json(COALESCE((
                        SELECT json_group_array(json_object(
                          'id', p.id,
                          'participant_id', p.participant_id,
                          'forename', p.forename,
                          'surname', p.surname,
                          'name', p.name,
                          'club', p.club,
                          'gender', p.gender
                        ))
                        FROM a_forms_participants fp
                        JOIN a_participants p ON p.id = fp.participant_id
                        WHERE fp.form_id = f.id
                      ), '[]'))
                    ))
                    FROM a_forms f
                    WHERE f.category_id = c.id
                  ), '[]'))
                ))
                FROM a_categories c
                WHERE c.startgroup_id = s.id
              ), '[]'))
            ))
            FROM a_startgroups s
            WHERE s.event_id = e.id
          ) AS groups
        FROM a_events e
        WHERE e.slug = ?
      `,
      args: [slug],
    });

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { groups: groupsJson, ...event } = eventResult.rows[0] as unknown as TEvent & { groups: string | null };
    const groups = (groupsJson ? JSON.parse(groupsJson) : []) as TStartgroup[];

    return NextResponse.json({
      event,
      groups,
    });
  } catch (error) {
    console.error("Error fetching event results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
