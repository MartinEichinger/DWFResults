import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await params;

    // Get event
    const eventResult = await db.execute({
      sql: 'SELECT * FROM events WHERE slug = ?',
      args: [slug],
    });

    if (eventResult.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult.rows[0];

    // Get groups for this event
    const groupsResult = await db.execute({
      sql: 'SELECT * FROM groups WHERE event_id = ?',
      args: [event.id],
    });

    const groups = groupsResult.rows;

    // Get results for each group
    const groupsWithResults = await Promise.all(
      groups.map(async (group) => {
        const resultsQuery = await db.execute({
          sql: `
            SELECT r.*, a.name as athlete_name, a.club as athlete_club
            FROM results r
            JOIN athletes a ON r.athlete_id = a.id
            WHERE r.group_id = ?
            ORDER BY r.rank ASC
          `,
          args: [group.id],
        });

        return {
          ...group,
          results: resultsQuery.rows,
        };
      })
    );

    return NextResponse.json({
      event,
      groups: groupsWithResults,
    });
  } catch (error) {
    console.error('Error fetching event results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
