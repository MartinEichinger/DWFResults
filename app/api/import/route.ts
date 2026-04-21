import { NextResponse } from 'next/server';
import { db, initDatabase } from '@/lib/db';

// API endpoint for external data import
// Accepts JSON data with events, groups, athletes, and results
export async function POST(request: Request) {
  try {
    await initDatabase();

    // Get API key from headers
    const apiKey = request.headers.get('x-api-key');

    // Basic API key validation (in production, use environment variable)
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Import event
    if (data.event) {
      const { name, year, slug, date, location } = data.event;
      await db.execute({
        sql: `
          INSERT INTO events (name, year, slug, date, location)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            name = excluded.name,
            year = excluded.year,
            date = excluded.date,
            location = excluded.location
        `,
        args: [name, year, slug, date, location],
      });
    }

    // Import athletes
    if (data.athletes && Array.isArray(data.athletes)) {
      for (const athlete of data.athletes) {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO athletes (name, club) VALUES (?, ?)',
          args: [athlete.name, athlete.club || null],
        });
      }
    }

    // Import groups and results
    if (data.groups && Array.isArray(data.groups)) {
      const eventResult = await db.execute({
        sql: 'SELECT id FROM events WHERE slug = ?',
        args: [data.event.slug],
      });

      const eventId = eventResult.rows[0]?.id;

      for (const group of data.groups) {
        // Insert group
        const groupResult = await db.execute({
          sql: 'INSERT INTO groups (event_id, name, category, age_group) VALUES (?, ?, ?, ?)',
          args: [eventId, group.name, group.category || null, group.age_group || null],
        });

        const groupId = groupResult.lastInsertRowid;

        // Insert results for this group
        if (group.results && Array.isArray(group.results)) {
          for (const result of group.results) {
            // Get athlete ID
            const athleteResult = await db.execute({
              sql: 'SELECT id FROM athletes WHERE name = ?',
              args: [result.athlete_name],
            });

            const athleteId = athleteResult.rows[0]?.id;

            if (athleteId) {
              await db.execute({
                sql: `
                  INSERT INTO results (group_id, athlete_id, rank, score, judge_scores, difficulty, execution)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                  groupId,
                  athleteId,
                  result.rank || null,
                  result.score || null,
                  result.judge_scores || null,
                  result.difficulty || null,
                  result.execution || null,
                ],
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Failed to import data', details: String(error) }, { status: 500 });
  }
}
