import EventResultsClient from "./EventResultsClient";
import { getEventResults } from "@/lib/queries";

// Results are rendered on the server and revalidated in the background. Visitors
// therefore hit the CDN instead of starting a serverless function, and only the
// tiny version endpoint is polled afterwards.
export const revalidate = 30;

export default async function EventResultsPage({ params }: { params: Promise<{ year: string; slug: string }> }) {
  const { year, slug: slugPart } = await params;
  const slug = `${year}-${slugPart}`;

  let results: Awaited<ReturnType<typeof getEventResults>> = null;

  try {
    results = await getEventResults(slug);
  } catch (error) {
    console.error("Error fetching event results:", error);
  }

  return <EventResultsClient slug={slug} initialEvent={results?.event ?? null} initialGroups={results?.groups ?? []} initialVersion={results?.version ?? null} />;
}
