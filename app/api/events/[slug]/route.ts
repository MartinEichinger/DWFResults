import { NextResponse } from "next/server";
import { getEventResults } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// Clients append the revision they want as ?v=<version>. Because the URL then
// changes whenever the data changes, the payload can be cached on the CDN for a
// long time without ever serving outdated results: a new revision is simply a
// new cache key. Requests without the parameter cannot make that guarantee and
// are therefore answered without a shared cache.
const VERSIONED_CACHE_CONTROL = "public, max-age=30, s-maxage=300, stale-while-revalidate=300";
const UNVERSIONED_CACHE_CONTROL = "private, no-store";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const requestedVersion = new URL(request.url).searchParams.get("v");
    const results = await getEventResults(slug);

    if (!results) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // A stale cache entry would be pinned forever, so only a payload that really
    // matches the requested revision may be cached publicly.
    const cacheControl = requestedVersion && requestedVersion === results.version ? VERSIONED_CACHE_CONTROL : UNVERSIONED_CACHE_CONTROL;

    return NextResponse.json(
      {
        event: results.event,
        groups: results.groups,
        version: results.version,
      },
      {
        headers: {
          ETag: `"${slug}-${results.version}"`,
          "Cache-Control": cacheControl,
        },
      },
    );
  } catch (error) {
    console.error("Error fetching event results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
