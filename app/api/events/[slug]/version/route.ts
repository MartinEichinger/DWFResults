import { NextResponse } from "next/server";
import { getEventVersion } from "@/lib/queries";

// Extremely cheap endpoint that only reports when an event was last changed.
// The clients poll this instead of holding an open connection or repeatedly
// downloading the full result payload.
export const dynamic = "force-dynamic";
export const maxDuration = 5;

// The response is shared between every visitor of the same event, so it is
// cached on the CDN for a few seconds. With hundreds of clients polling every
// 15 seconds this turns thousands of function invocations per minute into a
// handful, while the answer can never be more than CDN_MAX_AGE_SECONDS plus
// CDN_STALE_SECONDS old.
const CDN_MAX_AGE_SECONDS = 10;
const CDN_STALE_SECONDS = 5;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const version = await getEventVersion(slug);

    if (version === null) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(
      { version },
      {
        headers: {
          // max-age=0 keeps the browser revalidating on every poll, s-maxage lets
          // the CDN answer those revalidations without starting a function.
          "Cache-Control": `public, max-age=0, s-maxage=${CDN_MAX_AGE_SECONDS}, stale-while-revalidate=${CDN_STALE_SECONDS}`,
        },
      },
    );
  } catch (error) {
    console.error("Error fetching event version:", error);
    return NextResponse.json({ error: "Failed to fetch version" }, { status: 500 });
  }
}
