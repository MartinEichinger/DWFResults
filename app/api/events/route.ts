import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const result = await db.execute("SELECT * FROM a_events ORDER BY year DESC, name ASC");
    return NextResponse.json({ events: result.rows });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
