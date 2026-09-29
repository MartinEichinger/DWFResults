import { NextResponse } from "next/server";
import { getEventResults } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const results = await getEventResults(slug);

    if (!results) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Clients that already hold the current revision only receive an empty 304,
    // which keeps both the response time and the transferred bytes minimal.
    const etag = `"${slug}-${results.updatedAt}"`;

    if (request.headers.get("If-None-Match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "no-cache" } });
    }

    return NextResponse.json(
      {
        event: results.event,
        groups: results.groups,
        updatedAt: results.updatedAt,
      },
      {
        headers: {
          ETag: etag,
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching event results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
