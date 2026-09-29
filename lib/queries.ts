import { db, TEvent, TStartgroup } from "@/lib/db";

// Aggregation of a single event including all startgroups -> categories -> forms
// -> participants in one round trip. Columns that are not rendered by the UI are
// deliberately left out to keep the response payload small.
const EVENT_RESULTS_SQL = `
  SELECT
    e.id,
    e.name,
    e.year,
    e.slug,
    e.date,
    e.location,
    e.updated_at,
    (
      SELECT json_group_array(json_object(
        'id', s.id,
        'startgroup_id', s.startgroup_id,
        'actuallycompleted', s.actuallycompleted,
        'areaSensitiveStartingPlace', s.areaSensitiveStartingPlace,
        'competitionarea', s.competitionarea,
        'plannedendtime', s.plannedendtime,
        'startgroupname', s.startgroupname,
        'starttime', s.starttime,
        'categories', json(COALESCE((
          SELECT json_group_array(json_object(
            'id', c.id,
            'agegroup', c.agegroup,
            'categoryname', c.categoryname,
            'gender', c.gender,
            'forms', json(COALESCE((
              SELECT json_group_array(json_object(
                'id', f.id,
                'agegroup', f.agegroup,
                'categoryname', f.categoryname,
                'club', f.club,
                'finalscore', f.finalscore,
                'gender', f.gender,
                'mainrefereededuction', f.mainrefereededuction,
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
                'participants', json(COALESCE((
                  SELECT json_group_array(json_object(
                    'id', p.id,
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
`;

export type TEventResultsPayload = {
  event: TEvent;
  groups: TStartgroup[];
  updatedAt: number;
};

// `a_events.updated_at` was introduced together with the polling endpoints, so
// databases created before that still lack the column. The read paths no longer
// run the full schema setup on every request, therefore the column is added
// lazily the first time a query actually trips over it.
let updatedAtColumnMigration: Promise<void> | null = null;

function isMissingUpdatedAtColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return /no such column/i.test(message) && /updated_at/i.test(message);
}

function addUpdatedAtColumn(): Promise<void> {
  updatedAtColumnMigration ??= db.execute("ALTER TABLE a_events ADD COLUMN updated_at INTEGER").then(
    () => undefined,
    // Another instance may have added the column in the meantime.
    () => undefined,
  );

  return updatedAtColumnMigration;
}

/**
 * Runs a query and, if it failed only because `a_events.updated_at` is missing,
 * adds the column once and retries. In the normal case this costs nothing.
 */
async function withUpdatedAtColumn<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isMissingUpdatedAtColumn(error)) {
      throw error;
    }

    await addUpdatedAtColumn();

    return run();
  }
}

export async function getEvents(): Promise<TEvent[]> {
  const result = await db.execute("SELECT id, name, year, slug, date, location FROM a_events ORDER BY year DESC, name ASC");

  return result.rows as unknown as TEvent[];
}

export async function getEventResults(slug: string): Promise<TEventResultsPayload | null> {
  const result = await withUpdatedAtColumn(() => db.execute({ sql: EVENT_RESULTS_SQL, args: [slug] }));

  if (result.rows.length === 0) {
    return null;
  }

  const { groups: groupsJson, ...event } = result.rows[0] as unknown as TEvent & { groups: string | null };
  const groups = (groupsJson ? JSON.parse(groupsJson) : []) as TStartgroup[];

  return { event, groups, updatedAt: toTimestamp(event.updated_at) };
}

/**
 * Reads only the change counter of an event. This is the query behind the very
 * cheap version endpoint the clients poll.
 */
export async function getEventVersion(slug: string): Promise<number | null> {
  const result = await withUpdatedAtColumn(() => db.execute({ sql: "SELECT updated_at FROM a_events WHERE slug = ?", args: [slug] }));

  if (result.rows.length === 0) {
    return null;
  }

  return toTimestamp(result.rows[0].updated_at);
}

/**
 * Marks an event as changed so that polling clients know they have to reload
 * the (much more expensive) full result payload.
 */
export async function touchEvent(slug: string): Promise<void> {
  await withUpdatedAtColumn(() => db.execute({ sql: "UPDATE a_events SET updated_at = ? WHERE slug = ?", args: [Date.now(), slug] }));
}

function toTimestamp(value: unknown): number {
  const numericValue = typeof value === "bigint" ? Number(value) : typeof value === "number" ? value : Number.NaN;

  return Number.isFinite(numericValue) ? numericValue : 0;
}
