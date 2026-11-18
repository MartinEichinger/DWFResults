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
  WHERE e.slug = ? AND e.visability = 1
`;

// Fingerprint of the stored event data. It is derived from the data itself
// instead of relying solely on `a_events.updated_at`, because that column is only
// maintained by the import routes - data written through any other path (for
// example directly into the database) would otherwise never be noticed by the
// polling clients.
const EVENT_VERSION_SQL = `
  SELECT
    COALESCE(e.updated_at, 0) AS updated_at,
    COUNT(DISTINCT s.id) AS group_count,
    COUNT(DISTINCT c.id) AS category_count,
    COUNT(f.id) AS form_count,
    COALESCE(MAX(s.id), 0) AS max_group_id,
    COALESCE(MAX(f.id), 0) AS max_form_id,
    COALESCE(MAX(s.actuallycompleted), '') AS last_completed,
    COALESCE(MAX(s.starttime), '') AS last_starttime,
    COALESCE(SUM(COALESCE(f.finalscore, 0)), 0) AS score_sum,
    COALESCE(SUM(COALESCE(f.placement, 0)), 0) AS placement_sum,
    COALESCE(SUM(COALESCE(f.standarddeviation, 0)), 0) AS deviation_sum,
    COALESCE(SUM(COALESCE(f.mainrefereededuction, 0)), 0) AS deduction_sum,
    COALESCE(SUM(COALESCE(f.notshowedup, 0)), 0) AS notshowedup_sum
  FROM a_events e
  LEFT JOIN a_startgroups s ON s.event_id = e.id
  LEFT JOIN a_categories c ON c.startgroup_id = s.id
  LEFT JOIN a_forms f ON f.category_id = c.id
  WHERE e.slug = ? AND e.visability = 1
  GROUP BY e.id
`;

export type TEventResultsPayload = {
  event: TEvent;
  groups: TStartgroup[];
  version: string;
};

// `a_events.updated_at` (polling endpoints) and `a_events.visability` (hiding
// events from the website) were added later on, so older databases still lack
// them. The read paths no longer run the full schema setup on every request,
// therefore the columns are added lazily the first time a query actually trips
// over one of them.
const LATE_EVENT_COLUMNS: Record<string, string> = {
  updated_at: "ALTER TABLE a_events ADD COLUMN updated_at INTEGER",
  // Existing events stay visible.
  visability: "ALTER TABLE a_events ADD COLUMN visability INTEGER NOT NULL DEFAULT 1",
};

const columnMigrations = new Map<string, Promise<void>>();

function findMissingEventColumn(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);

  if (!/no such column/i.test(message)) {
    return null;
  }

  return Object.keys(LATE_EVENT_COLUMNS).find((column) => message.includes(column)) ?? null;
}

function addEventColumn(column: string): Promise<void> {
  const existing = columnMigrations.get(column);

  if (existing) {
    return existing;
  }

  const migration = db.execute(LATE_EVENT_COLUMNS[column]).then(
    () => undefined,
    // Another instance may have added the column in the meantime.
    () => undefined,
  );
  columnMigrations.set(column, migration);

  return migration;
}

/**
 * Runs a query and, if it failed only because one of the later added
 * `a_events` columns is missing, adds the column and retries. In the normal
 * case this costs nothing.
 */
async function withEventColumns<T>(run: () => Promise<T>): Promise<T> {
  // One retry per late column is enough even if all of them are missing.
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const column = findMissingEventColumn(error);

      if (!column || attempt >= Object.keys(LATE_EVENT_COLUMNS).length) {
        throw error;
      }

      await addEventColumn(column);
    }
  }
}

export async function getEvents(): Promise<TEvent[]> {
  const result = await withEventColumns(() => db.execute("SELECT id, name, year, slug, date, location FROM a_events WHERE visability = 1 ORDER BY year DESC, name ASC"));

  return result.rows as unknown as TEvent[];
}

export async function getEventResults(slug: string): Promise<TEventResultsPayload | null> {
  const [result, version] = await Promise.all([withEventColumns(() => db.execute({ sql: EVENT_RESULTS_SQL, args: [slug] })), getEventVersion(slug)]);

  if (result.rows.length === 0) {
    return null;
  }

  const { groups: groupsJson, ...event } = result.rows[0] as unknown as TEvent & { groups: string | null };
  const groups = (groupsJson ? JSON.parse(groupsJson) : []) as TStartgroup[];

  return { event, groups, version: version ?? "" };
}

/**
 * Builds a short fingerprint of the stored event data. This is the query behind
 * the very cheap version endpoint the clients poll: it only aggregates a handful
 * of numbers instead of serialising the whole result tree.
 */
export async function getEventVersion(slug: string): Promise<string | null> {
  const result = await withEventColumns(() => db.execute({ sql: EVENT_VERSION_SQL, args: [slug] }));

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as unknown as Record<string, unknown>;

  return Object.values(row)
    .map((value) => (typeof value === "bigint" ? value.toString() : String(value ?? "")))
    .join("-");
}

/**
 * Marks an event as changed so that polling clients know they have to reload
 * the (much more expensive) full result payload.
 */
export async function touchEvent(slug: string): Promise<void> {
  await withEventColumns(() => db.execute({ sql: "UPDATE a_events SET updated_at = ? WHERE slug = ?", args: [Date.now(), slug] }));
}
