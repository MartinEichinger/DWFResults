import { NextResponse } from "next/server";
import { getEvents } from "@/lib/queries";

// The list of events changes very rarely, so it is served from the CDN cache and
// only revalidated in the background. This avoids a function invocation for
// almost every visitor.
export const revalidate = 300;
export const maxDuration = 10;

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
