import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, initDatabase, TEvent } from "@/lib/db";
import { getEvents } from "@/lib/queries";

// The list of events changes very rarely, so it is served from the CDN cache and
// only revalidated in the background. This avoids a function invocation for
// almost every visitor.
export const revalidate = 300;
export const maxDuration = 10;

const YEAR_PATTERN = /^\d{4}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 200;
const MAX_LOCATION_LENGTH = 200;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const events = await getEvents();

    return NextResponse.json(
      { events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400, headers: noStoreHeaders });
}

// Creates a new event ("Veranstaltungstag"), e.g. from the external referee app.
// Body: { event: { name, year, slug, date?, location?, visability? (0 | 1, default 1) } }
// Requires the API key (env API_KEY) as bearer token in the Authorization header.
export async function POST(request: Request) {
  const expectedApiKey = process.env.API_KEY;
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!expectedApiKey || apiKey !== expectedApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid request body");
  }

  const input = body && typeof body === "object" ? ((body as { event?: unknown }).event ?? body) : null;
  if (!input || typeof input !== "object") {
    return badRequest("Invalid request body");
  }

  const { name, year, slug, date, location, visability } = input as Record<string, unknown>;

  const nameText = typeof name === "string" ? name.trim() : "";
  if (!nameText || nameText.length > MAX_NAME_LENGTH) {
    return badRequest(`Der Name ist erforderlich und darf höchstens ${MAX_NAME_LENGTH} Zeichen lang sein.`);
  }

  const yearText = typeof year === "number" ? String(year) : typeof year === "string" ? year.trim() : "";
  if (!YEAR_PATTERN.test(yearText)) {
    return badRequest("Das Jahr muss eine vierstellige Jahreszahl sein.");
  }

  const slugText = typeof slug === "string" ? slug.trim() : "";
  if (!slugText || slugText.length > MAX_SLUG_LENGTH || slugText.includes("/")) {
    return badRequest(`Der Slug ist erforderlich, darf kein "/" enthalten und höchstens ${MAX_SLUG_LENGTH} Zeichen lang sein.`);
  }

  if (date != null && typeof date !== "string") {
    return badRequest("Ungültiges Datum.");
  }
  const dateText = typeof date === "string" ? date.trim() : "";
  if (dateText && !isValidDate(dateText)) {
    return badRequest("Das Datum muss im Format JJJJ-MM-TT angegeben werden.");
  }

  if (location != null && typeof location !== "string") {
    return badRequest("Ungültiger Ort.");
  }
  const locationText = typeof location === "string" ? location.trim() : "";
  if (locationText.length > MAX_LOCATION_LENGTH) {
    return badRequest(`Der Ort darf höchstens ${MAX_LOCATION_LENGTH} Zeichen lang sein.`);
  }

  // Optional, new events are shown on the website by default.
  if (visability != null && visability !== 0 && visability !== 1 && visability !== "0" && visability !== "1" && typeof visability !== "boolean") {
    return badRequest("Die Sichtbarkeit (visability) muss 0 oder 1 sein.");
  }
  const visabilityValue = visability == null ? 1 : visability === true || visability === 1 || visability === "1" ? 1 : 0;

  try {
    await initDatabase();

    const result = await db.execute({
      sql: `
        INSERT INTO a_events (name, year, slug, date, location, updated_at, visability)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id, name, year, slug, date, location, visability
      `,
      args: [nameText, Number.parseInt(yearText, 10), slugText, dateText || null, locationText || null, Date.now(), visabilityValue],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: `Die Veranstaltung ${slugText} existiert bereits.`, slug: slugText }, { status: 409, headers: noStoreHeaders });
    }

    const row = result.rows[0] as unknown as TEvent;
    const event: TEvent = { ...row, id: Number(row.id), year: Number(row.year), visability: Number(row.visability) };

    // The event list is cached (ISR / CDN), make the new event visible right away.
    revalidatePath("/");
    revalidatePath("/api/events");

    return NextResponse.json({ success: true, event }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500, headers: noStoreHeaders });
  }
}
