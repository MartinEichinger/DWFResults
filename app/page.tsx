import HomeClient from "./HomeClient";
import { getEvents } from "@/lib/queries";

// The event list is statically rendered and revalidated in the background, so
// visitors are served from the CDN instead of starting a serverless function.
export const revalidate = 300;

export default async function Home() {
  let events: Awaited<ReturnType<typeof getEvents>> = [];

  try {
    events = await getEvents();
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return <HomeClient initialEvents={events} />;
}
