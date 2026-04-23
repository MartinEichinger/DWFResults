import { NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

// API endpoint for external data import
// Accepts JSON data with events, groups, athletes, and results
export async function POST(request: Request) {
	try {
		// Get API key from Authorization header ("Bearer <token>")
		const authHeader = request.headers.get("Authorization");
		const apiKey = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		const data = await request.json();

		console.log("API Key:", apiKey, "Data:", data);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error importing data:", error);
		return NextResponse.json(
			{ error: "Invalid request" },
			{ status: 400 },
		);
	}
}
