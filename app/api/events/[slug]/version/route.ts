import { NextResponse } from "next/server";
import { getEventVersion } from "@/lib/queries";

// Extremely cheap endpoint that only reports when an event was last changed.
// The clients poll this instead of holding an open connection or repeatedly
// downloading the full result payload.
export const dynamic = "force-dynamic";
export const maxDuration = 5;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const updatedAt = await getEventVersion(slug);

    if (updatedAt === null) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ updatedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching event version:", error);
    return NextResponse.json({ error: "Failed to fetch version" }, { status: 500 });
  }
}
